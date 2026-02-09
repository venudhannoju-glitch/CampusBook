import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';

const SellBook = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        price: '',
        courseCode: '',
        condition: '3',
        description: '', // Optional add
        location: ''
    });

    const [file, setFile] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!currentUser) {
            alert("You must be logged in to sell a book.");
            setLoading(false);
            return;
        }

        if (!file) {
            alert("Please upload an image of the book.");
            setLoading(false);
            return;
        }

        try {
            const token = await currentUser.getIdToken();

            const data = new FormData();
            data.append('images', file); // 'images' matches upload.array('images') in backend
            // Append all form fields
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            // userId will be extracted from token in backend, but keeping field consistency if needed
            // data.append('userId', currentUser.uid); 

            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            await axios.post(`${API_URL}/api/books`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Book posted successfully!');
            navigate('/');
        } catch (error) {
            console.error('Error posting book:', error);
            alert('Failed to post book. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Sell a Book</h1>
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Book Title</label>
                        <input
                            type="text"
                            name="title"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Introduction to Algorithms"
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
                                placeholder="e.g. Cormen"
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
                                placeholder="e.g. CS101"
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
                                placeholder="400"
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
                        <label className="block text-gray-700 font-medium mb-2">Pickup Location</label>
                        <input
                            type="text"
                            name="location"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Central Library Canteen"
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
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <FaCloudUploadAlt className="text-4xl mb-2 text-indigo-400" />
                                <p>Click to upload an image</p>
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
                        Post Book
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SellBook;
