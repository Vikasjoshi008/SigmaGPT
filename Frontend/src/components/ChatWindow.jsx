import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "../MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";

function ChatWindow({ user }) {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    prevChats,
    setPrevChats,
    setNewChat,
    sidebarOpen,
    setSidebarOpen,
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [isopen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [supportsSR, setSupportsSR] = useState(false);

  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const interimRef = useRef(""); // interim transcript
  const finalRef = useRef("");   // final transcript
  const lastSentRef = useRef(""); // last user message actually sent
  const token = localStorage.getItem("token");

  // no-op to avoid errors if you add TTS later
  const stopSpeak = () => {};

  // ---- SpeechRecognition setup (desktop + Android Chrome) ----
  useEffect(() => {
    (async () => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

      // optional: log permission state if supported
      if (navigator.permissions?.query) {
        try {
          const st = await navigator.permissions.query({ name: "microphone" });
          console.log("Mic permission state:", st.state);
        } catch {}
      }

      if (!SR) {
        setSupportsSR(false);
        return;
      }
      setSupportsSR(true);

      const rec = new SR();
      rec.lang = "en-IN";
      rec.interimResults = true;
      rec.continuous = false;
      recognitionRef.current = rec;

      rec.onstart = () => {
        interimRef.current = "";
        finalRef.current = "";
        setIsListening(true);
      };

      rec.onresult = (e) => {
        let interim = "";
        let final = finalRef.current;
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t;
          else interim += t;
        }
        finalRef.current = final;
        setPrompt((final + " " + interim).trim());
      };

      rec.onerror = (e) => {
        console.warn("Speech error:", e.error);
        setIsListening(false);
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          alert("Microphone permission is blocked. In Chrome: lock icon → Microphone → Allow, or Settings → Site settings → Microphone.");
        } else if (e.error === "audio-capture") {
          alert("No microphone detected or permission blocked in OS settings.");
        }
      };

      rec.onend = async () => {
        setIsListening(false);
        const text = (finalRef.current || "").trim();
        if (!text) return;
        setPrompt(text);
        if (!user) { alert("Sign up or login to chat with SigmaGPT"); return; }
        await getReply(text); // append handled after reply via lastSentRef
      };
    })();

    return () => {
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, [user, setPrompt]);

  // ---- Mic toggle (preflight permission, then start inside click) ----
  const toggleMic = async () => {
    const rec = recognitionRef.current;

    if (!rec) {
      alert("Voice input isn’t supported on this browser. Try Chrome on Android, or use the keyboard.");
      return;
    }

    stopSpeak();

    try {
      if (isListening) {
        rec.stop();
        return;
      }

      // preflight: triggers permission prompt (HTTPS + user gesture required)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // free mic so SR can use it
      stream.getTracks().forEach(t => t.stop());

      rec.start(); // must be called directly in click handler on mobile
    } catch (err) {
      console.warn("getUserMedia error:", err?.name || err, err?.message);
      alert("Microphone permission denied. Enable it in your browser/phone settings and try again.");
    }
  };

  // ---- Send message to backend (uses override text if provided) ----
  const getReply = async (overrideText) => {
    const msg = (overrideText ?? prompt ?? "").trim();
    if (!msg) { console.warn("Skip send: empty message"); return; }
    if (!currThreadId) { console.warn("Skip send: missing threadId"); return; }

    lastSentRef.current = msg; // remember what we actually sent

    setLoading(true);
    setNewChat(false);
    console.log("message", msg, "threadId", currThreadId);

    const history = prevChats.slice(-8);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: msg,
        threadId: currThreadId,
        history,
      }),
    };

    try {
      const response = await fetch("https://sigmagpt-fgqc.onrender.com/api/chat", options);
      const res = await response.json();
      if (!response.ok) {
        console.error("Chat error:", response.status, res);
        alert(res?.error || "Chat failed");
        return;
      }
      console.log(res.reply);
      setReply(res.reply);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // ---- Append to history ONLY when reply changes (not while typing) ----
  useEffect(() => {
    if (!reply) return;
    const sent = (lastSentRef.current || "").trim();
    if (!sent) return;

    setPrevChats((prev) => [
      ...prev,
      { role: "user", content: sent },
      { role: "assistant", content: reply },
    ]);

    // reset for next turn
    lastSentRef.current = "";
    setPrompt("");
  }, [reply, setPrevChats, setPrompt]);

  const handleProfileClick = () => setIsOpen(!isopen);

  const handleLogout = async () => {
    try {
      const res = await fetch("https://sigmagpt-fgqc.onrender.com/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        alert("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Server error during logout");
    }
  };

  // ---- Keep input above mobile keyboards ----
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
      const bottomOffset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--vv-bottom", `${bottomOffset}px`);
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
    };
  }, []);

  return (
    <div className="chatWindow">
      <div className="navbar">
        <div className="navLeft">
          {!sidebarOpen && (
            <div className="floatingHamburger" onClick={() => setSidebarOpen(true)}>
              <i className="fa-solid fa-bars"></i>
            </div>
          )}
        </div>

        <div className="userIconDiv" onClick={handleProfileClick}>
          <span className="userIcon">{user?.name?.[0]?.toUpperCase() || "?"}</span>
          {isopen && (
            <div className="dropDown">
              {user ? (
                <>
                  <p>{user.email}</p>
                  <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                  <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade Plan</div>
                  <div className="dropDownItem" onClick={handleLogout}>
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
                  </div>
                </>
              ) : (
                <>
                  <div className="dropDownItem" onClick={() => navigate("/signup")}>
                    <i className="fa-solid fa-user-plus"></i> Sign up
                  </div>
                  <div className="dropDownItem" onClick={() => navigate("/login")}>
                    <i className="fa-solid fa-right-to-bracket"></i> Log in
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Chat />
      <ScaleLoader color="#fff" loading={loading} />

      <div className="chatInput">
        <div className="inputBox">
          <input
            type="text"
            placeholder="Ask SigmaGPT"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const msg = (prompt || "").trim();
                if (!msg) return;
                if (!user) {
                  alert("Signup or login to chat with SigmaGPT");
                  return;
                }
                getReply(msg); // send the exact text
              }
            }}
          />

          {/* Mic button */}
          <button
            type="button"
            className={`micBtn ${isListening ? "active" : ""}`}
            aria-label={isListening ? "Stop recording" : "Start recording"}
            onClick={toggleMic}
          >
            <i className="fa-solid fa-microphone"></i>
          </button>

          {/* Send button */}
          <div
            id="submit"
            onClick={() => {
              if (!user) {
                alert("Sign up or login to chat with SigmaGPT");
                return;
              }
              const msg = (prompt || "").trim();
              if (msg) getReply(msg);
            }}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>
        <p></p>
      </div>
    </div>
  );
}

export default ChatWindow;
