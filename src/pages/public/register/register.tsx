import { useState } from "react";
import { Link } from "react-router-dom";
import "./login.css";

export default function Login() {
  // const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState();
  const handleLogin = (data: any) => {
    console.log(data);
  };

  return (
    <div
      style={{ width: "300px", margin: "100px auto" }}
      className="login-container"
    >
      <h2>Register</h2>

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

        <button type="submit" disabled={loading} style={{ width: "100%", height: "2.5em" }}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <p  style={{ margin: "10px 0" }}>
        Already have an account? <Link to="/">Login</Link>
      </p>
    </div>
  );
}
