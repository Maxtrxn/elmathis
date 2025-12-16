import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function StudentDetail() {
    const { id } = useParams(); // On récupère l'ID (le long chiffre)
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // On fetch l'emploi du temps spécifique
        fetch(`http://localhost:3001/api/schedule/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Pas trouvé");
                return res.json();
            })
            .then(data => {
                setStudent(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, [id]);

    if (loading) return <p>Chargement du Sheet...</p>;
    if (!student) return <p>Étudiant introuvable</p>;

    return (
        <div style={{ padding: "2rem" }}>
            <Link to="/timetables">← Retour</Link>
            <h1>{student.name}</h1>
            <p>Dernière MAJ : {student.lastUpdate}</p>
            
            {/* Tableau d'affichage (reste le même que précédemment) */}
            <table border="1" style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                    <tr><th>Jour</th><th>Cours</th></tr>
                </thead>
                <tbody>
                    {Object.entries(student.schedule).map(([day, courses]) => (
                        <tr key={day}>
                            <td style={{fontWeight: 'bold'}}>{day}</td>
                            <td>
                                {courses.length > 0 ? courses.map((c, i) => (
                                    <div key={i}>{c}</div>
                                )) : <span style={{color:'#666'}}>Aucun cours</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}