import "./Login.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
import AuthNavbar from "./AuthNavbar";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

// const handleGoogleLogin = async (credentialResponse) => {
//   const token = credentialResponse.credential;
//   const decoded = jwtDecode(token);
//   console.log("Google user:", decoded);

//   try {
//     const res = await fetch("https://sigmagpt-fgqc.onrender.com/api/auth/google", {
//       method: "POST",
//       credentials: "include",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({ token })
//     });
//     const data = await res.json();
//     if (res.ok) {
//       localStorage.setItem("user", JSON.stringify(data.user));
//       navigate("/chat");
//     } else {
//       alert(data.error || "Google login failed");
//     }
//   } catch (err) {
//     console.error("Google login error:", err);
//     alert("Server error");
//   }
// };


  const handleLogin = async () => {
    try {
      const res = await fetch("https://sigmagpt-fgqc.onrender.com/api/auth/login", {
        method: "POST",
        credentials: "include",
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
        <button className="auth-btn" onClick={handleLogin}>
          Login
        </button>
        <button
        type="button"
        className="auth-google-btn"
        onClick={() => { 
          window.location.href = "https://sigmagpt-fgqc.onrender.com/api/auth/google";
        }}
      >
        <img src="https://www.google.com/imgres?q=google%20sign%20in%20logo&imgurl=https%3A%2F%2Fmedia.wired.com%2Fphotos%2F5926ffe47034dc5f91bed4e8%2Fmaster%2Fpass%2Fgoogle-logo.jpg&imgrefurl=https%3A%2F%2Fwww.wired.com%2F2015%2F09%2Fgoogles-new-logo-trying-really-hard-look-friendly%2F&docid=xcfO8huj4InxHM&tbnid=yjNF1YrjSqFOpM&vet=12ahUKEwj33qWiq9WQAxWET2wGHS7LDwoQM3oECCIQAA..i&w=1604&h=802&hcb=2&ved=2ahUKEwj33qWiq9WQAxWET2wGHS7LDwoQM3oECCIQAA" alt="Google Logo" /> Continue with Google
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
