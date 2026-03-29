import { useState, useEffect, useRef } from 'react';
import { useAuth, db } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import axios from 'axios';
import { FaPaperPlane, FaUserCircle, FaPlus, FaTimes, FaSearch, FaEdit, FaTrash, FaGavel, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ENDPOINT = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper to safely parse if a message is a Bid
const parseMessageContent = (content) => {
    if (content && content.startsWith('{"type":"bid"')) {
        try {
            return { isBid: true, data: JSON.parse(content) };
        } catch { return { isBid: false }; }
    }
    return { isBid: false };
};

const Chat = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [image, setImage] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [preview, setPreview] = useState('');
    const [bidAmount, setBidAmount] = useState('');

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Firestore Message Listener
    useEffect(() => {
        if (!selectedChat) return;

        const q = query(
            collection(db, 'chats', selectedChat._id, 'messages'),
            orderBy('timestamp')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added" || change.type === "modified") {
                    const newMsg = change.doc.data();
                    setMessages(prev => {
                        const exists = prev.find(m => m._id === newMsg._id);
                        if (exists) {
                            return prev.map(m => m._id === newMsg._id ? newMsg : m);
                        }
                        return [...prev, newMsg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                    });

                    // Update chat list lastMessage
                    setChats((prevChats) => prevChats.map(c =>
                        c._id === selectedChat._id
                            ? { ...c, lastMessage: parseMessageContent(newMsg.content).isBid ? '🎫 Bidding Offer' : (newMsg.content || 'Image') }
                            : c
                    ));
                }
                if (change.type === "removed") {
                    setMessages(prev => prev.filter(m => m._id !== change.doc.id));
                }
            });
        }, (error) => {
            console.error("Firestore Error:", error);
        });

        return () => unsubscribe();
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

                // Format lastMessage if it's a bid
                const formattedChats = data.map(chat => {
                    if (parseMessageContent(chat.lastMessage).isBid) chat.lastMessage = '🎫 Bidding Offer';
                    return chat;
                });

                setChats(formattedChats);
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
            setShowSearch(false);
            setSearchQuery('');
        } catch (error) {
            console.error("Error creating chat:", error);
            alert("Failed to start chat.");
        }
    };

    const handlePaste = (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                setImage(blob);
                setPreview(URL.createObjectURL(blob));
                e.preventDefault();
            }
        }
    };

    const removeImage = () => {
        setImage(null);
        setPreview('');
    };

    // Central Send Message Function
    const sendRawMessage = async (textContent, imageBlob = null, isBidObj = false) => {
        if (!textContent?.trim() && !imageBlob) return;

        // Optimistic Update
        const tempId = Date.now().toString();
        const myParticipant = chats.find(c => c._id === selectedChat._id)?.participants.find(p => p.firebaseUid === currentUser.uid);
        const myId = myParticipant?._id || 'temp_id';

        const optimisticMsg = {
            _id: tempId,
            senderId: myId,
            content: textContent,
            image: imageBlob ? URL.createObjectURL(imageBlob) : null,
            timestamp: new Date().toISOString(),
            readBy: [myId],
            status: 'sending'
        };

        setMessages(prev => [...prev, optimisticMsg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));

        if (!isBidObj && !editingMessageId) {
            setNewMessage('');
            setImage(null);
            setPreview('');
        }

        try {
            const token = await currentUser.getIdToken();

            // If Editing
            if (editingMessageId && !isBidObj) {
                await axios.put(`${ENDPOINT}/api/chat/${selectedChat._id}/messages/${editingMessageId}`,
                    { content: textContent },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setEditingMessageId(null);
                setNewMessage("");
                // Firestore merges edited
                return;
            }

            // Normal Send
            const formData = new FormData();
            formData.append('content', optimisticMsg.content);
            if (imageBlob) formData.append('image', imageBlob);

            const { data } = await axios.post(
                `${ENDPOINT}/api/chat/${selectedChat._id}/message`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Replace temp message with actual message
            const actualMessage = data.messages[data.messages.length - 1];
            setMessages(prev => prev.map(msg => msg._id === tempId ? actualMessage : msg));

        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => prev.map(msg => msg._id === tempId ? { ...msg, status: 'failed' } : msg));
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        sendRawMessage(newMessage, image, false);
    };

    const sendBid = (e) => {
        e.preventDefault();
        if (!bidAmount || isNaN(bidAmount) || Number(bidAmount) <= 0) return;
        const payload = JSON.stringify({ type: 'bid', amount: Number(bidAmount), status: 'pending' });
        sendRawMessage(payload, null, true);
        setBidAmount('');
    };

    const updateBidStatus = async (msg, newStatus) => {
        try {
            const token = await currentUser.getIdToken();
            const payloadData = JSON.parse(msg.content);
            payloadData.status = newStatus;
            const updatedContent = JSON.stringify(payloadData);

            await axios.put(`${ENDPOINT}/api/chat/${selectedChat._id}/messages/${msg._id}`,
                { content: updatedContent },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error("Error updating bid:", error);
        }
    };

    const handleEditMessage = (message) => {
        setEditingMessageId(message._id);
        const parsed = parseMessageContent(message.content);
        if (!parsed.isBid) setNewMessage(message.content);
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            const token = await currentUser.getIdToken();
            await axios.delete(`${ENDPOINT}/api/chat/${selectedChat._id}/messages/${messageId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    // Select Chat & Load Messages
    const handleChatSelect = async (chat) => {
        setSelectedChat(chat);
        setMessages(chat.messages || []);

        try {
            const token = await currentUser.getIdToken();
            await axios.put(`${ENDPOINT}/api/chat/${chat._id}/read`, {}, {
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

    const activeOtherUser = selectedChat?.participants.find(p => p.firebaseUid !== currentUser.uid);
    const activeMe = selectedChat?.participants.find(p => p.firebaseUid === currentUser.uid);
    const sameCollege = activeMe?.college && activeOtherUser?.college && activeMe.college === activeOtherUser.college;

    // Derived State for Current Bid
    const getLatestBid = () => {
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const parsed = parseMessageContent(msg.content);
            if (parsed.isBid) {
                const isMyBid = (msg.senderId._id || msg.senderId) === activeMe?._id;
                return { ...parsed.data, msg, isMyBid };
            }
        }
        return null;
    };
    const latestBid = getLatestBid();

    return (
        <div className="container mx-auto p-4 h-[calc(100vh-80px)]">
            <div className="bg-white rounded-2xl shadow-lg h-full overflow-hidden flex">

                {/* 1. Sidebar - Chat List */}
                <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col flex-shrink-0 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
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
                            const otherUser = chat.participants.find(p => p.firebaseUid !== currentUser.uid);
                            const me = chat.participants.find(p => p.firebaseUid === currentUser.uid);
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

                {/* 2. Main Chat Area */}
                <div className={`w-full flex-grow flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 flex items-center bg-white shadow-sm z-10 w-full">
                                <button onClick={() => setSelectedChat(null)} className="md:hidden mr-4 text-indigo-600 font-bold">
                                    &larr; Back
                                </button>
                                {activeOtherUser?.profilePic ? (
                                    <img src={activeOtherUser.profilePic} alt={activeOtherUser.name} className="w-10 h-10 rounded-full object-cover mr-3" />
                                ) : (
                                    <FaUserCircle className="text-3xl text-gray-400 mr-3" />
                                )}
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-gray-800 leading-tight">
                                        {activeOtherUser?.name || 'User'}
                                    </h3>
                                    {sameCollege && (
                                        <p className="text-[11px] text-green-700 bg-green-100 px-2 py-[2px] rounded-full inline-block mt-1 font-medium shadow-sm border border-green-200">
                                            🎓 You both study at {activeMe.college}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-grow p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
                                {messages.map((msg, index) => {
                                    const isMyMessage = (msg.senderId._id || msg.senderId) === activeMe?._id;
                                    const parsed = parseMessageContent(msg.content);

                                    // Render Bid Card
                                    if (parsed.isBid) {
                                        const bid = parsed.data;
                                        return (
                                            <div key={index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                                                <div className={`p-4 rounded-2xl w-64 shadow-md bg-white border ${isMyMessage ? 'border-indigo-200 rounded-br-none' : 'border-gray-200 rounded-bl-none'}`}>
                                                    <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                                        <div className="flex items-center text-indigo-600 font-bold uppercase text-xs tracking-wider">
                                                            <FaGavel className="mr-1.5" /> Bidding Offer
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-medium">
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>

                                                    <div className="text-center py-2">
                                                        <div className="text-3xl font-black text-gray-800 mb-1">₹{bid.amount}</div>
                                                        <div className="text-xs text-gray-500 font-medium">{isMyMessage ? 'Suggested by you' : 'Suggested by partner'}</div>
                                                    </div>

                                                    {/* Bid Actions */}
                                                    {bid.status === 'pending' && !isMyMessage && (
                                                        <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                                                            <button onClick={() => updateBidStatus(msg, 'accepted')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-bold shadow transition flex items-center justify-center">Accept</button>
                                                            <button onClick={() => updateBidStatus(msg, 'declined')} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center">Decline</button>
                                                        </div>
                                                    )}

                                                    {bid.status === 'pending' && isMyMessage && (
                                                        <div className="mt-4 bg-yellow-50 text-yellow-700 text-xs font-bold p-2 text-center rounded-lg border border-yellow-200">
                                                            Awaiting Response...
                                                        </div>
                                                    )}

                                                    {bid.status === 'accepted' && (
                                                        <div className="mt-4 bg-green-50 text-green-700 text-sm font-bold p-2 flex items-center justify-center rounded-lg border border-green-200">
                                                            <FaCheckCircle className="mr-1.5" /> Offer Accepted
                                                        </div>
                                                    )}

                                                    {bid.status === 'declined' && (
                                                        <div className="mt-4 bg-red-50 text-red-600 text-sm font-bold p-2 flex items-center justify-center rounded-lg border border-red-200">
                                                            <FaTimesCircle className="mr-1.5" /> Offer Declined
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Render Normal Message
                                    return (
                                        <div key={index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} group mb-2`}>
                                            <div className="relative max-w-[70%]">
                                                {isMyMessage && (
                                                    <div className="absolute top-0 right-0 -mt-8 hidden group-hover:flex space-x-1 bg-white shadow-md p-1 rounded-lg border border-gray-100 z-10 transition">
                                                        <button onClick={() => handleEditMessage(msg)} className="text-gray-500 hover:text-indigo-600 p-1" title="Edit"><FaEdit size={12} /></button>
                                                        <button onClick={() => handleDeleteMessage(msg._id)} className="text-gray-500 hover:text-red-500 p-1" title="Delete"><FaTrash size={12} /></button>
                                                    </div>
                                                )}
                                                <div className={`px-4 py-2 rounded-2xl ${isMyMessage ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-none border border-gray-100'}`}>
                                                    {msg.image && (
                                                        <img src={msg.image} alt="Sent" className="max-w-full h-auto rounded-lg mb-2" />
                                                    )}
                                                    {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                                    <div className={`text-[10px] flex justify-end items-center mt-1 space-x-1 ${isMyMessage ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        {msg.status === 'sending' && <span>(Sending...)</span>}
                                                        {msg.status === 'failed' && <span className="text-red-300">(Failed)</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {isTyping && (
                                    <div className="flex justify-start mb-2 animate-pulse">
                                        <div className="bg-gray-200 text-gray-500 rounded-2xl px-4 py-2 text-sm italic">
                                            Typing...
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {preview && (
                                <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 flex items-center">
                                    <div className="relative">
                                        <img src={preview} alt="Preview" className="h-20 w-auto object-cover rounded-md border border-gray-300" />
                                        <button
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md hover:bg-gray-900"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                    <span className="ml-3 text-sm text-gray-600 font-medium">Image attached</span>
                                </div>
                            )}

                            {editingMessageId && (
                                <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between text-sm text-indigo-800">
                                    <span className="font-semibold flex items-center"><FaEdit className="mr-2" /> Editing message...</span>
                                    <button onClick={() => { setEditingMessageId(null); setNewMessage(''); }} className="font-bold underline">Cancel</button>
                                </div>
                            )}

                            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex items-center w-full">
                                <input
                                    type="text"
                                    placeholder="Type a message... (Ctrl+V to paste image)"
                                    className="flex-grow px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 transition"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onPaste={handlePaste}
                                />
                                <button type="submit" disabled={!newMessage.trim() && !image} className="ml-3 bg-indigo-600 text-white p-3.5 rounded-xl hover:bg-indigo-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col justify-center items-center text-gray-400 bg-gray-50">
                            <FaPaperPlane className="text-6xl mb-4 text-gray-300 opacity-50" />
                            <p className="text-xl font-medium">Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>

                {/* 3. Bidding Panel */}
                {selectedChat && (
                    <div className="hidden lg:flex flex-col w-[320px] flex-shrink-0 border-l border-gray-200 bg-white">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
                            <FaGavel className="text-lg text-indigo-600 mr-2" />
                            <h2 className="text-lg font-bold text-gray-800">Bidding</h2>
                        </div>

                        <div className="p-5 flex-grow flex flex-col overflow-y-auto">

                            {/* Latest Bid Status Card */}
                            <div className={`border rounded-2xl p-5 mb-8 shadow-sm transition ${latestBid ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                                <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${latestBid ? 'text-indigo-800' : 'text-gray-500'}`}>Current Deal Status</h3>
                                {latestBid ? (
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-indigo-600 mb-2">₹{latestBid.amount}</div>
                                        <div className="text-xs font-bold inline-flex items-center justify-center">
                                            {latestBid.status === 'pending' ? <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full border border-yellow-200">Pending Response</span> :
                                                latestBid.status === 'accepted' ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200 flex items-center"><FaCheckCircle className="mr-1" />Deal Accepted</span> :
                                                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full border border-red-200 flex items-center"><FaTimesCircle className="mr-1" />Deal Declined</span>}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-3 mix-blend-multiply">
                                            {latestBid.isMyBid ? 'Suggested by you' : 'Suggested by partner'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <FaGavel className="text-3xl text-gray-300 mx-auto mb-2 opacity-70" />
                                        <p className="text-sm text-gray-500 font-medium italic">No active offers yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Make Offer Form */}
                            <div className="mt-auto">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center"><FaPlus className="text-xs mr-2 text-indigo-500" /> Submit New Offer</h3>

                                {/* Quick Adds */}
                                <div className="flex space-x-2 mb-3">
                                    <button onClick={() => setBidAmount('100')} className="flex-1 bg-white border border-gray-300 rounded-lg py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm">₹100</button>
                                    <button onClick={() => setBidAmount('300')} className="flex-1 bg-white border border-gray-300 rounded-lg py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm">₹300</button>
                                    <button onClick={() => setBidAmount('500')} className="flex-1 bg-white border border-gray-300 rounded-lg py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm">₹500</button>
                                </div>

                                <div className="flex mb-4 relative">
                                    <span className="absolute left-4 top-3 text-gray-500 font-bold">₹</span>
                                    <input
                                        type="number"
                                        placeholder="Custom amount"
                                        className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500 font-bold text-gray-800"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        min="1"
                                    />
                                </div>

                                <button
                                    onClick={sendBid}
                                    disabled={!bidAmount || isNaN(bidAmount) || Number(bidAmount) <= 0}
                                    className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform active:scale-[0.98]"
                                >
                                    <FaGavel className="mr-2" /> Make Offer
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
