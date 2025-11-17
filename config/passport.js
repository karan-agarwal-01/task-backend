const passport = require('passport');
const User = require('../models/User');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2-v2').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const { saveImageFromUrl } = require("../utils/saveImage");

const dotenv = require('dotenv')

dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        const photoUrl = profile.photos?.[0]?.value;
        const storedPhoto = await saveImageFromUrl(photoUrl); 
        let user = await User.findOne({ authProvider: 'google', providerId: profile.id }) || await User.findOne({ email })
        if (!user) {
            user = await User.create({
                authProvider: 'google',
                providerId: profile.id,
                fullname: profile.displayName,
                email,
                photo: storedPhoto,
            });
        } else {
            user.authProvider = 'google';
            user.providerId = profile.id;
            user.photo = storedPhoto;
            await user.save();
        }
        
        return done(null, user);
    } catch (error) {
        console.log("Google Auth Error");
        return done(error, null);
    }
}));

// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_APP_ID,
//     clientSecret: process.env.FACEBOOK_APP_SECRET,
//     callbackURL: `${process.env.BASE_URL}/api/auth/facebook/callback`,
//     profileFields: ["id", "displayName", "emails", "photos"],
// },
// async (accessToken, refreshToken, profile, done) => {
//     try {
//         const email = profile.emails?.[0]?.value;
//         let user = await User.findOne({ authProvider: 'facebook', providerId: profile.id }) || await User.findOne({ email });

//         if (!user) {
//             user = await User.create({
//                 authProvider: 'facebook',
//                 providerId: profile.id,
//                 fullname: profile.displayName,
//                 email,
//                 photo: profile.photos?.[0]?.value,
//             });
//         } else {
//             user.authProvider = 'facebook';
//             user.providerId = profile.id;
//             user.photo = user.photo || profile.photos?.[0]?.value;
//             await user.save();
//         }
        
//         return done(null, user);
//     } catch (error) {
//         console.log("Google Auth Error");
//         return done(error, null);
//     }
// }));

passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/api/auth/linkedin/callback`,
    scope: ["openid", "profile", "email"],
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile._json?.email;
        const picture = profile._json?.picture;
        const storedPhoto = picture ? await saveImageFromUrl(picture) : null;
        const fullname = profile._json?.name;
        // console.log("LinkedIn profile:", profile);

        let user = await User.findOne({ authProvider: 'linkedin', providerId: profile.id }) || await User.findOne({ email });

        if (!user) {
            user = await User.create({
                authProvider: 'linkedin',
                providerId: profile.id,
                fullname,
                email,
                photo: storedPhoto,
            });
        } else {
            user.authProvider = 'linkedin';
            user.providerId = profile.id;
            user.photo = user.photo || profile.picture || storedPhoto;
            await user.save();
        }

        return done(null, user);
    } catch (error) {
        console.log("LinkedIn Auth Error:", error);
        return done(error, null);
    }
}));


passport.use(new InstagramStrategy({
    clientID: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/api/auth/instagram/callback`
},
async (accessToken, refreshToken, profile, done) => {
    try {
        // console.log("Instagram profile:", profile);

        const fullname = profile.displayName;
        const photo = profile._json?.data?.profile_picture;

        let user = await User.findOne({ authProvider: 'instagram', providerId: profile.id });

        if (!user) {
            user = await User.create({
                authProvider: 'instagram',
                providerId: profile.id,
                fullname: fullname || "Instagram User",
                photo,
            });
        } else {
            user.authProvider = 'instagram';
            user.providerId = profile.id;
            user.photo = user.photo || photo;
            await user.save();
        }

        return done(null, user);

    } catch (error) {
        console.log("Instagram Auth Error:", error);
        return done(error, null);
    }
}));


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;