import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav style={{ padding: "1rem", background: "#eee", display: "flex", gap: "20px" }}>
            <Link to="/">🏠 Accueil</Link>
            <Link to="/timetables">📅 Les Emplois du temps</Link>
            
            {/* Lien placeholder pour la future connexion Discord */}
            <a href="#" style={{ marginLeft: "auto", color: "blue" }}>
                🔑 Connexion (Discord)
            </a>
        </nav>
    );
}