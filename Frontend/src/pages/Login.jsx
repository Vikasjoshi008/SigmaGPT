import "./Login.css";
import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthNavbar from "../components/AuthNavbar.jsx";
import { auth, provider, signInWithPopup } from "../../firebase.js";
import { MyContext } from "../MyContext.jsx";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {setAuthLoading}= useContext(MyContext);
  const navigate = useNavigate();

  const handleLogin = async () => {
      if (!email || !password) {
        alert("All fields are required");
        return;
      }
      setAuthLoading(true)
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
    } finally {
      setAuthLoading(false);
      setLoading(false);
    }
  };

   const handleGoogleLogin = async () => {
  try {
    setAuthLoading(true);
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken(true); // 🔥 Firebase ID token

    if (!idToken) {
      alert("Failed to retrieve Firebase token");
      setAuthLoading(false);
      return;
    }
    // Verify token length and format before sending
    console.log("Firebase ID Token retrieved (length):", idToken.length);
    console.log("Firebase ID Token prefix check:", idToken.startsWith("eyJhbGciOiJSUzI1NiIsImtpZCI6"));

    const res = await fetch("https://sigmagpt-fgqc.onrender.com/api/auth/firebase", {
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
    <AuthNavbar/>                         
    <div className="auth-bg">
      <div className="auth-card">
        <h2>Login
          <div className="auth-sub">Welcome back — let’s get you in.</div>
        </h2>
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
