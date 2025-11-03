import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./Signup.jsx";
import Login from "./Login.jsx";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { MyContext } from "./MyContext.jsx";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv4());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    sidebarOpen, setSidebarOpen
  };

  useEffect(() => {
    fetch("https://sigmagpt-fgqc.onrender.com/api/test-session", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          localStorage.removeItem("user");
        }
      });
  }, []);
  const user = JSON.parse(localStorage.getItem("user") || "null");


  return (
    <div className="app">
      <MyContext.Provider value={providerValues}>
        <Router>
          <Routes>
            <Route path="/" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/chat" element={
              user ? (
                <>
                  <Sidebar />
                  <ChatWindow />
                </>
              ) : (
                <Navigate to="/login" />
              )
            } />
          </Routes>
        </Router>
      </MyContext.Provider>
    </div>
  );
}

export default App;
