const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// Get Current User / Create if not exists
router.post('/me', verifyToken, async (req, res) => {
    const { uid, email, name, picture } = req.user; // properties from decoded token

    try {
        let user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            // Create new user
            // Note: 'name' and 'picture' might need to be passed in body if not in token
            user = new User({
                firebaseUid: uid,
                email,
                name: req.body.name || 'Student',
                profilePic: req.body.profilePic || picture,
                college: 'Institute of Technology', // Default for MVP
            });
            await user.save();
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Search Users
router.get('/users', verifyToken, async (req, res) => {
    const { search } = req.query;
    try {
        let query = {
            firebaseUid: { $ne: req.user.uid } // Exclude self
        };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Limit results to avoid massive payload
        const users = await User.find(query)
            .select('name email profilePic firebaseUid')
            .limit(20);

        res.json(users);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
