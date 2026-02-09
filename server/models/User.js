const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    profilePic: { type: String, default: '' },
    college: { type: String, required: true }, // e.g., "IIT Bombay"
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
