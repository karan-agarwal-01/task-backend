const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const crypto = require('crypto');
const { getResetPasswordToken } = require("../utils/getResetPasswordToken");
const transport = require("../utils/transport");

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
