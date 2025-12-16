import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import TimetableList from "./pages/TimetableList";
import StudentDetail from "./pages/StudentDetail";

function App() {
  return (
    <div>
      <Navbar />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/timetables" element={<TimetableList />} />
        <Route path="/student/:id" element={<StudentDetail />} />
      </Routes>
    </div>
  );
}

export default App;