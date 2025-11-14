import "../styles/Sidebar.css";
import { MyContext } from "../MyContext";
import { useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import AuthLoader from "./AuthLoader.jsx";

function Sidebar({user}) {
  const {
    sidebarOpen,
    setSidebarOpen,
    allThreads,
    setAllThreads,
    currThreadId,
    setNewChat,
    setPrompt,
    setReply,
    setCurrThreadId,
    setPrevChats,
  } = useContext(MyContext);
  const {setAuthLoading}= useContext(MyContext);
  
  if (!sidebarOpen) return null; // ✅ hide sidebar when collapsed


  const getAllThreads = async () => {
    const token = localStorage.getItem("token");
    setAuthLoading(true);
    if (!token) return;
    try {
      const response = await fetch("https://nexora-c41k.onrender.com/api/history", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const res = await response.json();
      if (!Array.isArray(res)) {
      console.error("Unexpected response:", res);
      setAllThreads([]);
      return;
    }
      const filteredData = res.map((thread) => ({
        threadId: thread.threadId,
        title: thread.title,
      }));
      setAllThreads(filteredData);
    } catch (err) {
      console.log(err);
      setAllThreads([]);
    } finally {
      setAuthLoading(false);
    }
  };

    useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getAllThreads();
    }
  }, [currThreadId]);

  const createNewChat = () => {
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setCurrThreadId(uuidv4());
    setPrevChats([]);
    setSidebarOpen(false);

  };

  const changeThread = async (newThreadId) => {
    setCurrThreadId(newThreadId);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        `https://nexora-c41k.onrender.com/api/thread/${newThreadId}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      const res = await response.json();
      console.log(res);
      if (!Array.isArray(res)) {
        console.error("❌ Invalid thread messages:", res);
        setPrevChats([]);
      } else {
        setPrevChats(res);
        setNewChat(false);
        setReply(null);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const deleteThread = async(threadId) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(
        `https://nexora-c41k.onrender.com/api/thread/${threadId}`, 
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }, 
      );
      const res=await response.json();
      console.log(res);
      //updated threads re-render
      setAllThreads(prev => prev.filter(
        thread => 
          thread.threadId !== threadId
      ));
      if(threadId === currThreadId) {
        createNewChat();
      }
    } catch(err) {
      console.log(err);
    }
  }
  return (
    <section className="sidebar">
       {/* Collapse button inside sidebar */}
      <div className="collapseBtn" onClick={() => {setSidebarOpen(false)}}>
        <i className="fa-solid fa-xmark"></i>
      </div>
              {/* Logo at top */}
        <div className="sidebarLogo">
          <h3>Nexora</h3>
        </div>
      {/* new chat button */}
      <button onClick={createNewChat}>
        <i className="fa-solid fa-pen-to-square"></i>&nbsp;New chat
      </button>

      {/* history */}
      <ul className="history">
        {!user ? (
          <li className="no-history-msg"><h3><a href="/signup">signp</a> to use Nexora</h3></li>
        ) : allThreads?.length === 0 ? (
          <li className="no-history-msg"><h3>No history available.</h3></li>
        ) : (
          allThreads.map((thread, idx) => (
            <li key={idx} onClick={() => changeThread(thread.threadId)}
              className={thread.threadId == currThreadId ? "highlighted" : ""}
            >
              {thread.title}
              <i className="fa-solid fa-trash"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!window.confirm("Are you sure you want to delete this chat?")) return;
                  deleteThread(thread.threadId);
                }}
              ></i>
            </li>
          ))
        )}
      </ul>

      {/* sign */}
      <div className="sign">
        <p>by vikas joshi &hearts;</p>
      </div>
    </section>
  );
}

export default Sidebar;
