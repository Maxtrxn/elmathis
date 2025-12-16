import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function TimetableList() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetch('http://localhost:3001/api/students')
            .then(res => {
                // Si le serveur renvoie une erreur 500 ou 404
                if (!res.ok) {
                    throw new Error(`Erreur HTTP: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log("Données reçues du serveur :", data); // <--- REGARDE CA DANS LA CONSOLE
                
                // Sécurité : Est-ce que c'est bien un tableau (liste) ?
                if (Array.isArray(data)) {
                    setStudents(data);
                } else {
                    // Si ce n'est pas une liste, on affiche l'erreur sans planter
                    console.error("Format reçu incorrect (pas un tableau)", data);
                    setError("Le serveur n'a pas renvoyé une liste valide.");
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur Fetch :", err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // Filtrage sécurisé
    const filteredStudents = students.filter(student =>
        student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div style={{padding: "2rem"}}>Chargement...</div>;
    if (error) return <div style={{padding: "2rem", color: "red"}}>Erreur : {error}</div>;

    return (
        <div style={{ padding: "2rem" }}>
            <h2>Liste des étudiants ({students.length})</h2>
            
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
                            {/* On vérifie qu'on a bien un ID avant de créer le lien */}
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