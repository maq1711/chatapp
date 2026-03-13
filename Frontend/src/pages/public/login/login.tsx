import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../../redux";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await login({ email, password }).unwrap();
      // Save token and user info to localStorage
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify({
        id: result.id,
        fullName: result.fullName,
        email: result.email,
        profilePicture: result.profilePicture,
        bio: result.bio,
      }));
      navigate("/chat");
    } catch (err: any) {
      setError(err?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div
      style={{ width: "300px", margin: "100px auto" }}
      className="login-container"
    >
      <h2>Login</h2>

      {error && <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>{error}</p>}

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
          required
        />

        <button type="submit" disabled={isLoading} style={{ width: "100%", height: "2.5em" }}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ margin: "10px 0" }}>
        Don't have an account? <Link to="/register">Register</Link></p>
    </div>
  );
}
