// import "./App.css";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Signup from "./Signup.jsx";
// import Login from "./Login.jsx";
// import Sidebar from "./Sidebar.jsx";
// import ChatWindow from "./ChatWindow.jsx";
// import { MyContext } from "./MyContext.jsx";
// import { useState } from "react";
// import {v4 as uuidv4} from "uuid";

// function App() {
//   const [prompt, setPrompt]=useState("");
//   const [reply, setReply]=useState(null);
//   const [currThreadId, setCurrThreadId]=useState(uuidv4());
//   const [prevChats, setPrevChats]=useState([]);
//   const [newChat, setNewChat]=useState(true);
//   const [allThreads, setAllThreads]=useState([]);
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   const providerValues={
//     prompt, setPrompt,
//     reply, setReply,
//     currThreadId, setCurrThreadId,
//     newChat, setNewChat,
//     prevChats, setPrevChats,
//     allThreads, setAllThreads,
//     sidebarOpen, setSidebarOpen
//   };

//   return (
//     <div className="app">
//       <MyContext.Provider value={providerValues}>
//         <Sidebar />
//         <ChatWindow />
//       </MyContext.Provider>
//     </div>
//   )
// }

// export default App;




import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./Signup.jsx";
import Login from "./Login.jsx";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { MyContext } from "./MyContext.jsx";
import { useState } from "react";
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

  const user = localStorage.getItem("user");

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
