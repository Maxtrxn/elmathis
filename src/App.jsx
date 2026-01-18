import { useEffect, useState, useCallback } from 'react'; // Ajout de useCallback
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TimetableList from './pages/TimetableList';
import StudentDetail from './pages/StudentDetail';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // On utilise useCallback pour stabiliser la fonction et éviter les avertissements de dépendances
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
  }, []); // [] car elle ne dépend de rien d'externe qui change

  // Fonction de déconnexion définie ici pour être utilisée par verifyToken si besoin
  // (Note: verifyToken utilise handleLogout, mais pour éviter les cycles, on peut simplifier)
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    navigate('/');
  };

  useEffect(() => {
    // On crée une fonction asynchrone DANS l'effet
    const initAuth = async () => {
      // 1. Retour de Discord ? (On a un ?token=... dans l'URL)
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');

      if (urlToken) {
        // On ATTEND que la vérification soit finie avant de naviguer
        const isValid = await verifyToken(urlToken);
        if (isValid) {
          // Nettoyage de l'URL uniquement si c'est bon
          navigate('/');
        }
      } else {
        // 2. Restauration session (Token stocké)
        const savedToken = localStorage.getItem('authToken');
        if (savedToken) {
          verifyToken(savedToken);
        }
      }
    };

    initAuth();
  }, [navigate, verifyToken]); // On liste les dépendances proprement

  return (
      <>
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Home />} />

          {/* On passe bien currentUser ici */}
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