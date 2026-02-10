import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBooks } from '../context/BookContext';

const Home = () => {
    const { books, loading, fetchBooks } = useBooks();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Debounce search to avoid spamming API while typing
        const delayDebounceFn = setTimeout(() => {
            // Only fetch if query is different or to reset
            fetchBooks(searchQuery);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]); // fetchBooks is stable from context

    const handleSearch = (e) => {
        e.preventDefault();
        fetchBooks(searchQuery);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Hero Search Section */}
            <div className="bg-indigo-600 rounded-2xl p-6 md:p-8 mb-8 md:mb-10 text-center text-white shadow-xl relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-x-10 -translate-y-10"></div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full translate-x-10 translate-y-10"></div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">Find Used Books in Your Campus</h1>
                <p className="mb-8 text-indigo-100 relative z-10 text-base md:text-lg">Buy and sell textbooks easily within your college community.</p>

                <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex bg-white rounded-full overflow-hidden p-1 shadow-lg relative z-10 transform transition-transform hover:scale-[1.02]">
                    <div className="flex-grow flex items-center px-4 relative overflow-hidden">
                        <svg className="w-6 h-6 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>

                        {/* Custom Mobile Placeholder with Marquee */}
                        {!searchQuery && (
                            <div className="absolute left-12 right-0 top-0 bottom-0 flex items-center pointer-events-none md:hidden overflow-hidden">
                                <span className="text-gray-400 animate-marquee whitespace-nowrap">
                                    Search by title, author, or course code...
                                </span>
                            </div>
                        )}

                        <input
                            type="text"
                            placeholder="Search by title, author, or course code..."
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

            {/* Recent Listings */}
            <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    {searchQuery ? `Search Results for "${searchQuery}"` : 'Recent Listings'}
                </h2>

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
                                    <div className="text-xs text-indigo-600 font-semibold mb-1">{book.course}</div>
                                    <h3 className="font-bold text-lg mb-1 truncate">{book.title}</h3>
                                    <p className="text-gray-500 text-sm mb-3">{book.author}</p>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No books found</h3>
                        <p className="text-gray-500">
                            We couldn't find any matches for "{searchQuery}". Try searching for something else or
                            <Link to="/sell" className="text-indigo-600 font-bold hover:underline ml-1">sell a book</Link> yourself!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
