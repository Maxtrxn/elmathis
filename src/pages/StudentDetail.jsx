import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";

export default function StudentDetail() {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Nouvel état pour le mode édition
    const [isEditing, setIsEditing] = useState(false);

    // Fonction pour charger les données (extraite pour pouvoir recharger après modif)
    const loadData = () => {
        setLoading(true);
        fetch(`http://localhost:3001/api/schedule/${id}`)
            .then(res => res.json())
            .then(data => {
                setStudent(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, [id]);

    // --- FONCTION DE MODIFICATION ---
    const handleCellClick = async (day, hour, currentVal) => {
        if (!isEditing) return; // Si pas en mode édition, on ne fait rien

        // On demande le nouveau cours via une simple boite de dialogue
        const newCourse = window.prompt(`Cours du ${day} à ${hour}h ?`, currentVal || "");

        // Si l'utilisateur annule (null), on ne fait rien
        if (newCourse === null) return;

        // Appel au serveur pour sauvegarder
        try {
            const res = await fetch(`http://localhost:3001/api/schedule/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ day, hour, course: newCourse })
            });

            if (res.ok) {
                // Si ça a marché, on recharge la page pour voir les changements
                loadData();
            } else {
                alert("Erreur lors de la sauvegarde !");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur réseau");
        }
    };

    // --- LOGIQUE DE GRILLE ET FUSION (Identique à avant) ---
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    const startHour = 8;
    const endHour = 17;
    const totalHours = endHour - startHour + 1;

    const events = useMemo(() => {
        if (!student || !student.schedule) return [];
        let consolidatedEvents = [];
        days.forEach((day, dayIndex) => {
            const rawCourses = student.schedule[day] || [];
            let parsedCourses = rawCourses.map(str => {
                const match = str.match(/(\d+)h:\s*(.*)/);
                return match ? { hour: parseInt(match[1]), name: match[2].trim() } : null;
            }).filter(c => c !== null);
            
            parsedCourses.sort((a, b) => a.hour - b.hour);

            if (parsedCourses.length > 0) {
                let currentBlock = { 
                    dayIndex: dayIndex + 2,
                    startHour: parsedCourses[0].hour,
                    duration: 1,
                    name: parsedCourses[0].name,
                    dayName: day // On garde le nom du jour pour l'édition
                };

                for (let i = 1; i < parsedCourses.length; i++) {
                    const course = parsedCourses[i];
                    if (course.name === currentBlock.name && course.hour === (currentBlock.startHour + currentBlock.duration)) {
                        currentBlock.duration++;
                    } else {
                        consolidatedEvents.push(currentBlock);
                        currentBlock = {
                            dayIndex: dayIndex + 2,
                            startHour: course.hour,
                            duration: 1,
                            name: course.name,
                            dayName: day
                        };
                    }
                }
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
                
                <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                    {/* BOUTON MODIFIER */}
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        style={{
                            backgroundColor: isEditing ? '#ef4444' : 'var(--primary)', // Rouge si actif
                            border: isEditing ? '2px solid white' : 'none'
                        }}
                    >
                        {isEditing ? "🔒 Terminer l'édition" : "✏️ Modifier"}
                    </button>

                    <div style={{textAlign: 'right'}}>
                        <h1 style={{margin:0}}>{student.name}</h1>
                        <small style={{color: 'var(--text-muted)'}}>MAJ: {student.lastUpdate}</small>
                    </div>
                </div>
            </div>
            
            {/* Message d'aide en mode édition */}
            {isEditing && (
                <div style={{textAlign:'center', marginBottom:'10px', color:'#ef4444', fontWeight:'bold'}}>
                    Cliquez sur une case vide ou un cours pour modifier.
                </div>
            )}

            <div className="calendar-container" style={{ borderColor: isEditing ? '#ef4444' : 'var(--border)' }}>
                {/* 1. Header Coin */}
                <div className="calendar-header" style={{borderRight:'1px solid var(--border)'}}></div>

                {/* 2. Header Jours */}
                {days.map(day => (
                    <div key={day} className="calendar-header">{day}</div>
                ))}

                {/* 3. Col Heures */}
                {Array.from({ length: totalHours }).map((_, i) => (
                    <div key={i} className="time-label" style={{ gridRow: i + 2 }}>
                        {startHour + i}h
                    </div>
                ))}

                {/* 4. GRILLE DE FOND (Maintenant cliquable !) */}
                {Array.from({ length: totalHours }).map((_, hIndex) => (
                    days.map((day, dIndex) => {
                        const currentHour = startHour + hIndex;
                        return (
                            <div 
                                key={`grid-${hIndex}-${dIndex}`}
                                className="grid-cell-bg"
                                style={{
                                    gridRow: hIndex + 2,
                                    gridColumn: dIndex + 2,
                                    // Change le curseur si on est en mode édition
                                    cursor: isEditing ? 'pointer' : 'default',
                                    backgroundColor: isEditing ? 'rgba(255,255,255,0.02)' : 'transparent'
                                }}
                                // Au clic, on appelle la fonction d'ajout
                                onClick={() => handleCellClick(day, currentHour, "")}
                            />
                        )
                    })
                ))}

                {/* 5. ÉVÉNEMENTS (Cliquables aussi !) */}
                {events.map((event, index) => {
                    const rowStart = (event.startHour - startHour) + 2;
                    return (
                        <div 
                            key={index}
                            className="event-card"
                            style={{
                                gridColumn: event.dayIndex,
                                gridRow: `${rowStart} / span ${event.duration}`,
                                cursor: isEditing ? 'pointer' : 'default',
                                border: isEditing ? '1px dashed white' : 'none'
                            }}
                            // Pour modifier un cours existant, on doit gérer chaque heure du bloc
                            // Ici on simplifie : on ne modifie que la première heure du bloc
                            onClick={(e) => {
                                e.stopPropagation(); // Évite de cliquer sur la grille en dessous
                                handleCellClick(event.dayName, event.startHour, event.name);
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