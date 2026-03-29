const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL, // Allow configured client URL
].filter(Boolean); // Remote undefined values



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



// Start Server
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
