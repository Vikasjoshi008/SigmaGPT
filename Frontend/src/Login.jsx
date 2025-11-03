import "./Login.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import AuthNavbar from "./AuthNavbar";
import { GoogleLogin } from "@react-oauth/google";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const handleGoogleLogin = async (credentialResponse) => {
  const token = credentialResponse.credential;
  const decoded = jwtDecode(token);
  console.log("Google user:", decoded);

  try {
    const res = await fetch("https://sigmagpt-fgqc.onrender.com/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/chat");
    } else {
      alert(data.error || "Google login failed");
    }
  } catch (err) {
    console.error("Google login error:", err);
    alert("Server error");
  }
};


  const handleLogin = async () => {
    try {
      const res = await fetch("https://sigmagpt-fgqc.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      console.log(data);
      if (!email || !password) {
        alert("All fields are required");
        return;
      }
      if (res.ok) {
            alert("Login successful!");
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            navigate("/chat");
      } else {
        if ((data.error && data.error.toLowerCase().includes("not found")) || (data.message && data.message.toLowerCase().includes("not found"))) {
          alert("This user is not registered, please sign up.");
        } else {
          alert(data.error || "Login failed");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <>
    <AuthNavbar/>                         
    <div className="auth-bg">
      <div className="auth-card">
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        <GoogleLogin
        onSuccess={handleGoogleLogin}
        onError={() => console.log("Google login failed")}
      />
        <button className="auth-btn" disabled={loading} onClick={handleLogin}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="switch-link">
          Don't have an account? <Link to="/">Sign up</Link>
        </div>
      </div>
    </div>
    </>
  );
}

export default Login;
