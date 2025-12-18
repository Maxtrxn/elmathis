import { Link } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
    // Fonction pour construire l'URL de l'avatar Discord
    const getAvatarUrl = () => {
        if (!user || !user.avatar) return null;
        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    };

    return (
        <nav style={{ padding: "1rem", background: "#eee", display: "flex", gap: "20px", alignItems: "center" }}>
            <Link to="/">🏠 Accueil</Link>
            <Link to="/timetables">📅 Les Emplois du temps</Link>

            <div style={{ marginLeft: "auto" }}>
                {user ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {user.avatar && (
                            <img
                                src={getAvatarUrl()}
                                alt="Avatar"
                                style={{ width: "30px", borderRadius: "50%" }}
                            />
                        )}
                        <span style={{ fontWeight: "bold" }}>{user.username}</span>
                        <button onClick={onLogout} style={{ cursor: "pointer", marginLeft: "10px" }}>
                            Se déconnecter
                        </button>
                    </div>
                ) : (
                    // Ce lien pointe vers notre backend Express
                    <a href="http://localhost:3001/auth/login" style={{ color: "blue", textDecoration: "none" }}>
                        🔑 Connexion (Discord)
                    </a>
                )}
            </div>
        </nav>
    );
}