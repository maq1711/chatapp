import { useState } from "react"
import { useAppDispatch } from "../hooks/reduxHooks"
import { loginUser } from "../features/auth/authSlice"

export default function Login() {

  const dispatch = useAppDispatch()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    dispatch(loginUser({ email, password }))
  }

  return (
    <form onSubmit={handleLogin}>
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

      <button type="submit">Login</button>
    </form>
  )
}