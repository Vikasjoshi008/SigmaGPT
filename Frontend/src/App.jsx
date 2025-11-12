import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./Signup.jsx";
import Login from "./Login.jsx";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { MyContext } from "./MyContext.jsx";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import AuthLoader from "./AuthLoader.jsx";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv4());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    sidebarOpen, setSidebarOpen,
    authLoading, setAuthLoading
  };
  const [user, setUser]=useState(null)

 useEffect(() => {
  const storedUser = localStorage.getItem("user");
  setUser(storedUser ? JSON.parse(storedUser) : null);

  const handleStorageChange = () => {
    const updatedUser = localStorage.getItem("user");
    setUser(updatedUser ? JSON.parse(updatedUser) : null);
  };

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, []);


  return (
    <div className="app">
      <MyContext.Provider value={providerValues}>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/chat" element={
              <>
                {user ? <Sidebar user={user} /> : <Sidebar user={null} />}
                <ChatWindow user={user} />
              </>
            } />
          </Routes>
        </Router>
        <AuthLoader visible={authLoading} label="Processing…" />
      </MyContext.Provider>
    </div>
  );
}

export default App;
