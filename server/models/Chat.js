const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String }, // Content or Image required logic in controller
    image: { type: String },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' }, // Optional: Link chat to a specific book
    lastMessage: { type: String },
    updatedAt: { type: Date, default: Date.now },
    messages: [MessageSchema] // Embedding messages for simplicity in MERN MVP
});

module.exports = mongoose.model('Chat', ChatSchema);
