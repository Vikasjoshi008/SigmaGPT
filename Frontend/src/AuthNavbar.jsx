import "./AuthNavbar.css";
import { Link, useLocation } from "react-router-dom";

function AuthNavbar() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  return (
    <nav className="authNavbar">
      <div className="logo">SigmaGPT</div>
      <div className="navAction">
        {isLoginPage ? (
          <Link to="/signup" className="navBtn">login</Link>
        ) : (
          <Link to="/login" className="navBtn">signup</Link>
        )}
      </div>
    </nav>
  );
}

export default AuthNavbar;
