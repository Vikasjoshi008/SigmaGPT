import "./AuthNavbar.css";

import { Link, useLocation } from "react-router-dom";

function AuthNavbar() {
  const { pathname } = useLocation();
  const isLoginPage = pathname === "/login";      // true on /login
  const isSignupPage = pathname === "/signup";    // true on /signup

  // Fix: show the *other* action (if on login, show Sign up; if on signup, show Log in)
  const cta = isLoginPage
    ? { to: "/signup", label: "Sign up" }
    : { to: "/login", label: "Log in" };

  return (
    <header className="authNavbar" role="banner">
      <div className="authNavbar__inner">
        <Link to="/" className="logo" aria-label="SigmaGPT Home">
          <span className="logo__blob" aria-hidden />
          <span className="logo__text">SigmaGPT</span>
        </Link>

        {(isLoginPage || isSignupPage) && (
          <Link to={cta.to} className="navBtn" aria-label={cta.label}>
            {cta.label}
          </Link>
        )}
      </div>
    </header>
  );
}

export default AuthNavbar;

