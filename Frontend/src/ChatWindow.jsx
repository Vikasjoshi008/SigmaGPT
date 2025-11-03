import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect} from "react";
import {ScaleLoader} from "react-spinners";
import { useNavigate } from "react-router-dom";


function ChatWindow() {
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
    const user = JSON.parse(localStorage.getItem("user"));



    const getReply = async() => {
    setLoading(true);
    setNewChat(false)
    console.log("message", prompt, "threadId", currThreadId);
        const options= {
            method: "post",
            credentials: "include", // <-- Ensure session/cookies go with request
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId
            }),
        };

        try {
            const response=await fetch("https://sigmagpt-fgqc.onrender.com/api/ai/chat", options);
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

useEffect(() => {
  const input = document.querySelector(".inputBox input");
  if (input) {
    input.addEventListener("focus", () => {
      setTimeout(() => {
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    });
  }
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
        </div>
      </div>
      {
        isopen && 
        <div className="dropDown">
          <p>{user.email}</p>
          <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
          <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade Plan</div>
          <div className="dropDownItem" onClick={handleLogout}><i className="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
        </div>
      }
      <Chat></Chat>
      <ScaleLoader color="#fff" loading={loading} />

      <div className="chatInput">
        <div className="inputBox">
          <input type="text" placeholder="Ask SigmaGPT"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" ? getReply() : ''} />
          <div id="submit" onClick={getReply}>
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>
        <p></p>
      </div>
    </div>
  );
}

export default ChatWindow;
