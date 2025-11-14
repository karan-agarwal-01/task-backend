const express = require('express');
const { loginUser, registerUser, forgetPassword, resetPassword } = require('../controllers/auth.controllers');
const router = express.Router();
const passport = require('passport');
const generateToken = require('../utils/generateToken');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/forgot-password', forgetPassword);
router.post('/reset-password/:token', resetPassword);

router.get("/me", (req, res) => {
  if (!req.user) return res.json({ user: null });
  return res.json({ user: req.user });
});


router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: "/login" }),
  (req, res) => {
    const jwt = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/social-success?token=${jwt}`);
  }
);

router.get("/linkedin", passport.authenticate("linkedin", { state: true }));

router.get("/linkedin/callback", passport.authenticate("linkedin", { failureRedirect: "/login" }),
  (req, res) => {
    const jwt = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/social-success?token=${jwt}`);
  }
);

router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));

router.get("/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/login" }),
  (req, res) => {
    const jwt = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/social-success?token=${jwt}`);
  }
);

router.get("/instagram", passport.authenticate("instagram"));

router.get("/instagram/callback", passport.authenticate("instagram", { failureRedirect: "/login" }),
  (req, res) => {
    const jwt = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/social-success?token=${jwt}`);
  }
);

module.exports = router;