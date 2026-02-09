const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Handle newline characters in private key correctly
            privateKey: process.env.FIREBASE_PRIVATE_KEY
                ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                : undefined,
        }),
    });
    console.log('Firebase Admin Initialized');
} catch (error) {
    console.error('Firebase Admin Initialization Error:', error.message);
    // Do not crash, just log. Setup might be incomplete.
}

module.exports = admin;
