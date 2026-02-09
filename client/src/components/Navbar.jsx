import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBook, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

const Navbar = () => {
    const { currentUser, logout, loginWithGoogle } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (currentUser) {
                try {
                    const token = await currentUser.getIdToken();
                    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                    const { data } = await axios.get(`${API_URL}/api/chat/unread/count`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUnreadCount(data.count);
                } catch (error) {
                    console.error("Error fetching unread count", error);
                }
            }
        };
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [currentUser]);

    return (
        <nav className="bg-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl">
                    <img src="/logo.jpg" alt="Logo" className="w-10 h-10 object-contain" />
                    <span>CampusBooks</span>
                </Link>

                <div className="flex items-center space-x-4">
                    <Link to="/sell" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        Sell Book
                    </Link>

                    {currentUser ? (
                        <div className="flex items-center space-x-3">
                            <Link to="/chat" className="text-gray-600 hover:text-indigo-600 relative">
                                Chats
                                {unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                            <Link to="/profile" className="text-gray-600 hover:text-indigo-600 font-medium">
                                My Profile
                            </Link>
                            <div className="flex items-center space-x-2">
                                {currentUser.photoURL ? (
                                    <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                                ) : (
                                    <FaUserCircle className="text-2xl text-gray-400" />
                                )}
                                <span className="hidden md:block font-medium">{currentUser.displayName}</span>
                            </div>
                            <button onClick={logout} className="text-red-500 hover:text-red-700">
                                <FaSignOutAlt />
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
