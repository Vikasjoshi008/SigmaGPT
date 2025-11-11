import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
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
  const token = localStorage.getItem("token");

  // --- No-op to prevent errors if you later add TTS ---
  const stopSpeak = () => {};

  // --- SpeechRecognition setup (desktop + Android Chrome) ---
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
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
      const display = (final + " " + interim).trim();
      setPrompt(display);
    };

    rec.onerror = (e) => {
    console.warn("Speech error:", e.error);
    setIsListening(false);
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      alert("Microphone permission is blocked. In Chrome: lock icon → Microphone → Allow, or Settings → Site settings → Microphone.");
    } else if (e.error === "audio-capture") {
      alert("No microphone detected or permission blocked in OS settings.");
    } else if (e.error === "no-speech") {
      // user was silent; not a real failure
    }
  };


    rec.onend = async () => {
      setIsListening(false);
      const text = (finalRef.current || "").trim();
      if (!text) return;

      setPrompt(text);
      if (!user) {
        alert("Sign up or login to chat with SigmaGPT");
        return;
      }
      // Auto-send after speech ends:
      await getReply(text);
    };

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, [user, setPrompt]);

  // --- Mic toggle (must call start() directly in click handler on mobile) ---
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

    // ✅ Preflight mic permission (prompts user once)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // immediately release the mic so SR can use it
    stream.getTracks().forEach(t => t.stop());

    // ✅ Now start SR in the same user gesture
    rec.start();
  } catch (err) {
    // If user denied, you’ll land here
    console.warn("getUserMedia error:", err?.name || err, err?.message);
    alert("Microphone permission denied. Enable it in your browser/phone settings and try again.");
  }
};


  // --- Send message to backend (uses override if provided) ---
  const getReply = async (overrideText) => {
    const msg = (overrideText ?? prompt ?? "").trim();
    if (!msg) {
      console.warn("Skip send: empty message");
      return;
    }
    if (!currThreadId) {
      console.warn("Skip send: missing threadId");
      return;
    }

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
        message: msg, // ✅ use msg (not stale prompt)
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

  // --- Append new chat to history when reply arrives ---
  useEffect(() => {
    if (prompt && reply) {
      setPrevChats((prev) => [
        ...prev,
        { role: "user", content: prompt },
        { role: "assistant", content: reply },
      ]);
      setPrompt("");
    }
  }, [reply, prompt, setPrevChats, setPrompt]);

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

  // --- VisualViewport (keep input above keyboard) ---
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
                getReply(msg); // send the actual input text
              }
            }}
          />

          {/* Mic button */}
          <button
            type="button"
            className={`micBtn ${isListening ? "active" : ""}`}
            aria-label={isListening ? "Stop recording" : "Start recording"}
            onClick={toggleMic} // For iOS fallback later, switch to onMicClick
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
              if (msg) getReply(msg); // send the actual input text
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
