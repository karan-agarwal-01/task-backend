const crypto = require('crypto');

exports.getResetPasswordToken = () => {
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    return { resetToken, resetTokenHash };
};