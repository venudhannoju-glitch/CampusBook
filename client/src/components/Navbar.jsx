import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBook, FaUserCircle, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false); // Mobile menu state

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

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const closeMenu = () => {
        setIsOpen(false);
    };

    return (
        <nav className="bg-white shadow-md relative z-50">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl" onClick={closeMenu}>
                    <img src="/logo.jpg" alt="Logo" className="w-10 h-10 object-contain" />
                    <span>CampusBooks</span>
                </Link>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-gray-600 hover:text-indigo-600 focus:outline-none"
                    onClick={toggleMenu}
                >
                    {isOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
                </button>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-4">
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
                                <span className="font-medium">{currentUser.displayName}</span>
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

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-lg py-4 px-4 flex flex-col space-y-4">
                    <Link to="/sell" className="bg-indigo-600 text-white px-4 py-3 rounded-lg text-center font-bold hover:bg-indigo-700 transition" onClick={closeMenu}>
                        Sell Book
                    </Link>

                    {currentUser ? (
                        <>
                            <Link to="/chat" className="text-gray-700 hover:text-indigo-600 font-medium flex justify-between items-center py-2 border-b border-gray-50" onClick={closeMenu}>
                                <span>Chats</span>
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                            <Link to="/profile" className="text-gray-700 hover:text-indigo-600 font-medium py-2 border-b border-gray-50" onClick={closeMenu}>
                                My Profile
                            </Link>
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center space-x-2">
                                    {currentUser.photoURL ? (
                                        <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                                    ) : (
                                        <FaUserCircle className="text-2xl text-gray-400" />
                                    )}
                                    <span className="font-medium text-gray-800">{currentUser.displayName}</span>
                                </div>
                                <button onClick={() => { logout(); closeMenu(); }} className="text-red-500 hover:text-red-700 font-medium">
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="block w-full text-center bg-gray-100 text-indigo-600 px-4 py-3 rounded-lg font-bold hover:bg-gray-200 transition"
                            onClick={closeMenu}
                        >
                            Login
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
