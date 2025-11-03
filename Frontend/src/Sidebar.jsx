import "./Sidebar.css";
import { MyContext } from "./MyContext";
import { useContext, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";

function Sidebar() {
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
  const [loadingThreads, setLoadingThreads] = useState(false);
  
  if (!sidebarOpen) return null; // ✅ hide sidebar when collapsed


  const getAllThreads = async () => {
    try {
      const response = await fetch("https://sigmagpt-fgqc.onrender.com/api/history", {
        credentials: "include", // include cookies for auth
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
    }
  };

  useEffect(() => {
    getAllThreads();
  }, [currThreadId]);

  useEffect(() => {
    setLoadingThreads(true);
    getAllThreads().finally(() => setLoadingThreads(false));
  }, []);

  const createNewChat = () => {
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setCurrThreadId(uuidv4());
    setPrevChats([]);
  };

  const changeThread = async (newThreadId) => {
    setCurrThreadId(newThreadId);

    try {
      const response = await fetch(
        `https://sigmagpt-fgqc.onrender.com/api/thread/${newThreadId}`,
        {credentials: "include"}
      );
      const res = await response.json();
      console.log(res);
      setPrevChats(res);
      setNewChat(false);
      setReply(null);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteThread = async(threadId) => {
    try {
      const response = await fetch(
        `https://sigmagpt-fgqc.onrender.com/api/thread/${threadId}`, 
        {method: "DELETE", credentials: "include"}, 
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
          <h3>SigmaGPT</h3>
        </div>
      {/* new chat button */}
      <button onClick={createNewChat}>
        <i className="fa-solid fa-pen-to-square"></i>&nbsp;New chat
      </button>

      {/* history */}
      <ul className="history">
        {allThreads?.length === 0 ? (
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
                  if (!window.confirm("Are you sure you want to delete this thread?")) return;
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
