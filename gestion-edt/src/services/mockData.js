export const STUDENTS_DATA = [
    {
        id: 1,
        name: "Jean Dupont",
        lastUpdate: "2023-10-25 14:00",
        schedule: {
            Lundi: ["8h-10h: Maths", "10h-12h: React", "14h-17h: Libre"],
            Mardi: ["9h-12h: NodeJs", "13h-15h: Anglais"],
            Mercredi: ["Journée libre"],
            Jeudi: ["8h-12h: Projet", "14h-18h: Projet"],
            Vendredi: ["Examen BDD"]
        }
    },
    {
        id: 2,
        name: "Marie Curie",
        lastUpdate: "2023-10-24 09:30",
        schedule: {
            Lundi: ["Physique", "Chimie"],
            Mardi: ["Recherche", "Conférence"],
            Mercredi: ["Libre"],
            Jeudi: ["Cours Magistral"],
            Vendredi: ["Repos"]
        }
    },
    // Tu peux en ajouter d'autres...
];

// Petite fonction pour simuler un appel API qui récupère un seul étudiant
export function getStudentById(id) {
    return STUDENTS_DATA.find(s => s.id === parseInt(id));
}