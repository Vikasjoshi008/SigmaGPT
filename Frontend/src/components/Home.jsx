import React from "react";
import { useNavigate } from "react-router-dom";
import Galaxy from "./Galaxy";
import "../styles/Home.css";

function Home({ user }) {
    const navigate = useNavigate();

  return (
    <div className="landing-root">
        {/* Background */}
        <Galaxy />
      {/* Foreground content */}
      <div className="landing-inner">
        {/* NAVBAR */}
        <header className="landing-nav">
          <div className="nav-left">
            {/* <div className="nav-logo-mark">
                <img src="" alt="" />
            </div> */}
            <span className="nav-logo-text">Nexora</span>
          </div>

          <nav className="nav-links">
            <button className="nav-link">Home</button>
            <button className="nav-link">Docs</button>
          </nav>

          <div className="nav-right">
            {user ? (
              <button
                className="nav-cta"
                onClick={() => navigate("/chat")}
              >
                Open app
              </button>
            ) : (
              <button
                className="nav-cta"
                onClick={() => navigate("/login")}
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        {/* HERO SECTION */}
        <main className="landing-hero">
          <div className="hero-copy">
            <p className="hero-pill">
              <span className="hero-pill-dot" /> New • AI workspace
            </p>

            <h1 className="hero-title">
              The <span className="hero-gradient-word">Nexora,</span> Where ideas
              <br />
              meet intelligence.
            </h1>
            <div className="hero-actions">
              <button
                className="hero-primary"
                onClick={() => navigate("/signup")}
              >
                Start chatting
              </button>
              <button
                className="hero-secondary"
                onClick={() => navigate("/login")}
              >
                Learn more
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Home;
