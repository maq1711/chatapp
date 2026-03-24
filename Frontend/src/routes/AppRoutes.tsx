import { Routes, Route } from "react-router-dom";
import Login from "../pages/public/login/login";
import ChatLayout from "../layouts/ChatLayout";
import ProtectedRoute from "./Guards/ProtectedRoute";
import GuestRoute from "./Guards/GuestRoute";
import Register from "../pages/public/register/register";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/chat" element={<ChatLayout />} />
      </Route>
    </Routes>
  );
}