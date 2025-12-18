import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faHouse, faKey } from '@fortawesome/free-solid-svg-icons';

export default function Navbar({ user, onLogout }) {
    // Fonction pour construire l'URL de l'avatar Discord
    const getAvatarUrl = () => {
        if (!user || !user.avatar) return null;
        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    };

    return (
        <nav style={{ padding: "1rem", background: "#eee", display: "flex", gap: "20px", alignItems: "center" }}>
            <Link to="/"><FontAwesomeIcon icon={faHouse} style={{marginRight:'5px'}}/> Accueil</Link>
            <Link to="/timetables"><FontAwesomeIcon icon={faCalendarDays} style={{marginRight:'5px'}}/> Les Emplois du temps</Link>

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
                        <FontAwesomeIcon icon={faKey} style={{marginRight:'5px', color:"yellow"}}/> Connexion (Discord)
                    </a>
                )}
            </div>
        </nav>
    );
}