const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    fullname: {
        type: String,
    },
    email: {
        type: String,
        sparse: true,
        unique: true
    },
    password: {
        type: String,
        required: function () {
            return this.authProvider === 'local';
        },
    },
    onboarded: {
        type: Boolean,
        default: false
    },
    onboardingData: {
        personal: {
            fullname: String,
            gender: String
        },
        links: {
            instagram: String,
            linkedin: String,
        },
        professional: {
            bio: String,
            profession: String
        }
    },
    authProvider: {
        type: String,
        enum: ['google', 'local', 'facebook', 'linkedin', 'x', 'github'],
        default: 'local',
    },
    providerId: {
        type: String
    },
    photo: {
        type: String,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

UserSchema.pre('save', async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt)
        next();
    } catch (error) {
        next(error);
    }
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('User', UserSchema)