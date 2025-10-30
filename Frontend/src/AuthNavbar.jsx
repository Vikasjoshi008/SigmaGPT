import "./AuthNavbar.css";
import { Link, useLocation } from "react-router-dom";

function AuthNavbar() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  console.log("authnavbar rendered");

  return (
    <nav className="authNavbar">
      <div className="logo">SigmaGPT</div>
      <div className="navAction">
        {isLoginPage ? (
          <Link to="/" className="navBtn">Log in to use SigmaGPT</Link>
        ) : (
          <Link to="/login" className="navBtn">Sign up to use SigmaGPT</Link>
        )}
      </div>
    </nav>
  );
}

export default AuthNavbar;
