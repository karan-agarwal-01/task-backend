const express = require('express');
const { loginUser, registerUser } = require('../controllers/auth.controllers');
const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);

module.exports = router;