const User = require("../models/User");

exports.saveStep1 = async (req, res) => {
    try {
        const { fullname, gender } = req.body;
        const userId = req.user._id
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        user.onboardingData.personal = { fullname, gender }
        await user.save();
        res.status(200).json({ message: "Personal info saved", user})
    } catch (error) {
        res.status(500).json({ message: "Server Error"})
    }
}

exports.saveStep2 = async (req, res) => {
    try {
        const { instagram, linkedin } = req.body;
        const userId = req.user._id
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        user.onboardingData.links = { instagram, linkedin }
        await user.save();
        res.status(200).json({ message: "Links info saved", user})
    } catch (error) {
        res.status(500).json({ message: "Server Error"})
    }
}

exports.saveStep3 = async (req, res) => {
    try {
        const { bio, profession } = req.body;
        const userId = req.user._id
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        user.onboardingData.professional = { bio, profession }
        await user.save();
        res.status(200).json({ message: "bio info saved", user})
    } catch (error) {
        res.status(500).json({ message: "Server Error"})
    }
}

exports.completeOnboarding = async (req, res) => {
    try {
        const userId = req.user._id
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        user.onboarded = true
        await user.save();
        res.status(200).json({ message: "onboarding completed", user})
    } catch (error) {
        res.status(500).json({ message: "Server Error"})
    }
}

exports.fetchDetails = async (req, res) => {
    try {
        const userId = req.user._id
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        };
        res.set("Cache-Control", "no-store");
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
}