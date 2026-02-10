const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    sellerId: { type: String, required: true, index: true }, // Firebase UID
    title: { type: String, required: true },
    author: { type: String, required: true },
    edition: { type: String },
    price: { type: Number, required: true },
    images: [{ type: String }], // Array of Cloudinary URLs
    condition: { type: Number, min: 1, max: 5, required: true },
    courseCode: { type: String }, // e.g., "CS101"
    description: { type: String }, // Optional book description
    status: { type: String, enum: ['Available', 'Sold', 'Reserved'], default: 'Available' },
    location: { type: String }, // e.g., "Hostel 4 Canteen"
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', BookSchema);
