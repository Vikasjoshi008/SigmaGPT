import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect} from "react";
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

    const token = localStorage.getItem("token");


    const getReply = async() => {
    setLoading(true);
    setNewChat(false)
    console.log("message", prompt, "threadId", currThreadId);
        const options= {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId
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
