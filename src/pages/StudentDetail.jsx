import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faLock, faTrash, faFloppyDisk, faXmark, faCalendarDays } from '@fortawesome/free-solid-svg-icons';

export default function StudentDetail({currentUser}) {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Liste des admins : Karim, Nicolas, Zack et Florentin
    const ADMIN_IDS = ["664134848029655040", "334027602618482691", "372029803852726273", "274567060875509760"];

    const [selectedEvent, setSelectedEvent] = useState(null); // Stocke l'event en cours de modif

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



    useEffect(() => { loadData(); }, [id]);

    // Logique de Permission
    const isOwner = currentUser && (String(currentUser.id) === String(id));
    const isAdmin = currentUser && ADMIN_IDS.includes(String(currentUser.id));
    const canEdit = isOwner || isAdmin;

    // Logique de Sauvegarde
    const handleSaveBatch = async (original, newData, isDelete = false) => {
        const updates = [];
        const day = original.dayName;

        // Calculer l'ancien range complet
        const oldStart = original.startHour;
        const oldEnd = original.startHour + original.duration - 1;

        // Si suppression totale
        if (isDelete) {
            for (let h = oldStart; h <= oldEnd; h++) {
                updates.push({ day, hour: h, course: "" });
            }
        }
        else {
            // Modification / Redimensionnement
            const newStart = parseInt(newData.startHour);
            const newEnd = parseInt(newData.endHour); // inclus

            // On nettoie tout l'ancien range d'abord
            const minH = Math.min(oldStart, newStart);
            const maxH = Math.max(oldEnd, newEnd);

            for (let h = minH; h <= maxH; h++) {
                let val = "";

                // Si l'heure h est dans la nouvelle plage, on met le cours
                if (h >= newStart && h <= newEnd) {
                    val = newData.name;
                }
                // Sinon elle était dans l'ancienne plage mais plus dans la nouvelle, elle restera vide

                updates.push({ day, hour: h, course: val });
            }
        }

        // Envoi au serveur
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`http://localhost:3001/api/schedule/batch/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json','Authorization': `Bearer ${token}` },
                body: JSON.stringify({ updates })
            });
            if (res.ok) {
                setSelectedEvent(null);
                loadData();
            } else {
                alert("Erreur serveur");
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Calculs des grilles
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
                    dayName: day
                };
                for (let i = 1; i < parsedCourses.length; i++) {
                    const course = parsedCourses[i];
                    if (course.name === currentBlock.name && course.hour === (currentBlock.startHour + currentBlock.duration)) {
                        currentBlock.duration++;
                    } else {
                        consolidatedEvents.push(currentBlock);
                        currentBlock = { dayIndex: dayIndex + 2, startHour: course.hour, duration: 1, name: course.name, dayName: day };
                    }
                }
                consolidatedEvents.push(currentBlock);
            }
        });
        return consolidatedEvents;
    }, [student]);


    // Rendu
    if (loading) return <div style={{padding:"2rem"}}>Chargement...</div>;
    if (!student) return <div style={{padding:"2rem"}}>Étudiant introuvable</div>;

    return (
        <div style={{ padding: "2rem" }}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <Link to="/timetables" style={{color: 'var(--text-muted)'}}>← Retour</Link>
                <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                    {canEdit ? (
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            style={{
                                backgroundColor: isEditing ? '#ef4444' : 'var(--primary)',
                                border: isEditing ? '2px solid white' : 'none',
                                color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <FontAwesomeIcon icon={isEditing ? faLock : faPen} />
                            {isEditing ? "Terminer" : "Modifier"}
                        </button>
                    ) : (
                        <span style={{color:'gray', fontSize:'0.8rem', fontStyle:'italic'}}>
                            Mode lecture seule
                        </span>
                    )}
                    <div style={{textAlign: 'right'}}>
                        <h1 style={{margin:0}}>{student.name}</h1>
                        <small style={{color: 'var(--text-muted)'}}>MAJ: {student.lastUpdate}</small>
                    </div>
                </div>
            </div>

            <div className="calendar-container" style={{ borderColor: isEditing ? '#ef4444' : 'var(--border)' }}>
                <div className="calendar-header" style={{borderRight:'1px solid var(--border)'}}></div>
                {days.map(day => <div key={day} className="calendar-header">{day}</div>)}
                {Array.from({ length: totalHours }).map((_, i) => (
                    <div key={i} className="time-label" style={{ gridRow: i + 2 }}>{startHour + i}h</div>
                ))}

                {Array.from({ length: totalHours }).map((_, hIndex) => (
                    days.map((day, dIndex) => {
                        const currentHour = startHour + hIndex;
                        return (
                            <div
                                key={`grid-${hIndex}-${dIndex}`}
                                className="grid-cell-bg"
                                style={{
                                    gridRow: hIndex + 2, gridColumn: dIndex + 2,
                                    cursor: isEditing ? 'pointer' : 'default',
                                    backgroundColor: isEditing ? 'rgba(255,255,255,0.02)' : 'transparent'
                                }}
                                onClick={() => {
                                    if(isEditing && canEdit) {
                                        // Clic sur une case vide -> crée un nouveau bloc
                                        setSelectedEvent({
                                            dayName: day,
                                            startHour: currentHour,
                                            duration: 1,
                                            name: "",
                                            isNew: true // Marqueur pour dire c'est nouveau
                                        });
                                    }
                                }}
                            />
                        )
                    })
                ))}

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
                            onClick={(e) => {
                                e.stopPropagation();
                                if(isEditing && canEdit) {
                                    setSelectedEvent({ ...event, isNew: false });
                                }
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

            {/* Fenetre pour modifier/créer un créneau */}
            {selectedEvent && (
                <EditModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onSave={handleSaveBatch}
                    hoursRange={[8, 9, 10, 11, 12, 13, 14, 15, 16, 17]}
                />
            )}
        </div>
    );
}

// composant modal interne
function EditModal({ event, onClose, onSave, hoursRange }) {
    const [name, setName] = useState(event.name);
    const [startH, setStartH] = useState(event.startHour);
    const [endH, setEndH] = useState(event.startHour + event.duration - 1);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>
                    <FontAwesomeIcon icon={faCalendarDays} />
                    {event.isNew ? "Ajouter un cours" : "Modifier le cours"}
                </h3>
                <p style={{textAlign:'center', color:'gray', marginBottom:'20px'}}>
                    {event.dayName}
                </p>

                <div className="form-group">
                    <label>Nom du cours</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        autoFocus
                    />
                </div>

                <div style={{display:'flex', gap:'10px'}}>
                    <div className="form-group" style={{flex:1}}>
                        <label>De (Heure)</label>
                        <select value={startH} onChange={e => setStartH(parseInt(e.target.value))}>
                            {hoursRange.map(h => (
                                <option key={h} value={h}>{h}h</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{flex:1}}>
                        <label>À (Heure incluse)</label>
                        <select value={endH} onChange={e => setEndH(parseInt(e.target.value))}>
                            {hoursRange.filter(h => h >= startH).map(h => (
                                <option key={h} value={h}>{h}h</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="modal-actions">
                    {!event.isNew && (
                        <button className="btn-delete" onClick={() => onSave(event, null, true)}>
                            <FontAwesomeIcon icon={faTrash} style={{marginRight:'5px'}}/> Supprimer
                        </button>
                    )}
                    
                    <button className="btn-cancel" onClick={onClose}>
                        <FontAwesomeIcon icon={faXmark} style={{marginRight:'5px'}}/> Annuler
                    </button>
                    
                    <button 
                        className="btn-save" 
                        onClick={() => onSave(event, { name, startHour: startH, endHour: endH }, false)}
                    >
                        <FontAwesomeIcon icon={faFloppyDisk} style={{marginRight:'5px'}}/> Sauvegarder
                    </button>
                </div>
            </div>
        </div>
    );
}