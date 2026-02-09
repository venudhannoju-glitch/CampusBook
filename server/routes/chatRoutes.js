const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// Helper to get Mongo ID from Firebase UID
const getUserId = async (firebaseUid) => {
    const user = await User.findOne({ firebaseUid });
    return user ? user._id : null;
};

// Get My Chats
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = await getUserId(req.user.uid);
        if (!userId) {
            return res.status(404).json({ message: 'User not found' });
        }

        const chats = await Chat.find({
            participants: userId
        }).populate('participants', 'name profilePic firebaseUid').sort({ updatedAt: -1 });
        res.json(chats);
    } catch (error) {
        console.error("Fetch Chats Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Create or Access Chat
router.post('/', verifyToken, async (req, res) => {
    const { recipientId } = req.body; // Firebase UID of the other user

    if (!recipientId) {
        return res.status(400).json({ message: "Recipient ID required" });
    }

    try {
        const myId = await getUserId(req.user.uid);
        const otherId = await getUserId(recipientId);

        console.log(`Chat Request - My UID: ${req.user.uid} -> DB ID: ${myId}`);
        console.log(`Chat Request - Other UID: ${recipientId} -> DB ID: ${otherId}`);

        if (!myId || !otherId) {
            console.log("Chat verification failed: User not found in DB");
            return res.status(404).json({ message: "User not found" });
        }

        // Check if chat exists
        let isChat = await Chat.find({
            participants: { $all: [myId, otherId] }
        }).populate('participants', '-password');

        if (isChat.length > 0) {
            res.send(isChat[0]);
        } else {
            // Create New Chat
            const chatData = {
                participants: [myId, otherId],
                messages: []
            };
            const createdChat = await Chat.create(chatData);
            const fullChat = await Chat.findOne({ _id: createdChat._id }).populate('participants', '-password');
            res.status(200).json(fullChat);
        }
    } catch (error) {
        console.error("Access Chat Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Send Message
router.post('/:chatId/message', verifyToken, async (req, res) => {
    const { content } = req.body;
    const { chatId } = req.params;

    if (!content || !chatId) {
        return res.status(400).json({ message: "Invalid data passed into request" });
    }

    try {
        const myId = await getUserId(req.user.uid);

        const newMessage = {
            senderId: myId,
            content: content,
            readBy: [myId], // Sender has read their own message
            timestamp: new Date()
        };

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            {
                $push: { messages: newMessage },
                lastMessage: content,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('participants', '-password');

        res.json(updatedChat);
    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Get Total Unread Count
router.get('/unread/count', verifyToken, async (req, res) => {
    try {
        const userId = await getUserId(req.user.uid);
        if (!userId) return res.status(404).json({ count: 0 });

        const chats = await Chat.find({ participants: userId });

        let totalUnread = 0;
        chats.forEach(chat => {
            chat.messages.forEach(msg => {
                if (!msg.readBy.includes(userId)) {
                    totalUnread++;
                }
            });
        });

        res.json({ count: totalUnread });
    } catch (error) {
        console.error("Unread Count Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Mark Chat as Read
router.put('/:chatId/read', verifyToken, async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = await getUserId(req.user.uid);

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: "Chat not found" });

        // Update all messages where user is not in readBy
        chat.messages.forEach(msg => {
            if (!msg.readBy.includes(userId)) {
                msg.readBy.push(userId);
            }
        });

        await chat.save();
        res.json({ success: true });
    } catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
