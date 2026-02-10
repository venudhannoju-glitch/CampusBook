import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaBook, FaPlus, FaList, FaTh, FaEdit, FaTrash } from 'react-icons/fa';

const Profile = () => {
    const { currentUser } = useAuth();
    const [myBooks, setMyBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        // ... (fetch logic remains same, dependencies unchanged)
        // ...
    }, [currentUser]);

    const handleDelete = async (bookId) => {
        if (!window.confirm("Are you sure you want to delete this book?")) return;

        try {
            const token = await currentUser.getIdToken();
            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            await axios.delete(`${API_URL}/api/books/${bookId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove from state
            setMyBooks(myBooks.filter(book => book._id !== bookId));
            alert("Book deleted successfully");
        } catch (error) {
            console.error("Error deleting book:", error);
            alert("Failed to delete book");
        }
    };

    if (!currentUser) return <div className="p-10 text-center">Please login to view your profile.</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 flex flex-col md:flex-row items-center md:items-start">
                <div className="mr-0 md:mr-8 mb-4 md:mb-0">
                    {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100" />
                    ) : (
                        <FaUserCircle className="text-8xl text-gray-300" />
                    )}
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">{currentUser.displayName || 'Student'}</h1>
                    <p className="text-gray-500 mb-4">{currentUser.email}</p>
                    <div className="inline-block bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold">
                        CampusBooks Member
                    </div>
                </div>
            </div>

            {/* My Listings */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4 md:mb-0">
                        <FaBook className="mr-2 text-indigo-600" />
                        My Listings
                    </h2>

                    <div className="flex items-center space-x-4">
                        {/* View Toggle */}
                        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Grid View"
                            >
                                <FaTh />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-md transition ${viewMode === 'table' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Table View"
                            >
                                <FaList />
                            </button>
                        </div>

                        <Link to="/sell" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center text-sm font-bold shadow-md">
                            <FaPlus className="mr-2" />
                            Sell New Book
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading your books...</div>
                ) : myBooks.length > 0 ? (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {myBooks.map(book => (
                                    <div key={book._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden relative group">
                                        <div className="relative">
                                            <img
                                                src={book.images?.[0] || 'https://via.placeholder.com/300?text=No+Image'}
                                                alt={book.title}
                                                className="w-full h-48 object-cover"
                                            />
                                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                                {book.status}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-lg mb-1 truncate" title={book.title}>{book.title}</h3>
                                            <p className="text-gray-500 text-sm mb-3">₹{book.price}</p>
                                            <div className="flex justify-between items-center mt-4">
                                                <Link to={`/edit-book/${book._id}`} className="text-indigo-600 text-sm font-medium hover:underline flex items-center">
                                                    <FaEdit className="mr-1" /> Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(book._id)}
                                                    className="text-red-500 text-sm font-medium hover:text-red-700 flex items-center"
                                                >
                                                    <FaTrash className="mr-1" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full leading-normal">
                                        <thead>
                                            <tr>
                                                <th className="px-5 py-3 border-b-2 border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Book
                                                </th>
                                                <th className="px-5 py-3 border-b-2 border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Price
                                                </th>
                                                <th className="px-5 py-3 border-b-2 border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-5 py-3 border-b-2 border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myBooks.map(book => (
                                                <tr key={book._id}>
                                                    <td className="px-5 py-5 border-b border-gray-100 bg-white text-sm">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 w-10 h-10">
                                                                <img className="w-full h-full rounded-full object-cover"
                                                                    src={book.images?.[0] || 'https://via.placeholder.com/300?text=No+Image'}
                                                                    alt="" />
                                                            </div>
                                                            <div className="ml-3">
                                                                <p className="text-gray-900 whitespace-no-wrap font-semibold">
                                                                    {book.title}
                                                                </p>
                                                                <p className="text-gray-500 text-xs truncate max-w-[150px]">{book.author}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-5 border-b border-gray-100 bg-white text-sm">
                                                        <p className="text-gray-900 whitespace-no-wrap">₹{book.price}</p>
                                                    </td>
                                                    <td className="px-5 py-5 border-b border-gray-100 bg-white text-sm">
                                                        <span
                                                            className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                                                            <span aria-hidden
                                                                className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                                                            <span className="relative text-xs">{book.status}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-5 border-b border-gray-100 bg-white text-sm">
                                                        <div className="flex items-center space-x-3">
                                                            <Link to={`/edit-book/${book._id}`} className="text-indigo-600 hover:text-indigo-900" title="Edit">
                                                                <FaEdit />
                                                            </Link>
                                                            <button onClick={() => handleDelete(book._id)} className="text-red-600 hover:text-red-900" title="Delete">
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-gray-50 rounded-xl p-10 text-center">
                        <p className="text-gray-500 mb-4">You haven't listed any books yet.</p>
                        <Link to="/sell" className="text-indigo-600 font-bold hover:underline">
                            Start Selling Today!
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
