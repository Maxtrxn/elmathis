import { useEffect, useState } from "react";
import { Routes, Route, useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import TimetableList from "./pages/TimetableList";
import StudentDetail from "./pages/StudentDetail";

function App() {
    const [user, setUser] = useState(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Vérifier si l'URL contient des infos utilisateur (retour de Discord)
        const username = searchParams.get("username");
        const id = searchParams.get("id");
        const avatar = searchParams.get("avatar");

        if (username && id) {
            // On crée l'objet utilisateur
            const newUser = { username, id, avatar };
            setUser(newUser);

            // Optionnel : Sauvegarder dans localStorage pour rester connecté après F5
            localStorage.setItem("user", JSON.stringify(newUser));

            // Nettoyer l'URL (enlever les paramètres moches)
            navigate("/");
        } else {
            // Vérifier si on a déjà un utilisateur en mémoire
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
    }, [searchParams, navigate]);

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    return (
        <div>
            {/* On passe l'utilisateur et la fonction de déconnexion à la Navbar */}
            <Navbar user={user} onLogout={handleLogout} />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/timetables" element={<TimetableList />} />
        <Route path="/student/:id" element={<StudentDetail />} />
      </Routes>
    </div>
  );
}

export default App;