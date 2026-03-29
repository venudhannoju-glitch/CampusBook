import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const CollegeBooks = () => {
    const { collegeName } = useParams();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchBooks = async (query = '') => {
        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            let url = `${API_URL}/api/books?college=${encodeURIComponent(collegeName)}`;
            if (query) {
                url += `&search=${encodeURIComponent(query)}`;
            }

            const res = await axios.get(url);
            if (res.data) {
                setBooks(res.data);
            }
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchBooks();
    }, [collegeName]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchBooks(searchQuery);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, collegeName]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchBooks(searchQuery);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header / Search Section */}
            <div className="bg-indigo-600 rounded-2xl p-6 md:p-8 mb-8 md:mb-10 text-center text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-x-10 -translate-y-10"></div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full translate-x-10 translate-y-10"></div>

                <div className="inline-block bg-white text-indigo-800 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide mb-3 relative z-10 shadow-sm">
                    {collegeName}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">Books from this College</h1>
                <p className="mb-8 text-indigo-100 relative z-10 text-base md:text-lg">
                    Find textbooks selling right next door in your campus.
                </p>

                <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex bg-white rounded-full overflow-hidden p-1 shadow-lg relative z-10 transform transition-transform hover:scale-[1.02]">
                    <div className="flex-grow flex items-center px-4 relative overflow-hidden">
                        <svg className="w-6 h-6 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>

                        {!searchQuery && (
                            <div className="absolute left-12 right-0 top-0 bottom-0 flex items-center pointer-events-none md:hidden overflow-hidden">
                                <span className="text-gray-400 animate-marquee whitespace-nowrap">
                                    Search books in {collegeName}...
                                </span>
                            </div>
                        )}

                        <input
                            type="text"
                            placeholder={`Search books in ${collegeName}...`}
                            className="w-full py-3 text-gray-800 focus:outline-none text-lg bg-transparent placeholder-transparent md:placeholder-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="bg-indigo-800 text-white px-8 py-3 font-bold rounded-full hover:bg-indigo-900 transition duration-300">
                        Search
                    </button>
                </form>
            </div>

            {/* Results Section */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {searchQuery ? `Search Results in ${collegeName}` : 'Available Listings'}
                    </h2>
                    <Link to="/colleges" className="text-indigo-600 hover:text-indigo-800 font-medium hidden sm:inline-flex items-center">
                        &larr; Back to Colleges
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading books...</p>
                    </div>
                ) : books.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {books.map(book => (
                            <div key={book._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden">
                                <img
                                    src={book.images?.[0] || book.image || 'https://via.placeholder.com/300?text=No+Image'}
                                    alt={book.title}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-4">
                                    <div className="text-xs text-indigo-600 font-semibold mb-1 truncate">{book.courseCode || book.course || 'General'}</div>
                                    <h3 className="font-bold text-lg mb-1 truncate">{book.title}</h3>
                                    <p className="text-gray-500 text-sm mb-3 truncate">{book.author}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-green-600 font-bold text-xl">₹{book.price}</span>
                                        <Link to={`/books/${book._id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-xl p-10 text-center border border-dashed border-gray-300">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No books found in this college</h3>
                        <p className="text-gray-500 mb-6">
                            Be the first to <Link to="/sell" className="text-indigo-600 font-bold hover:underline">sell a book</Link> from {collegeName}!
                        </p>
                        <Link to="/colleges" className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition">
                            Explore other colleges
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollegeBooks;
