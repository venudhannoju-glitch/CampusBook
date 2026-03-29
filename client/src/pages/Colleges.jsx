import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaUniversity, FaSearch } from 'react-icons/fa';

const Colleges = () => {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                const { data } = await axios.get(`${API_URL}/api/books/colleges`);
                // Append default static colleges if they are missing so it doesn't look empty when DB is fresh
                const defaultColleges = [
                    "CVR College of Engineering",
                    "VNR Vignana Jyothi Institute of Engineering and Technology",
                    "Vasavi College of Engineering",
                    "CBIT (Chaitanya Bharathi Institute of Technology)",
                    "JNTUH University College of Engineering",
                    "Osmania University",
                    "Institute of Technology"
                ];

                // Merge and remove duplicates
                const mergedColleges = Array.from(new Set([...data, ...defaultColleges]));
                setColleges(mergedColleges);
            } catch (error) {
                console.error("Error fetching colleges:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchColleges();
    }, []);

    const filteredColleges = colleges.filter((c) =>
        c.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header Section */}
            <div className="bg-indigo-600 rounded-3xl p-8 md:p-12 mb-10 text-center text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-x-10 -translate-y-10"></div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full translate-x-10 translate-y-10"></div>

                <h1 className="text-3xl md:text-5xl font-bold mb-4 relative z-10">Discover by College</h1>
                <p className="mb-0 text-indigo-100 relative z-10 text-lg md:text-xl max-w-2xl mx-auto">
                    Browse used textbooks specific to your campus or other colleges around you.
                </p>
                
                <div className="max-w-xl mx-auto mt-8 relative z-10">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Find your college..."
                            className="w-full py-4 pl-12 pr-4 text-gray-800 rounded-full focus:outline-none focus:ring-4 focus:ring-indigo-300 shadow-lg text-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            {loading ? (
                <div className="text-center py-20 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
                    <p className="text-lg text-gray-500 font-medium">Loading colleges...</p>
                </div>
            ) : filteredColleges.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredColleges.map((college, idx) => (
                        <Link
                            to={`/colleges/${encodeURIComponent(college)}`}
                            key={idx}
                            className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex items-center space-x-5 hover:-translate-y-1"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                <FaUniversity className="text-3xl" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 truncate whitespace-break-spaces">
                                    {college}
                                </h3>
                                <p className="text-sm font-medium text-indigo-600 flex items-center group-hover:text-indigo-800">
                                    View Books &rarr;
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 rounded-3xl p-16 text-center border-2 border-dashed border-gray-200 mt-10">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaUniversity className="text-4xl text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No colleges found</h3>
                    <p className="text-gray-500 text-lg max-w-md mx-auto">
                        We couldn't find any colleges matching "{searchTerm}". Try checking your spelling or search for another name.
                    </p>
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-6 font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-6 py-3 rounded-full transition-colors"
                    >
                        Clear Search
                    </button>
                </div>
            )}
        </div>
    );
};

export default Colleges;
