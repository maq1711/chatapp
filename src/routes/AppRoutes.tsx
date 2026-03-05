import { Routes, Route } from "react-router-dom"
import Login from "../pages/Login"
import Chat from "../pages/Chat"
import ProtectedRoute from "./ProtectedRoute"

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}