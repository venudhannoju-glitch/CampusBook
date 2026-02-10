import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { FaPaperPlane, FaUserCircle, FaPlus, FaTimes, FaSearch } from 'react-icons/fa';

const ENDPOINT = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Chat = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const [socketConnected, setSocketConnected] = useState(false);
    const socketRef = useRef();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Socket Initialization
    useEffect(() => {
        if (currentUser) {
            socketRef.current = io(ENDPOINT);
            socketRef.current.emit("setup", currentUser);
            socketRef.current.on("connected", () => setSocketConnected(true));
        }
    }, [currentUser]);

    // Socket Message Listener
    useEffect(() => {
        if (!socketRef.current) return;

        const messageHandler = (newMessageReceived) => {
            if (!selectedChat || selectedChat._id !== newMessageReceived.chat._id) {
                // notification logic here if needed
            } else {
                setMessages((prev) => [...prev, newMessageReceived]);
            }

            // Update chat list with new last message
            setChats((prev) => prev.map(c =>
                c._id === newMessageReceived.chat._id
                    ? { ...c, lastMessage: newMessageReceived.content || 'Image' }
                    : c
            ));
        };

        socketRef.current.on("message received", messageHandler);

        return () => {
            socketRef.current.off("message received", messageHandler);
        };
    }, [selectedChat]);

    // Fetch Chats
    useEffect(() => {
        const fetchChats = async () => {
            if (!currentUser) return;
            try {
                const token = await currentUser.getIdToken();
                const { data } = await axios.get(`${ENDPOINT}/api/chat`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setChats(data);
            } catch (error) {
                console.error("Error fetching chats:", error);
            }
        };
        fetchChats();
    }, [currentUser]);

    // Auto-select Chat from Navigation State
    useEffect(() => {
        if (location.state?.selectedChatId && chats.length > 0) {
            const chatToSelect = chats.find(c => c._id === location.state.selectedChatId);
            if (chatToSelect) {
                setSelectedChat(chatToSelect);
                setMessages(chatToSelect.messages || []);
                socketRef.current?.emit("join chat", chatToSelect._id);

                // Clear the state so we don't re-select on refresh/updates
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, chats]);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [searching, setSearching] = useState(false);

    // Search Users
    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }
            setSearching(true);
            try {
                const token = await currentUser.getIdToken();
                const { data } = await axios.get(`${ENDPOINT}/api/auth/users?search=${searchQuery}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSearchResults(data);
            } catch (error) {
                console.error(error);
            } finally {
                setSearching(false);
            }
        };
        const delay = setTimeout(searchUsers, 500);
        return () => clearTimeout(delay);
    }, [searchQuery, currentUser]);

    const startNewChat = async (user) => {
        try {
            const token = await currentUser.getIdToken();
            const { data } = await axios.post(
                `${ENDPOINT}/api/chat`,
                { recipientId: user.firebaseUid },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!chats.find(c => c._id === data._id)) {
                setChats(prev => [data, ...prev]);
            }

            setSelectedChat(data);
            setMessages(data.messages || []);
            socketRef.current?.emit("join chat", data._id);

            setShowSearch(false);
            setSearchQuery('');
        } catch (error) {
            console.error("Error creating chat:", error);
            alert("Failed to start chat.");
        }
    };

    // Handle Paste
    const handlePaste = (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                setImage(blob);
                setPreview(URL.createObjectURL(blob));
                e.preventDefault(); // Prevent pasting the image filename/binary string into input
            }
        }
    };

    // Remove Image
    const removeImage = () => {
        setImage(null);
        setPreview('');
    };

    // Handle Send Message
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !image) return;

        // Optimistic Update
        const tempId = Date.now().toString();
        const myParticipant = chats.find(c => c._id === selectedChat._id)?.participants.find(p => p.firebaseUid === currentUser.uid);
        const myId = myParticipant?._id || 'temp_id';

        const optimisticMsg = {
            _id: tempId,
            senderId: myId,
            content: newMessage,
            image: preview, // Show local preview immediately
            timestamp: new Date().toISOString(),
            readBy: [myId],
            status: 'sending'
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');
        setImage(null);
        setPreview('');

        try {
            const token = await currentUser.getIdToken();

            // Use FormData for image upload
            const formData = new FormData();
            formData.append('content', optimisticMsg.content);
            if (image) {
                formData.append('image', image);
            }

            const { data } = await axios.post(
                `${ENDPOINT}/api/chat/${selectedChat._id}/message`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } } // Axios sets multipart/form-data automatically
            );

            // Backend returns the full updated Chat object
            const actualMessage = data.messages[data.messages.length - 1];

            socketRef.current.emit("new message", { chatId: selectedChat._id, ...actualMessage });

            // Replace temp message with actual message
            setMessages(prev => prev.map(msg => msg._id === tempId ? actualMessage : msg));

        } catch (error) {
            console.error("Error sending message:", error);
            // Mark as failed or remove
            setMessages(prev => prev.map(msg => msg._id === tempId ? { ...msg, status: 'failed' } : msg));
        }
    };

    // Select Chat & Load Messages
    const handleChatSelect = async (chat) => {
        setSelectedChat(chat);
        setMessages(chat.messages || []);
        socketRef.current.emit("join chat", chat._id);

        // Mark as Read
        try {
            const token = await currentUser.getIdToken();
            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            await axios.put(`${API_URL}/api/chat/${chat._id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Error marking chat as read:", error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!currentUser) return <div className="p-10 text-center">Please login to chat.</div>;

    return (
        <div className="container mx-auto p-4 h-[calc(100vh-80px)]">
            <div className="bg-white rounded-2xl shadow-lg h-full overflow-hidden flex">
                {/* Sidebar - Chat List */}
                <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                        <button
                            onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); }}
                            className="bg-indigo-100 text-indigo-600 p-2 rounded-full hover:bg-indigo-200 transition"
                            title="Start New Chat"
                        >
                            {showSearch ? <FaTimes /> : <FaPlus />}
                        </button>
                    </div>

                    {/* Search Area */}
                    {showSearch && (
                        <div className="p-4 bg-white border-b border-gray-100">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            {/* Results List */}
                            {searchQuery && (
                                <div className="mt-2 text-sm text-gray-500">
                                    {searching ? 'Searching...' : searchResults.length === 0 ? 'No users found.' : ''}
                                </div>
                            )}
                            <div className="mt-2 max-h-48 overflow-y-auto">
                                {searchResults.map(user => (
                                    <div
                                        key={user.firebaseUid}
                                        onClick={() => startNewChat(user)}
                                        className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded-lg mb-1"
                                    >
                                        {user.profilePic ? (
                                            <img src={user.profilePic} alt={user.name} className="w-8 h-8 rounded-full mr-3" />
                                        ) : (
                                            <FaUserCircle className="text-2xl text-gray-400 mr-3" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-gray-800">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex-grow overflow-y-auto">
                        {chats.length > 0 ? chats.map(chat => {
                            // Find the participant who is NOT the current user
                            const otherUser = chat.participants.find(p => p.firebaseUid !== currentUser.uid);
                            // Find MY Mongo ID from participants
                            const me = chat.participants.find(p => p.firebaseUid === currentUser.uid);

                            // Check for unread messages
                            // (Message is NOT from me AND I haven't read it)
                            const hasUnread = chat.messages.some(msg =>
                                (msg.senderId._id || msg.senderId) !== me?._id &&
                                !msg.readBy.includes(me?._id)
                            );

                            return (
                                <div
                                    key={chat._id}
                                    onClick={() => handleChatSelect(chat)}
                                    className={`p-4 flex items-center cursor-pointer hover:bg-gray-50 transition border-b border-gray-100 ${selectedChat?._id === chat._id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                                >
                                    <div className="mr-4">
                                        {otherUser?.profilePic ? (
                                            <img src={otherUser.profilePic} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <FaUserCircle className="text-4xl text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className={`text-gray-800 ${hasUnread ? 'font-extrabold' : 'font-semibold'}`}>
                                            {otherUser?.name || 'User'}
                                        </h3>
                                        {chat.lastMessage && (
                                            <p className={`text-sm truncate w-48 ${hasUnread ? 'font-bold text-black' : 'text-gray-500'}`}>
                                                {chat.lastMessage}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : <p className="p-4 text-gray-500">No chats yet.</p>}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className={`w-full md:w-2/3 flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 flex items-center bg-white">
                                <button onClick={() => setSelectedChat(null)} className="md:hidden mr-4 text-indigo-600 font-bold">
                                    &larr; Back
                                </button>
                                <FaUserCircle className="text-3xl text-gray-400 mr-3" />
                                <h3 className="font-bold text-gray-800">
                                    {selectedChat.participants.find(p => p.firebaseUid !== currentUser.uid)?.name || 'User'}
                                </h3>
                            </div>

                            {/* Messages */}
                            <div className="flex-grow p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
                                {messages.map((msg, index) => {
                                    // Handle both populated object and direct ID (during optimistic update)
                                    const isMyMessage = (msg.senderId._id || msg.senderId) === (chats.find(c => c._id === selectedChat._id)?.participants.find(p => p.firebaseUid === currentUser.uid)?._id);

                                    return (
                                        <div key={index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isMyMessage ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm rounded-bl-none'}`}>
                                                {msg.image && (
                                                    <img src={msg.image} alt="Sent" className="max-w-full h-auto rounded-lg mb-2" />
                                                )}
                                                {msg.content && <p>{msg.content}</p>}
                                                <div className={`text-xs flex justify-end items-center mt-1 space-x-1 ${isMyMessage ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {msg.status === 'sending' && <span>(Sending...)</span>}
                                                    {msg.status === 'failed' && <span className="text-red-300">(Failed)</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Image Preview */}
                            {preview && (
                                <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 flex items-center">
                                    <div className="relative">
                                        <img src={preview} alt="Preview" className="h-20 w-auto object-cover rounded-md border border-gray-300" />
                                        <button
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                    <span className="ml-3 text-sm text-gray-500">Image attached</span>
                                </div>
                            )}

                            {/* Input Area */}
                            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex items-center">
                                <input
                                    type="text"
                                    placeholder="Type a message... (Ctrl+V to paste image)"
                                    className="flex-grow px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onPaste={handlePaste}
                                />
                                <button type="submit" className="ml-3 bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition shadow-lg">
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col justify-center items-center text-gray-400 bg-gray-50">
                            <FaPaperPlane className="text-6xl mb-4 text-gray-300" />
                            <p className="text-xl">Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
