const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    age: Number,
    mobile: String,
    email: String,
    password: String,
     passwordResetToken: String,
    passwordResetExpires: Date
});

module.exports = mongoose.model('User', userSchema);