import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";

export default function StudentDetail() {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:3001/api/schedule/${id}`)
            .then(res => res.json())
            .then(data => {
                setStudent(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    // Configuration de la grille
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    const startHour = 8;
    const endHour = 17; 
    const totalHours = endHour - startHour + 1;

    // --- LOGIQUE DE FUSION (Memoized pour la perf) ---
    const events = useMemo(() => {
        if (!student || !student.schedule) return [];

        let consolidatedEvents = [];

        days.forEach((day, dayIndex) => {
            const rawCourses = student.schedule[day] || [];
            
            // 1. On parse tout : "8h: Maths" devient { hour: 8, name: "Maths" }
            let parsedCourses = rawCourses.map(str => {
                const match = str.match(/(\d+)h:\s*(.*)/);
                return match ? { hour: parseInt(match[1]), name: match[2].trim() } : null;
            }).filter(c => c !== null);

            // 2. On trie par heure pour être sûr
            parsedCourses.sort((a, b) => a.hour - b.hour);

            // 3. On fusionne les blocs adjacents identiques
            if (parsedCourses.length > 0) {
                let currentBlock = { 
                    dayIndex: dayIndex + 2, // +2 car col 1=Heures, donc Lundi=2
                    startHour: parsedCourses[0].hour,
                    duration: 1,
                    name: parsedCourses[0].name
                };

                for (let i = 1; i < parsedCourses.length; i++) {
                    const course = parsedCourses[i];
                    // Si même nom ET heure qui suit directement l'heure précédente
                    if (course.name === currentBlock.name && course.hour === (currentBlock.startHour + currentBlock.duration)) {
                        currentBlock.duration++; // On étend le bloc
                    } else {
                        // Sinon on sauvegarde le vieux bloc et on en commence un nouveau
                        consolidatedEvents.push(currentBlock);
                        currentBlock = {
                            dayIndex: dayIndex + 2,
                            startHour: course.hour,
                            duration: 1,
                            name: course.name
                        };
                    }
                }
                // Ne pas oublier d'ajouter le dernier bloc
                consolidatedEvents.push(currentBlock);
            }
        });

        return consolidatedEvents;
    }, [student]);


    if (loading) return <div style={{padding:"2rem"}}>Chargement...</div>;
    if (!student) return <div style={{padding:"2rem"}}>Étudiant introuvable</div>;

    return (
        <div style={{ padding: "2rem" }}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <Link to="/timetables" style={{color: 'var(--text-muted)'}}>← Retour</Link>
                <div style={{textAlign: 'right'}}>
                    <h1 style={{margin:0}}>{student.name}</h1>
                    <small style={{color: 'var(--text-muted)'}}>MAJ: {student.lastUpdate}</small>
                </div>
            </div>

            <div className="calendar-container">
                {/* 1. Case vide (Coin haut gauche) */}
                <div className="calendar-header" style={{borderRight:'1px solid var(--border)'}}></div>

                {/* 2. En-têtes Jours (Ligne 1) */}
                {days.map(day => (
                    <div key={day} className="calendar-header">{day}</div>
                ))}

                {/* 3. Colonne des Heures (Col 1) */}
                {Array.from({ length: totalHours }).map((_, i) => (
                    <div 
                        key={i} 
                        className="time-label"
                        style={{ gridRow: i + 2 }} // +2 car ligne 1 = Header
                    >
                        {startHour + i}h
                    </div>
                ))}

                {/* 4. Grille de fond (Les cases vides pour faire joli) */}
                {Array.from({ length: totalHours }).map((_, hIndex) => (
                    days.map((_, dIndex) => (
                        <div 
                            key={`grid-${hIndex}-${dIndex}`}
                            className="grid-cell-bg"
                            style={{
                                gridRow: hIndex + 2,
                                gridColumn: dIndex + 2
                            }}
                        />
                    ))
                ))}

                {/* 5. LES ÉVÉNEMENTS (Placés par dessus) */}
                {events.map((event, index) => {
                    // Calcul de la position
                    // Row Start : (Heure du cours - Heure Début Agenda) + 2 (pour sauter le header)
                    const rowStart = (event.startHour - startHour) + 2;
                    
                    return (
                        <div 
                            key={index}
                            className="event-card"
                            style={{
                                gridColumn: event.dayIndex,
                                gridRow: `${rowStart} / span ${event.duration}` // <--- LA MAGIE EST ICI
                            }}
                        >
                            <strong>{event.name}</strong>
                            <span style={{fontSize:'0.75rem', opacity: 0.8}}>
                                {event.startHour}h - {event.startHour + event.duration}h
                            </span>
                        </div>
                    );
                })}

            </div>
        </div>
    );
}