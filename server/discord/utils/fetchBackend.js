import axios from "axios";

const URL = process.env.BACKEND_URL;

export async function fetchSchedule(etudiantId) {
  const res = await axios.get(`${URL}/api/schedule/${encodeURIComponent(etudiantId)}`);
  return res.data;
}

export async function batchUpdateSchedule(etudiantId, updates) {
  const res = await axios.post(
    `${URL}/api/schedule/batch/${encodeURIComponent(etudiantId)}`,
    { updates }
  );
  return res.data;
}
