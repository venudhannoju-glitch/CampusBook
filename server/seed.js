const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Book = require('./models/Book');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Read JSON file
const books = JSON.parse(fs.readFileSync(path.join(__dirname, 'books_dump.json'), 'utf-8'));

const importData = async () => {
    try {
        // Option 1: Clear existing data (Uncomment if needed)
        // await Book.deleteMany(); 

        // Option 2: Upsert (Update if exists, Insert if new)
        for (const book of books) {
            await Book.findByIdAndUpdate(book._id, book, { upsert: true, new: true });
        }

        console.log('Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error('Error with data import:', error);
        process.exit(1);
    }
};

importData();
