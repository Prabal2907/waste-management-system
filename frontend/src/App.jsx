import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/login";
import Register from "../pages/register";
import Home from "../pages/home";
import AdminDashboard from "../pages/admin";
import Awareness from "../pages/wasteawareness";
import MapPage from "../pages/MapPage"; // In your Routes:

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<Home />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/awareness" element={<Awareness />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;
