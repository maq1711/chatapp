import { Navigate } from "react-router-dom"
import { useAppSelector } from "../hooks/reduxHooks"

export default function ProtectedRoute({ children }: any) {

  const token = useAppSelector((state) => state.auth.token)

  if (!token) {
    return <Navigate to="/login" />
  }

  return children
}