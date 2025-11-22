import "../styles/Signup.css";
import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthNavbar from "../components/AuthNavbar.jsx";
import { auth, provider, signInWithPopup } from "../../firebase.js";
import { MyContext } from "../MyContext.jsx";
import Galaxy from "../components/Galaxy.jsx";


function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {setAuthLoading}=useContext(MyContext)

  const navigate = useNavigate();
  

  const handleSignup = async () => {
    try {
      setAuthLoading(true);
      if (!name || !email || !password) {
        alert("All fields are required");
        return;
      }
      if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
      }
      setLoading(true);
      const res = await fetch("https://nexora-c41k.onrender.com/api/auth/signup", {
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
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
  try {
    setAuthLoading(true);
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken(true); // 🔥 Firebase ID token

    if (!idToken) {
      setAuthLoading(false);
      alert("Failed to retrieve Firebase token");
      return;
    }
    // Verify token length and format before sending
    console.log("Firebase ID Token retrieved (length):", idToken.length);
    console.log("Firebase ID Token prefix check:", idToken.startsWith("eyJhbGciOiJSUzI1NiIsImtpZCI6"));

    const res = await fetch("https://nexora-c41k.onrender.com/api/auth/firebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: idToken }),
      credentials: "include" // Add this for mobile cross-origin credential handling
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
    console.error("Google login error (detailed):", err.name, err.message, err.code);
    alert(`Google login failed: ${err.message}`);
  } finally {
    setAuthLoading(false);
  }
};

  return (
    <>
     <div className="login-root">
        {/* Galaxy full-screen background */}
      <Galaxy />
      
      <AuthNavbar />
    
    
    <div className="auth-bg">
      <div className="auth-card">
        <h2>Sign Up
          <div className="auth-sub">Create your account to start chatting.</div>
        </h2>
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
        <button className="auth-btn" disabled={loading} onClick={handleSignup}>
        {loading ? "Creating account..." : "Create Account"}
        </button>
        <button className="googleBtn" onClick={handleGoogleLogin}>
          <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" style={{ width: "20px", marginRight: "8px" }} />
          Continue with Google
        </button>
        <div className="switch-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
    </div>
    </>
  );
}

export default Signup;
