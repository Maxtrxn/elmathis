import { useParams, Link } from "react-router-dom";
import { getStudentById } from "../services/mockData";

export default function StudentDetail() {
    const { id } = useParams(); // Récupère l'ID depuis l'URL (ex: /student/1)
    const student = getStudentById(id);

    if (!student) {
        return <div style={{padding: "2rem"}}>Étudiant introuvable ! <Link to="/timetables">Retour</Link></div>;
    }

    return (
        <div style={{ padding: "2rem" }}>
            <Link to="/timetables">← Retour à la liste</Link>
            
            <h1>Emploi du temps : {student.name}</h1>
            <p><em>Dernière mise à jour : {student.lastUpdate}</em></p>

            <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%", marginTop: "20px" }}>
                <thead>
                    <tr style={{ background: "#f4f4f4" }}>
                        <th>Jour</th>
                        <th>Programme</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(student.schedule).map(([day, courses]) => (
                        <tr key={day}>
                            <td style={{ fontWeight: "bold" }}>{day}</td>
                            <td>
                                {courses.map((course, index) => (
                                    <div key={index} style={{ marginBottom: "4px" }}>• {course}</div>
                                ))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}