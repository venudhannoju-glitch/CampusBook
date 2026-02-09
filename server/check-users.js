const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const users = await User.find({});
        console.log(`Found ${users.length} users in database:`);
        users.forEach(u => {
            console.log(`- Name: ${u.name}, FirebaseUID: ${u.firebaseUid}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkUsers();
