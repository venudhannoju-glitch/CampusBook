import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext'; // Import context
import { FaUserCircle, FaSpinner, FaCommentDots } from 'react-icons/fa';
import { getNickname } from '../utils/nicknameGenerator';

const BookDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { books, loading: contextLoading, fetchBooks } = useBooks(); // Use context

    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);

    const [prevBookId, setPrevBookId] = useState(null);
    const [nextBookId, setNextBookId] = useState(null);

    useEffect(() => {
        // If books are already loaded in context, use them
        if (books.length > 0) {
            const currentIndex = books.findIndex(b => b._id === id);
            if (currentIndex !== -1) {
                setBook(books[currentIndex]);
                setPrevBookId(currentIndex > 0 ? books[currentIndex - 1]._id : null);
                setNextBookId(currentIndex < books.length - 1 ? books[currentIndex + 1]._id : null);
                setLoading(false);
            } else {
                // Book not found in context (maybe new or search filtered), try fetching specifically or re-fetching all if context was empty
                // For now, if we have books but can't find this one, it might be a valid direct link to a sold book or similar.
                // Let's rely on the fallback of fetching generic logic if we want, OR just say not found.
                // But for safety, if context is empty, we wait.
                setBook(null);
                setLoading(false);
            }
        } else if (!contextLoading) {
            // Context loaded but empty (no books) or initial state, trigger fetch if needed? 
            // The context usually fetches on mount. If it returns empty, then maybe no books exist.
            fetchBooks(); // Ensure we have data
        }
    }, [id, books, contextLoading]);

    const handleChat = async () => {
        if (!currentUser) {
            alert("Please login to chat with the seller.");
            return;
        }

        if (currentUser.uid === book.sellerId) {
            alert("You cannot chat with yourself!");
            return;
        }

        setChatLoading(true);
        try {
            const token = await currentUser.getIdToken();
            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

            // Create or Get Chat
            const { data } = await axios.post(
                `${API_URL}/api/chat`,
                { recipientId: book.sellerId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            navigate('/chat', { state: { selectedChatId: data._id } });
        } catch (error) {
            console.error("Error starting chat:", error);
            alert("Failed to start chat. Try again.");
        } finally {
            setChatLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this book?")) return;

        try {
            const token = await currentUser.getIdToken();
            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            await axios.delete(`${API_URL}/api/books/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Book deleted successfully");
            navigate('/');
        } catch (error) {
            console.error("Error deleting book:", error);
            alert("Failed to delete book");
        }
    };

    if (loading) return <div className="flex justify-center p-20"><FaSpinner className="animate-spin text-4xl text-indigo-600" /></div>;
    if (!book) return <div className="p-20 text-center text-gray-500">Book not found.</div>;

    return (
        <div className="container mx-auto px-4 py-8 relative">
            {/* Navigation Buttons */}
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full flex justify-between pointer-events-none px-2 md:px-8">
                {prevBookId ? (
                    <button
                        onClick={() => navigate(`/books/${prevBookId}`)}
                        className="pointer-events-auto bg-indigo-600 hover:bg-indigo-700 text-white p-2 md:p-3 rounded-full shadow-lg transition transform hover:scale-110 backdrop-blur-sm"
                        title="Previous Book"
                    >
                        &larr;
                    </button>
                ) : <div />} {/* Spacer */}

                {nextBookId ? (
                    <button
                        onClick={() => navigate(`/books/${nextBookId}`)}
                        className="pointer-events-auto bg-indigo-600 hover:bg-indigo-700 text-white p-2 md:p-3 rounded-full shadow-lg transition transform hover:scale-110 backdrop-blur-sm"
                        title="Next Book"
                    >
                        &rarr;
                    </button>
                ) : <div />} {/* Spacer */}
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row max-w-4xl mx-auto relative z-10">
                {/* Image Section */}
                <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-4">
                    <img
                        src={book.images && book.images.length > 0 ? book.images[0] : 'https://via.placeholder.com/400'}
                        alt={book.title}
                        className="max-h-96 object-contain"
                    />
                </div>

                {/* Details Section */}
                <div className="w-full md:w-1/2 p-5 md:p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">{book.title}</h1>
                                <p className="text-xl text-gray-600">{book.author}</p>
                            </div>
                            <span className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">
                                {book.courseCode || 'General'}
                            </span>
                        </div>

                        <div className="text-3xl font-bold text-green-600 mb-6">₹{book.price}</div>

                        <div className="space-y-4 text-gray-700 mb-8">
                            <p><span className="font-semibold">Condition:</span> {book.condition}/5</p>
                            <p><span className="font-semibold">Description:</span> {book.description || 'No description provided.'}</p>
                            <p><span className="font-semibold">Location:</span> {book.location || 'Not specified'}</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <div className="flex items-center mb-6">
                            <FaUserCircle className="text-4xl text-gray-300 mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Seller</p>
                                <p className="font-semibold text-gray-800">{book.sellerId ? getNickname(book.sellerId) : 'Anonymous Student'}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleChat}
                            disabled={chatLoading}
                            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition flex justify-center items-center shadow-md transform hover:scale-[1.02]"
                        >
                            {chatLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaCommentDots className="mr-2 text-xl" />}
                            Chat with Seller
                        </button>
                    </div>

                    {currentUser && currentUser.uid === book.sellerId && (
                        <div className="mt-4 border-t border-gray-100 pt-6">
                            <button
                                onClick={handleDelete}
                                className="w-full bg-red-100 text-red-600 font-bold py-3 rounded-xl hover:bg-red-200 transition"
                            >
                                Delete Book
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookDetails;
