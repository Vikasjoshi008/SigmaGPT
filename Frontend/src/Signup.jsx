import "./Signup.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthNavbar from "./AuthNavbar.jsx";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  

  const handleSignup = async () => {
    try {
       if (!name || !email || !password) {
        alert("All fields are required");
        return;
      }
      if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
      }      
      setLoading(true);
      const res = await fetch("https://sigmagpt-fgqc.onrender.com/api/auth/signup", {
        method: "POST",
        // credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      
      if (res.ok && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("storage"));
        navigate("/chat"); // ✅ ensures token is saved
        window.location.reload(); 
        // window.dispatchEvent(new Event("storage")); // ✅ triggers App.jsx to update
      } else {
        alert(data.error || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <>
    <AuthNavbar />
    <div className="auth-bg">
      <div className="auth-card">
        <h2>Sign Up</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="auth-input"
        />
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
        <button className="auth-btn" disabled={loading} onClick={handleSignup}>
        {loading ? "Creating account..." : "Create Account"}
        </button>
        <div className="switch-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
    </>
  );
}

export default Signup;
