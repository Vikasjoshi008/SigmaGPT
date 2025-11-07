import "./Login.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthNavbar from "./AuthNavbar";
import { auth, provider, signInWithPopup } from "../firebase.js";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
      if (!email || !password) {
        alert("All fields are required");
        return;
      }
      setLoading(true);
    try {
      const res = await fetch("https://sigmagpt-fgqc.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      console.log(data);
      if (res.ok) {
            alert("Login successful!");
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            navigate("/chat");
            window.location.reload(); 
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

   const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken(); // 🔥 Firebase ID token

    const res = await fetch("https://sigmagpt-fgqc.onrender.com/api/auth/firebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: idToken })
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token); // your JWT
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("storage"));
      navigate("/chat");
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    console.error("Google login error:", err);
    alert("Google login failed");
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
        <div className="password-wrapper">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        {password && (
        <span
          className="eye-icon"
          onClick={() => setShowPassword(!showPassword)}
          style={{ cursor: "pointer" }}
        >
          <i className={`fa-solid ${showPassword ? "fa-eye" : "fa-eye-slash"}`}></i>
        </span>
        )}
        </div>
        <button className="auth-btn" disabled={loading} onClick={handleLogin}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <button className="googleBtn" onClick={handleGoogleLogin}>
          <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" style={{ width: "20px", marginRight: "8px" }} />
          Continue with Google
        </button>
        <div className="switch-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
    </>
  );
}

export default Login;
