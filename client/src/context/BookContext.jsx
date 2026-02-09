import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const BookContext = createContext();

export const useBooks = () => {
    return useContext(BookContext);
};

export const BookProvider = ({ children }) => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBooks = async (query = '') => {
        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const url = query ? `${API_URL}/api/books?search=${query}` : `${API_URL}/api/books`;

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

    // Initial fetch on mount
    useEffect(() => {
        fetchBooks();
    }, []);

    const value = {
        books,
        loading,
        fetchBooks
    };

    return (
        <BookContext.Provider value={value}>
            {children}
        </BookContext.Provider>
    );
};
