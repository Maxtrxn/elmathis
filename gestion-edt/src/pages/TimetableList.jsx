import { useState } from "react";
import { Link } from "react-router-dom";
import { STUDENTS_DATA } from "../services/mockData";

export default function TimetableList() {
    const [searchTerm, setSearchTerm] = useState("");

    // Logique de filtrage
    const filteredStudents = STUDENTS_DATA.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: "2rem" }}>
            <h2>Liste des étudiants</h2>
            
            {/* Barre de recherche */}
            <input
                type="text"
                placeholder="Filtrer par nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: "8px", width: "100%", maxWidth: "300px", marginBottom: "20px" }}
            />

            {/* Liste */}
            <div style={{ display: "grid", gap: "10px" }}>
                {filteredStudents.map(student => (
                    <div key={student.id} style={{ border: "1px solid #ddd", padding: "10px", borderRadius: "5px" }}>
                        <strong>{student.name}</strong>
                        <span style={{ margin: "0 10px", color: "gray" }}>|</span> 
                        <small>Dernière MAJ: {student.lastUpdate}</small>
                        <br />
                        {/* Lien vers la vue détaillée */}
                        <Link to={`/student/${student.id}`} style={{ display:"inline-block", marginTop:"10px" }}>
                            Voir l'emploi du temps →
                        </Link>
                    </div>
                ))}
            </div>
            
            {filteredStudents.length === 0 && <p>Aucun étudiant trouvé.</p>}
        </div>
    );
}