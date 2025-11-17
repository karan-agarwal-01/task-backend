const express = require('express');
const { loginUser, registerUser, forgetPassword, resetPassword, facebookLogin, XLogin, XLoginCallback, GithubLogin, GithubLoginCallback } = require('../controllers/auth.controllers');
const router = express.Router();
const passport = require('passport');
const crypto = require("crypto");
const generateToken = require('../utils/generateToken');
const { default: axios } = require('axios');
const User = require('../models/User');


router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/forgot-password', forgetPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/facebook', facebookLogin);

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

router.get('/github/login', GithubLogin);
router.get('/github/callback', GithubLoginCallback);

router.get('/x/login', XLogin);
router.get('/x/callback', XLoginCallback);

module.exports = router;