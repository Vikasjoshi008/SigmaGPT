import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect} from "react";
import {ScaleLoader} from "react-spinners";

function ChatWindow() {
    const {prompt, 
          setPrompt, 
          reply, 
          setReply, 
          currThreadId,
          prevChats,
          setPrevChats,
          setNewChat
        }=useContext(MyContext);
    const [loading, setLoading]=useState(false);
    const [isopen, setIsOpen]=useState(true);

    const getReply = async() => {
    setLoading(true);
    setNewChat(false)
    console.log("message", prompt, "threadId", currThreadId);
        const options= {
            method: "post",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId
            }),
        };

        try {
            const response=await fetch("http://localhost:8080/api/chat", options);
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

  return (
    <div className="chatWindow">
      <div className="navbar">
        <span>SigmGPT</span>
        <div className="userIconDiv" onClick={handleProfileClick}>
          <span className="userIcon">
            <i className="fa-solid fa-user"></i>
          </span>
        </div>
      </div>
      {
        isopen && 
        <div className="dropDown">
          <div className="dropDownItem"><i class="fa-solid fa-gear"></i> Settings</div>
          <div className="dropDownItem"><i class="fa-solid fa-cloud-arrow-up"></i> Upgrade Plan</div>
          <div className="dropDownItem"><i class="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
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
