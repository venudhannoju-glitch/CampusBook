const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Book = require('./models/Book');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected for Import'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

const importData = async () => {
    try {
        const dataPath = path.join(__dirname, '../books_dump.json');
        const jsonData = fs.readFileSync(dataPath, 'utf-8');
        const books = JSON.parse(jsonData);

        console.log(`Found ${books.length} books to import.`);

        // Optional: Clear existing books to avoid duplicates if running multiple times
        // await Book.deleteMany(); 
        // console.log('Cleared existing books.');

        // Or use insertMany with ordered: false to continue if some IDs exist
        // However, standard insertMany will fail if _id duplicates exist.
        // Let's filter out books that might already exist or just try/catch individually if we want to be safe.
        // For simplicity and speed in this one-off:

        try {
            await Book.insertMany(books, { ordered: false });
            console.log('Data Imported Successfully!');
        } catch (error) {
            if (error.code === 11000) {
                console.log('Some books were skipped because they already exist (_id duplicate).');
                console.log(`Inserted count: ${error.result.nInserted}`);
            } else {
                throw error;
            }
        }

        process.exit();
    } catch (error) {
        console.error('Error with data import:', error);
        process.exit(1);
    }
};

importData();
