const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const verifyToken = require('../middleware/authMiddleware');

// Get All Books (with optional Search)
router.get('/', async (req, res) => {
    const { search, course, minPrice, maxPrice, seller } = req.query;
    // TODO: Implement advanced filtering
    try {
        let query = {};

        if (seller) {
            query.sellerId = seller;
        } else {
            query.status = 'Available';
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { courseCode: { $regex: search, $options: 'i' } }
            ];
        }
        const books = await Book.find(query).sort({ createdAt: -1 }); // Sort by newest first
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');

// Post a Book
router.post('/', verifyToken, upload.array('images', 5), async (req, res) => {
    try {
        const imageFiles = req.files;
        const imageUrls = [];

        // Upload images to Cloudinary
        if (imageFiles && imageFiles.length > 0) {
            for (const file of imageFiles) {
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'campusbooks' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(file.buffer);
                });
                imageUrls.push(result.secure_url);
            }
        }

        const newBook = new Book({
            sellerId: req.user.uid, // Use UID from verified token
            userId: req.user.uid,   // Keep for backward compatibility if needed
            ...req.body,
            images: imageUrls.length > 0 ? imageUrls : ['https://via.placeholder.com/300?text=No+Image']
        });

        const savedBook = await newBook.save();
        res.json(savedBook);
    } catch (error) {
        console.error("Error posting book:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Update a Book
router.put('/:id', verifyToken, upload.array('images', 5), async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Check ownership
        if (book.sellerId !== req.user.uid) {
            return res.status(403).json({ message: 'Not authorized to update this book' });
        }

        // Process new images if any
        const imageFiles = req.files;
        let finalImageUrls = book.images || [];

        if (imageFiles && imageFiles.length > 0) {
            const newImageUrls = [];
            for (const file of imageFiles) {
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'campusbooks' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(file.buffer);
                });
                newImageUrls.push(result.secure_url);
            }
            // Logic: Append new images.
            // If user wants to delete specific images, that's a separate complex UI logic.
            // For now, just append.
            finalImageUrls = [...finalImageUrls, ...newImageUrls];
        }

        // Update fields
        book.title = req.body.title || book.title;
        book.author = req.body.author || book.author;
        book.price = req.body.price || book.price;
        book.courseCode = req.body.courseCode || book.courseCode;
        book.condition = req.body.condition || book.condition;
        book.description = req.body.description || book.description;
        book.location = req.body.location || book.location;
        book.images = finalImageUrls;

        const updatedBook = await book.save();
        res.json(updatedBook);

    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// Delete a Book
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Check if user is the owner
        if (book.sellerId !== req.user.uid) {
            return res.status(403).json({ message: 'Not authorized to delete this book' });
        }

        // Delete from Cloudinary (Optional but recommended)
        // const publicIds = book.images.map(url => url.split('/').pop().split('.')[0]);
        // await cloudinary.api.delete_resources(publicIds); 

        await Book.findByIdAndDelete(req.params.id);

        res.json({ message: 'Book removed' });
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
