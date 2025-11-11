import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef} from "react";
import {ScaleLoader} from "react-spinners";
import { useNavigate } from "react-router-dom";


function ChatWindow({user}) {
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
          setSidebarOpen
        }=useContext(MyContext);
    const [loading, setLoading]=useState(false);
    const [isopen, setIsOpen]=useState(false);
    const navigate = useNavigate();
    const [isListening, setIsListening] = useState(false);
    const [supportsSR, setSupportsSR] = useState(false);
    const recognitionRef = useRef(null);
    const interimRef = useRef("");   // for interim transcripts
    const finalRef = useRef("");     // for final transcript

    const token = localStorage.getItem("token");

    useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setSupportsSR(true);
      const rec = new SR();
      rec.lang = "en-IN";            // set your language
      rec.interimResults = true;
      rec.continuous = false;        // stop after a pause (good UX on mobile)
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
        // show interim in the input while talking
        const display = (final + " " + interim).trim();
        setPrompt(display);
      };

      rec.onerror = (e) => {
        console.warn("Speech error:", e.error);
        setIsListening(false);
      };

      rec.onend = async () => {
        setIsListening(false);
        const text = (finalRef.current || "").trim();
        if (!text) return;
      
        // Keep input in sync for UX
        setPrompt(text);
        if (text) {
          // Optional: auto-send after speech ends
          if (!user) {
            alert("Sign up or login to chat with SigmaGPT");
            return;
          }
          // If you want to only fill the input (not auto-send), comment next 2 lines:
          // await getReply(text); // uses current `prompt` which we kept in sync
        }
      };
    }
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, []);

    const startListening = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.start(); // triggers permission prompt first time
    } catch {}
  };

  const stopListening = () => {
    const rec = recognitionRef.current;
    try { rec.stop(); } catch {}
  };

  const toggleMic = () => {
    if (!supportsSR) {
      alert("Voice input not supported in this browser. Try Chrome.");
      return;
    }
    if (isListening) stopListening();
    else startListening();
  };


    const getReply = async(overrideText) => {
      const msg = (overrideText ?? prompt ?? "").trim();
      if (!msg) {
        console.warn("Skip send: empty message");
        return;
      }
      if (!currThreadId) {
        console.warn("Skip send: missing threadId");
        // TODO: create threadId here if your app supports it
        return;
      }

    setLoading(true);
    setNewChat(false)
    console.log("message", prompt, "threadId", currThreadId);
        const history = prevChats.slice(-8);
        const options= {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId,
                history
            }),
        };

        try {
            const response=await fetch("https://sigmagpt-fgqc.onrender.com/api/chat", options);
            const res=await response.json()
            console.log(res.reply);
            setReply(res.reply);
        } catch(err) {
            console.log(err);
        }
      setLoading(false);
    }

    //append new chat to prev chats
    useEffect(() => {
      if(prompt && reply) {
        setPrevChats(prevChats => [
          ...prevChats, 
          {
            role: "user",
            content: prompt
          },{
            role: "assistant",
            content: reply
          }
        ]);
      setPrompt("");
      }
    }, [reply]);

    const handleProfileClick = () => {
      setIsOpen(!isopen);
    }

  const handleLogout = async () => {
  try {
    const res = await fetch("https://sigmagpt-fgqc.onrender.com/api/auth/logout", {
      method: "POST",
      credentials: "include"
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

// useEffect(() => {
//   const input = document.querySelector(".inputBox input");
//   if (input) {
//     input.addEventListener("focus", () => {
//       setTimeout(() => {
//         input.scrollIntoView({ behavior: "smooth", block: "center" });
//       }, 300);
//     });
//   }
// }, []);
 useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
      // height available for layout (helps iOS/Android keyboards)
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
      // additional bottom offset when keyboard is visible
      const bottomOffset = Math.max(0, (window.innerHeight - vv.height - vv.offsetTop));
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
      {/* Floating hamburger when sidebar is closed */}
      <div className="navLeft">
      {!sidebarOpen && (
        <div className="floatingHamburger" onClick={() => {setSidebarOpen(true)}}>
          <i className="fa-solid fa-bars"></i>
        </div>
      )}
      </div>
        <div className="userIconDiv" onClick={handleProfileClick}>
          <span className="userIcon">
            {user?.name?.[0]?.toUpperCase() || "?"}
          </span>
          {isopen && (
            <div className="dropDown">
              {user ? (
                <>
                  <p>{user.email}</p>
                  <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                  <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade Plan</div>
                  <div className="dropDownItem" onClick={handleLogout}><i className="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
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
      <Chat></Chat>
      <ScaleLoader color="#fff" loading={loading} />

      <div className="chatInput">
        <div className="inputBox">
          <input type="text" placeholder="Ask SigmaGPT"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && prompt.trim()) {
              if(!user) {
                alert("Signup or login to chat with SigmaGPT");
                return;
              }
              getReply();
            }
          }}
          />
            <button
            type="button"
            className={`micBtn ${isListening ? "active" : ""}`}
            aria-label={isListening ? "Stop recording" : "Start recording"}
            onClick={toggleMic}
          >
            <i className="fa-solid fa-microphone"></i>
          </button>
          <div id="submit" onClick={() => {
            if(!user) {
              alert("Sign up or login to chat with SigmaGPT");
              return;
            }
            if (prompt.trim()) getReply()
            }}>
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>
        <p></p>
      </div>
    </div>
  );
}

export default ChatWindow;
