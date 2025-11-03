import "./Signup.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// import { GoogleLogin } from "@react-oauth/google";
import AuthNavbar from "./AuthNavbar.jsx";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      const res = await fetch("https://sigmagpt-fgqc.onrender.com/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
       if (!name || !email || !password) {
        alert("All fields are required");
        return;
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/chat");
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
        {/* <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const token = credentialResponse.credential;

            try {
              const res = await fetch("https://sigmagpt-fgqc.onrender.com/api/auth/google", {
                method: "POST",
                credentials: "include", // ✅ important for session cookies
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ token })
              });

              const data = await res.json();
              if (res.ok) {
                localStorage.setItem("user", JSON.stringify(data.user));
                navigate("/chat");
              } else {
                alert(data.error || "Google login failed");
              }
            } catch (err) {
              console.error("Google login error:", err);
              alert("Server error");
            }
          }}
          onError={() => console.log("Google login failed")}
        ></GoogleLogin> */}
        <button
        type="button"
        className="auth-google-btn"
        onClick={() => { 
          window.location.href = "https://sigmagpt-fgqc.onrender.com/api/auth/google";
        }}
      >
        <img src="https://www.google.com/imgres?q=google%20login%20logo&imgurl=https%3A%2F%2Fimage.similarpng.com%2Ffile%2Fsimilarpng%2Fvery-thumbnail%2F2020%2F06%2FLogo-google-icon-PNG.png&imgrefurl=https%3A%2F%2Fsimilarpng.com%2Flogo-google-icon-png%2F&docid=JEUYSn3sW30bnM&tbnid=G8-QBskpy1OIsM&vet=12ahUKEwjD3va80NWQAxVNSGwGHUNnFoYQM3oECBwQAA..i&w=600&h=600&hcb=2&ved=2ahUKEwjD3va80NWQAxVNSGwGHUNnFoYQM3oECBwQAA" alt="Google Logo" /> Continue with Google
      </button>

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
        <button className="auth-btn" onClick={handleSignup}>
          Create Account
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
