const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL, // Allow configured client URL
].filter(Boolean); // Remote undefined values

const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                // Temporarily allow all for easier deployment debugging if needed, 
                // or strict: callback(new Error('Not allowed by CORS'));
                // For this user, let's be permissible for now to avoid specific URL issues during setup
                callback(null, true);
            }
        },
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
    res.send('CampusBooks API is running...');
});

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    // useNewUrlParser: true, 
    // useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB Connected');
}).catch(err => {
    console.error('MongoDB Connection Error:', err);
});

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('New Socket Connected:', socket.id);

    socket.on('setup', (userData) => {
        socket.join(userData);
        socket.emit('connected');
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log('User joined Room: ' + room);
    });

    socket.on('new message', (newMessageRecieved) => {
        var chat = newMessageRecieved.chatId;
        if (!chat) return console.log("Chat.users not defined");

        // Broadcast to others in room
        socket.in(chat).emit("message recieved", newMessageRecieved);
    });
});

// Start Server
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
