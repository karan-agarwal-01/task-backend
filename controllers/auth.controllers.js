const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const crypto = require('crypto');
const { getResetPasswordToken } = require("../utils/getResetPasswordToken");
const transport = require("../utils/transport");
const axios = require('axios');
const { createPKCEPair } = require("../utils/pkce");

exports.registerUser = async (req, res) => {   
    
    const {email, password} = req.body;
    
    if (!email || !password) {
        return res.status(400).json({message: 'Please enter all fields'});
    }

    const userExists = await User.findOne({ email })

    if (userExists) {
        return res.status(400).json({message: 'User already exits'});
    }

    const user = await User.create({email, password})

    if (user) {
        res.status(201).json({_id: user._id, email: user.email, token: generateToken(user._id)})
    } else {
        res.status(400).json({ message: 'Invalid user data' })
    }
}

exports.loginUser =  async (req, res) => {
    
    const { email, password } = req.body;

    const user = await User.findOne({ email })

    if (user && (await user.matchPassword(password))) {
        res.json({ _id: user._id, email: user.email, token: generateToken(user._id), onboarded: user.onboarded});
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
}

exports.forgetPassword = async (req, res) => {
    try {
        const {email} = req.body;
        const user = await User.findOne({ email })
       
        if (!user) {
            return res.status(404).json({ message:  "user not found"})
        }
       
        const { resetToken, resetTokenHash } = getResetPasswordToken();
        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
        
        await user.save();
       
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        await transport.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password reset request',
            html: `
                <p>Hello user,</p>
                <p>We received a request to reset your password.</p>
                <p>Click the link below to set a new password:</p>
                <a href="${resetLink}" target="_blank">${resetLink}</a>
                <p>This link will expire in 15 minutes.</p>
            `
        });
        res.status(200).json({ message: "Reset email sent successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const {token} = req.params;
        const {password} = req.body;
        
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')
        
        const user = await User.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpire: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        
        await user.save();
        
        res.status(200).json({ message: "Password reset successfully"})
    } catch (error) {
         res.status(400).json({ message: "Invalid or expired token"})
    }
};

exports.facebookLogin = async (req, res) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ message: 'Access token is required' });
        }

        // Verify token and get user info from Facebook Graph API
        const userResponse = await axios.get(
            `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
        );

        const { id, name, email, picture } = userResponse.data;

        if (!id) {
            return res.status(400).json({ message: 'Invalid access token' });
        }

        // Find or create user
        let user;
        if (email) {
            user = await User.findOne({ 
                $or: [
                    { authProvider: 'facebook', providerId: id },
                    { email: email }
                ]
            });
        } else {
            user = await User.findOne({ 
                authProvider: 'facebook', 
                providerId: id 
            });
        }

        const pictureUrl = picture?.data?.url || picture;

        if (!user) {
            // Create new user
            user = await User.create({
                authProvider: 'facebook',
                providerId: id,
                fullname: name || 'Facebook User',
                email: email || undefined,
                photo: pictureUrl,
            });
        } else {
            // Update existing user
            user.authProvider = 'facebook';
            user.providerId = id;
            if (name) user.fullname = user.fullname || name;
            if (email) user.email = email;
            if (pictureUrl) user.photo = user.photo || pictureUrl;
            await user.save();
        }

        // Generate JWT token
        const token = generateToken(user._id);

        res.status(200).json({
            _id: user._id,
            email: user.email,
            fullname: user.fullname,
            token,
            onboarded: user.onboarded,
            photo: user.photo
        });

    } catch (error) {
        console.error('Facebook login error:', error.response?.data || error.message);
        res.status(401).json({ 
            message: error.response?.data?.error?.message || 'Facebook authentication failed' 
        });
    }
};

exports.XLogin = (req, res) => {
    const twitterURL = `https://twitter.com/i/oauth2/authorize?` + `response_type=code&client_id=${process.env.X_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.BASE_URL}/api/auth/x/callback`)}` + `&scope=tweet.read users.read offline.access` + `&state=state123&code_challenge=challenge&code_challenge_method=plain`;
    res.json({ url: twitterURL });
}

exports.XLoginCallback = async (req, res) => {
    const { code } = req.query;

    try {
      const response = await axios.post( "https://api.twitter.com/2/oauth2/token", new URLSearchParams({
          code,
          grant_type: "authorization_code",
          client_id: process.env.X_CLIENT_ID,
          redirect_uri: `${process.env.BASE_URL}/api/auth/x/callback`,
          code_verifier: "challenge"
        }),
        { 
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: "Basic " + Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString("base64")
            }
        }
      );

      const access_token = response.data.access_token;
      const userRes = await axios.get("https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username", {
        headers: { Authorization: `Bearer ${access_token}` }
      })

      const xUser = userRes.data.data;

      let user = await User.findOne({ authProvider: "x", providerId: xUser.id }) || null;
      if (!user) {
        user = await User.create({
            authProvider: "x",
            providerId: xUser.id,
            fullname: xUser.name,
            username: xUser.username,
            photo: xUser.profile_image_url
        });
      } else {
        user.fullname = xUser.name;
        user.username = xUser.username;
        user.photo = xUser.profile_image_url;
        await user.save();
      }
      const jwt = generateToken(user._id);
      res.redirect(`${process.env.FRONTEND_URL}/auth/social-success?token=${jwt}`);
    } catch (err) {
      console.log(err.response?.data || err);
      res.send("Error logging in with X");
    }
}

exports.GithubLogin = (req, res) => {
    const redirectURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user`;
    res.json({ url: redirectURL });
};

exports.GithubLoginCallback = async (req, res) => {
    const { code } = req.query;
    try {
        const tokenRes = await axios.post("https://github.com/login/oauth/access_token",{
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code
        }, { headers: { Accept: "application/json" }})

        const access_token = tokenRes.data.access_token;

        const userRes = await axios.get("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${access_token}` }
        })

        const gitUser = userRes.data;
        let email = gitUser.email;
        if (!email) {
            const emailRes = await axios.get("https://api.github.com/user/emails", {
                headers: { Authorization: `Bearer ${access_token}` },
            })

            const primaryEmail = emailRes.data.find((e) => e.primary);
            email = primaryEmail?.email
        };

        let user = await User.findOne({authProvider: "github", providerId: gitUser.id}) || await User.findOne({ email })
        if (!user) {
            user = await User.create({
                authProvider: "github",
                providerId: gitUser.id,
                fullname: gitUser.name || gitUser.login,
                email,
                photo: gitUser.avatar_url
            })
        } else {
            user.authProvider = "github";
            user.providerId = gitUser.id;
            user.photo = user.photo || gitUser.avatar_url;
            await user.save();
        }
        const jwt = generateToken(user._id);
        res.redirect(`${process.env.FRONTEND_URL}/auth/social-success?token=${jwt}`);
    } catch (error) {
        console.log(error);
        res.send("GitHub Login Error")
    }
}