import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TimetableList from './pages/TimetableList';
import StudentDetail from './pages/StudentDetail';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // verifyToken est asynchrone donc pas de soucis de définir handleLogout plus bas
  const verifyToken = useCallback(async (token) => {
    try {
      const res = await fetch('http://localhost:3001/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const userData = await res.json();
        localStorage.setItem('authToken', token);
        setUser(userData);
        return true; // Succès
      } else {
        console.log("Token invalide ou session expirée");
        handleLogout();
        return false; // Échec
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    navigate('/');
  };

  useEffect(() => {
    // On crée une fonction asynchrone dans useEffect
    const initAuth = async () => {
      // On attend un retour de discord
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');

      if (urlToken) {
        // On attend la vérification
        const isValid = await verifyToken(urlToken);
        if (isValid) {
          // Nettoyage de l'URL
          navigate('/');
        }
      } else {
        // Restauration session
        const savedToken = localStorage.getItem('authToken');
        if (savedToken) {
          verifyToken(savedToken);
        }
      }
    };

    initAuth();
  }, [navigate, verifyToken]);

  return (
      <>
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
              path="/timetables"
              element={<TimetableList currentUser={user} />}
          />

          <Route
              path="/student/:id"
              element={<StudentDetail currentUser={user} />}
          />
        </Routes>
      </>
  );
}

export default App;