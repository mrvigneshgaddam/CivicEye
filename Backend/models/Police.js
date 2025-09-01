const mongoose = require('mongoose');

const policeSchema = new mongoose.Schema({
    policeId: String,
    batchNo: String,
    rank: String,
    phone: String,
    station: String,
    email: String,
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    isAdmin: { type: Boolean, default: false }
});

module.exports = mongoose.model('Police', policeSchema);