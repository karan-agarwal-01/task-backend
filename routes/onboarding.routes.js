const express = require('express');
const { auth } = require('../middleware/auth.middleware');
const { saveStep1, saveStep2, saveStep3, completeOnboarding, fetchDetails } = require('../controllers/onboarding.controllers');
const router = express.Router();

router.post('/personal', auth, saveStep1);
router.post('/links', auth, saveStep2);
router.post('/professional', auth, saveStep3);
router.post('/complete', auth, completeOnboarding);
router.get('/me', auth, fetchDetails);

module.exports = router;