const mongoose = require('mongoose');
const Book = require('./models/Book');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const fs = require('fs');

async function checkBooks() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const books = await Book.find({}).sort({ createdAt: -1 }).limit(5);

        fs.writeFileSync('books_dump.json', JSON.stringify(books, null, 2));
        console.log("Dumped books to books_dump.json");

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkBooks();
