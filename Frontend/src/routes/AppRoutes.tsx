import { Routes, Route } from "react-router-dom";
import Login from "../pages/public/login/login";
import ChatLayout from "../layouts/ChatLayout";
import ProtectedRoute from "./Guards/ProtectedRoute";
import Register from "../pages/public/register/register";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />}/>
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}