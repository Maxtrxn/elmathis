import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faUserSecret } from '@fortawesome/free-solid-svg-icons';

export default function TimetableList({currentUser}) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true); // <--- Initialisé à true
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Admin : karim, nicolas, zack et florentin
    const ADMIN_IDS = ["664134848029655040","334027602618482691", "372029803852726273", "274567060875509760"];
    const isAdmin = currentUser && ADMIN_IDS.includes(String(currentUser.id));

    const [activeSessions, setActiveSessions] = useState([]);

    // Fonction définie en dehors pour pouvoir être rappelée
    const fetchSessions = () => {
        const token = localStorage.getItem('authToken');
        fetch('http://localhost:3001/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if(Array.isArray(data)) setActiveSessions(data);
            })
            .catch(err => console.error(err));
    };

    const handleKick = async (tokenToKick) => {
        if(!window.confirm("Déconnecter cet utilisateur ?")) return;

        const token = localStorage.getItem('authToken');
        await fetch(`http://localhost:3001/api/admin/users/${tokenToKick}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        fetchSessions();
    };

    useEffect(() => {
        // 1. Chargement liste étudiants
        fetch('http://localhost:3001/api/students')
            .then(res => {
                if (!res.ok) throw new Error("Erreur lors de la récupération");
                return res.json();
            })
            .then(data => {
                // Si ça marche
                if (Array.isArray(data)) setStudents(data);
                setLoading(false); // <--- IMPORTANT : On arrête le chargement
            })
            .catch(err => {
                // Si ça rate
                console.error(err);
                setError(err.message);
                setLoading(false); // <--- IMPORTANT : On arrête le chargement même en cas d'erreur
            });

        // 2. Si Admin, on charge les sessions actives
        if (isAdmin) {
            fetchSessions();
        }
    }, [isAdmin]); // On garde isAdmin en dépendance

    // Filtrage sécurisé
    const filteredStudents = students.filter(student =>
        student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div style={{padding: "2rem"}}>Chargement...</div>;
    if (error) return <div style={{padding: "2rem", color: "red"}}>Erreur : {error}</div>;

    return (
        <div style={{ padding: "2rem" }}>
            {isAdmin && (
                <div style={{marginBottom: '30px', padding: '15px', border: '1px solid #ef4444', borderRadius: '8px', backgroundColor: '#fff5f5', color: 'black'}}>
                    <h3 style={{color:'#ef4444', marginTop:0}}>
                        <FontAwesomeIcon icon={faUserSecret} /> Administration - Utilisateurs connectés
                    </h3>
                    {activeSessions.length === 0 ? <p>Personne en ligne.</p> : (
                        <ul style={{listStyle:'none', padding:0}}>
                            {activeSessions.map(session => (
                                <li key={session.token} style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee', padding:'5px 0'}}>
                                    <span>
                                        <strong>{session.username}</strong> <small>(Exp: {new Date(session.expires_at).toLocaleTimeString()})</small>
                                    </span>
                                    <button
                                        onClick={() => handleKick(session.token)}
                                        style={{background:'#ef4444', color:'white', border:'none', borderRadius:'4px', padding:'4px 8px', cursor:'pointer'}}
                                    >
                                        <FontAwesomeIcon icon={faTrash} /> KICK
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            <h2>Liste des étudiants ({filteredStudents.length})</h2>

            <input
                type="text"
                placeholder="Filtrer par nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: "8px", width: "100%", maxWidth: "300px", marginBottom: "20px" }}
            />

            <div style={{ display: "grid", gap: "10px" }}>
                {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => (
                        <div key={student.id || index} className="student-card">
                            <strong>{student.name}</strong>
                            {student.id ? (
                                <Link to={`/student/${student.id}`} style={{marginLeft: "10px"}}>
                                    Voir EDT →
                                </Link>
                            ) : (
                                <span style={{color: "red", marginLeft: "10px"}}>Pas d'ID</span>
                            )}
                        </div>
                    ))
                ) : (
                    <p>Aucun étudiant trouvé.</p>
                )}
            </div>
        </div>
    );
}