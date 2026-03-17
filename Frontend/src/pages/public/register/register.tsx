import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../../../redux";
import bgImage from "../../../assets/images/bg.jpg";
import "./login.css";

export default function Register() {
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await register({
        fullName,
        email,
        password,
        bio: bio || undefined,
      }).unwrap();

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
      setError(err?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="login-container">
      <h1 className="auth-title">ChatApp</h1>
      <h3>Register</h3>

      {error && <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>{error}</p>}

      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
          required
        />

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
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
          required
        />

        <input
          type="text"
          placeholder="Bio (optional)"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          style={{ display: "block", marginBottom: "10px", width: "100%" }}
        />

        <button type="submit" disabled={isLoading} style={{ width: "100%", height: "2.5em" }}>
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>

      <p style={{ margin: "10px 0" }}>
        Already have an account? <Link to="/">Login</Link>
      </p>
      </div>
    </div>
  );
}
