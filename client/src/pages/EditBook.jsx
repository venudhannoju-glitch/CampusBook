import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';

const EditBook = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { books, loading: contextLoading } = useBooks();

    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        price: '',
        courseCode: '',
        condition: '3',
        description: '',
        location: ''
    });

    const [existingImages, setExistingImages] = useState([]);
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (!contextLoading) {
            const book = books.find(b => b._id === id);
            if (book) {
                if (book.sellerId !== currentUser?.uid) {
                    alert("You are not authorized to edit this book.");
                    navigate('/');
                    return;
                }
                setFormData({
                    title: book.title,
                    author: book.author,
                    price: book.price,
                    courseCode: book.courseCode || '',
                    condition: book.condition,
                    description: book.description || '',
                    location: book.location || ''
                });
                setExistingImages(book.images || []);
                setFetchLoading(false);
            } else {
                if (books.length > 0) {
                    alert("Book not found.");
                    navigate('/');
                }
                // If books empty, let it stay loading or handle gracefully? 
                // Assuming context loads eventually.
                if (books.length === 0) setFetchLoading(false); // Stop loading if no books at all
            }
        }
    }, [id, books, contextLoading, currentUser, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = await currentUser.getIdToken();
            const data = new FormData();

            if (file) {
                data.append('images', file);
            }

            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });

            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            await axios.put(`${API_URL}/api/books/${id}`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Book updated successfully!');
            navigate(`/books/${id}`);
        } catch (error) {
            console.error('Error updating book:', error);
            alert('Failed to update book. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading || contextLoading) return <div className="flex justify-center p-20"><FaSpinner className="animate-spin text-4xl text-indigo-600" /></div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-5 md:p-8">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Edit Book</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Book Title</label>
                        <input
                            type="text"
                            name="title"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Author</label>
                            <input
                                type="text"
                                name="author"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={formData.author}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Course Code (Optional)</label>
                            <input
                                type="text"
                                name="courseCode"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={formData.courseCode}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Price (₹)</label>
                            <input
                                type="number"
                                name="price"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={formData.price}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Condition (1-5)</label>
                            <select
                                name="condition"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                value={formData.condition}
                                onChange={handleChange}
                            >
                                <option value="5">5 - Like New</option>
                                <option value="4">4 - Good</option>
                                <option value="3">3 - Fair</option>
                                <option value="2">2 - Poor</option>
                                <option value="1">1 - Damaged</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Description (Optional)</label>
                        <textarea
                            name="description"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Pickup Location</label>
                        <input
                            type="text"
                            name="location"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.location}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 hover:border-indigo-500 transition cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                        {file ? (
                            <div className="flex flex-col items-center">
                                <img src={URL.createObjectURL(file)} alt="Preview" className="h-32 object-contain mb-2" />
                                <p className="text-sm text-gray-700">{file.name}</p>
                                <p className="text-xs text-green-600">New image selected (will be added)</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                {existingImages.length > 0 && (
                                    <div className="mb-4 flex gap-2">
                                        {existingImages.map((img, idx) => (
                                            <img key={idx} src={img} alt="Current" className="h-16 w-16 object-cover rounded shadow" />
                                        ))}
                                    </div>
                                )}
                                <FaCloudUploadAlt className="text-4xl mb-2 text-indigo-400" />
                                <p>Click to add another image</p>
                                <p className="text-xs mt-1">PNG, JPG, JPEG up to 5MB</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition flex justify-center items-center"
                    >
                        {loading ? <FaSpinner className="animate-spin mr-2" /> : null}
                        Update Book
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditBook;
