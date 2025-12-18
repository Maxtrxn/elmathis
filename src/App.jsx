import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TimetableList from './pages/TimetableList';
import StudentDetail from './pages/StudentDetail';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Vérifie l'URL au retour de Discord
    const params = new URLSearchParams(window.location.search);
    const discordId = params.get('id');
    const username = params.get('username');
    const avatar = params.get('avatar');

    if (discordId && username) {
      // Nouvelle connexion détectée
      const userData = { id: discordId, username, avatar };
      localStorage.setItem('user', JSON.stringify(userData)); // Sauvegarde
      setUser(userData);
      navigate('/'); // Nettoie l'URL
    } else {
      // 2. Vérifie le stockage local (si on rafraîchit la page)
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/timetables" element={<TimetableList />} />
        
        {/* On donne l'utilisateur connecté à la page de détail */}
        <Route path="/student/:id" element={<StudentDetail currentUser={user} />} />
        
      </Routes>
    </>
  );
}

export default App;