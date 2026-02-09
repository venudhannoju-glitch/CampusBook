import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';
import { FaPaperPlane, FaUserCircle } from 'react-icons/fa';

const ENDPOINT = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Chat = () => {
    const { currentUser } = useAuth();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socketRef = useRef();
    const messagesEndRef = useRef(null);

    // Initialize Socket
    useEffect(() => {
        if (currentUser) {
            socketRef.current = io(ENDPOINT);
            socketRef.current.emit("setup", currentUser.uid);
            socketRef.current.on("connected", () => console.log("Socket Connected"));

            socketRef.current.on("message recieved", (newMessageRecieved) => {
                if (
                    !selectedChat || // if chat is not selected or doesn't match current chat
                    selectedChat._id !== newMessageRecieved.chat
                ) {
                    // TODO: Give notification
                } else {
                    setMessages(prev => [...prev, newMessageRecieved]);
                }
            });
        }
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [currentUser, selectedChat]);

    // Fetch Chats
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const token = await currentUser?.getIdToken();
                const { data } = await axios.get(`${ENDPOINT}/api/chat`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setChats(data);
            } catch (error) {
                console.error("Error fetching chats:", error);
            }
        };
        if (currentUser) fetchChats();
    }, [currentUser]);

    // Handle Send Message
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // Optimistic Update
        const tempId = Date.now().toString();
        const myParticipant = chats.find(c => c._id === selectedChat._id)?.participants.find(p => p.firebaseUid === currentUser.uid);
        const myId = myParticipant?._id || 'temp_id'; // Fallback if not loaded yet

        const optimisticMsg = {
            _id: tempId,
            senderId: myId, // Use simpler ID for local display
            content: newMessage,
            timestamp: new Date().toISOString(),
            readBy: [myId],
            status: 'sending'
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');

        try {
            const token = await currentUser.getIdToken();
            const { data } = await axios.post(
                `${ENDPOINT}/api/chat/${selectedChat._id}/message`,
                { content: optimisticMsg.content },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Backend returns the full updated Chat object
            // We need to extract the LAST message from it
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
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                    </div>
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

                                    // Fallback: compare with currentUser.uid indirectly via the participant list we have
                                    // Actually better: we accept that we might need myId from backend.
                                    // Simple hack: assume messages from "me" are right aligned.
                                    // Let's rely on exact SenderId match if possible, or context.

                                    // Better approach: We know "my" Mongo ID is not available in frontend directly unless we fetch it.
                                    // BUT, we can check if senderId is NOT the other user's ID.
                                    // For now, let's trust the senderId is populate.
                                    // Wait, new message optimistic update only has ID.

                                    return (
                                        <div key={index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isMyMessage ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm rounded-bl-none'}`}>
                                                <p>{msg.content}</p>
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

                            {/* Input Area */}
                            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex items-center">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="flex-grow px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
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
