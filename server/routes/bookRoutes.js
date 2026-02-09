const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const verifyToken = require('../middleware/authMiddleware');

// Get All Books (with optional Search)
router.get('/', async (req, res) => {
    const { search, course, minPrice, maxPrice, seller } = req.query;
    // TODO: Implement advanced filtering
    try {
        let query = { status: 'Available' };

        if (seller) {
            query.sellerId = seller;
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { courseCode: { $regex: search, $options: 'i' } }
            ];
        }
        const books = await Book.find(query).sort({ title: 1 });
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
