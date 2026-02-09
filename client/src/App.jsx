import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SellBook from './pages/SellBook';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import BookDetails from './pages/BookDetails';
import Login from './pages/Login';

import { BookProvider } from './context/BookContext';

function App() {
  return (
    <AuthProvider>
      <BookProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/sell" element={<SellBook />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/books/:id" element={<BookDetails />} />
              </Routes>
            </main>
            <footer className="bg-gray-800 text-gray-400 py-6 text-center">
              <p>&copy; 2026 CampusBooks. Built for Students.</p>
            </footer>
          </div>
        </Router>
      </BookProvider>
    </AuthProvider>
  );
}

export default App;
