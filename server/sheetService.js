const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

const creds = require('./service-account.json');

const serviceAccountAuth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function getDoc() {
  // On récupère l'ID du Sheet depuis le .env (ou tu peux le mettre en dur ici si ça bug encore)
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

// 1. Récupère la liste des étudiants depuis la PREMIÈRE feuille (Image 1)
async function getStudentsList() {
  const doc = await getDoc();
  const sheet = doc.sheetsByIndex[0]; // Prend le premier onglet
  
  const rows = await sheet.getRows();

  // On transforme les lignes du sheet en objets JSON propres
  const students = rows.map(row => {
    return {
      // Comme tu as ajouté les titres "Nom" et "ID" ligne 1, on peut utiliser .get()
      name: row.get('Nom'), 
      id: row.get('ID')
    };
  });

  console.log("Étudiants chargés :", students.length); // Petit log pour vérifier
  return students;
}

// 2. Récupère l'emploi du temps d'un étudiant via son ID
async function getStudentSchedule(studentId) {
  const doc = await getDoc();

  // ASTUCE : On cherche l'onglet dont le titre CONTIENT l'ID.
  // Ça résout le problème des espaces "ID - Nom" ou "ID-Nom"
  const sheet = doc.sheetsByIndex.find(s => s.title.includes(studentId));

  if (!sheet) return null;

  // On charge les cellules de la plage de l'emploi du temps (A1 à F11 pour les cours + B14 pour la MAJ)
  // Rows 2 à 11 (Heures 8 à 17)
  await sheet.loadCells('A1:F15'); 

  // Récupération de la dernière MAJ (Cellule B14 -> Row 13, Col 1 en index 0)
  const lastUpdate = sheet.getCell(13, 1).value; 

  const schedule = {
    Lundi: [],
    Mardi: [],
    Mercredi: [],
    Jeudi: [],
    Vendredi: []
  };

  // Mapping des colonnes (0=Heure, 1=Lundi, 2=Mardi...)
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  // On boucle sur les heures (Lignes 2 à 11 dans Excel -> Index 1 à 10)
  for (let row = 1; row <= 10; row++) {
    const hour = sheet.getCell(row, 0).value; // Colonne A (Heure)

    // Pour chaque jour (Colonnes B à F -> Index 1 à 5)
    days.forEach((day, index) => {
      const colIndex = index + 1;
      const course = sheet.getCell(row, colIndex).value;

      if (course) {
        // On ajoute le cours s'il y a quelque chose d'écrit
        schedule[day].push(`${hour}h: ${course}`);
      }
    });
  }

  return {
    id: studentId,
    name: sheet.title, // On renvoie le titre de l'onglet comme nom complet
    lastUpdate: lastUpdate,
    schedule: schedule
  };
}

module.exports = { getStudentsList, getStudentSchedule };