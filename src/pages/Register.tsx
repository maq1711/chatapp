import { useState } from "react"
import { useAppDispatch } from "../hooks/reduxHooks"
import { registerUser } from "../features/auth/authSlice"

export default function Register() {

  const dispatch = useAppDispatch()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()

    dispatch(registerUser({ email, password }))
  }

  return (
    <form onSubmit={handleRegister}>

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">Register</button>

    </form>
  )
}