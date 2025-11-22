import "../styles/Login.css";
import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthNavbar from "../components/AuthNavbar.jsx";
import { auth, provider, signInWithPopup } from "../../firebase.js";
import { MyContext } from "../MyContext.jsx";
import Galaxy from "../components/Galaxy.jsx";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuthLoading } = useContext(MyContext);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("All fields are required");
      return;
    }
    setAuthLoading(true);
    setLoading(true);
    try {
      const res = await fetch("https://nexora-c41k.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
        if (
          (data.error && data.error.toLowerCase().includes("not found")) ||
          (data.message && data.message.toLowerCase().includes("not found"))
        ) {
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
      const idToken = await result.user.getIdToken(true);

      if (!idToken) {
        alert("Failed to retrieve Firebase token");
        setAuthLoading(false);
        return;
      }

      const res = await fetch("https://nexora-c41k.onrender.com/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
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
        {/* animated gradient blobs are created via CSS pseudo-elements */}
        <div className="auth-card" role="region" aria-label="Login form">
          <h2 className="auth-title">
            Login
            <div className="auth-sub">Welcome back, let’s get you in.</div>
          </h2>

          <label className="field">
            <input
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              aria-label="Email"
            />
            <span className="field-label">Email</span>
          </label>

          <label className="field password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              aria-label="Password"
            />
            <span className="field-label">Password</span>
            {password && (
              <button
                type="button"
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`fa-solid ${showPassword ? "fa-eye" : "fa-eye-slash"}`}></i>
              </button>
            )}
          </label>

          <button className="auth-btn" disabled={loading} onClick={handleLogin}>
            {loading ? "Logging in..." : "Login"}
            <span className="btn-ink" />
          </button>

          <button className="googleBtn" onClick={handleGoogleLogin}>
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google logo"
              style={{ width: "20px", marginRight: "8px" }}
            />
            Continue with Google
          </button>

          <div className="switch-link">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

export default Login;
