import { Routes, Route } from "react-router-dom"
import Login from "../pages/Login"
import Chat from "../pages/Chat"
import ProtectedRoute from "./ProtectedRoute"
import Register from "../pages/Register"

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />}/>
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