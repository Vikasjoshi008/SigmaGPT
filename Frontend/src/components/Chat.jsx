import "../styles/Chat.css";
import { useContext, useEffect, useState, useRef } from "react";
import { MyContext } from "../MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";


function Chat() {
  const { newChat, prevChats, reply } = useContext(MyContext);
  const [latestReply, setLatestReply] = useState(null);
  const chatsEndRef = useRef(null);
  const chatsContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const userScrolledRef = useRef(false);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    console.error("❌ Failed to parse user:", err);
  }

  const scrollToBottom = () => {
    chatsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (shouldAutoScroll) scrollToBottom();
  }, [prevChats, latestReply, shouldAutoScroll]);

  useEffect(() => {
    if (reply === null) {
      setLatestReply(null);
      return;
    }
    // Reset auto-scroll when new response starts
    setShouldAutoScroll(true);
    userScrolledRef.current = false;

    const isEmpty = !prevChats || prevChats.length === 0;

    if (isEmpty) {
      setLatestReply("");
      return;
    }

    const content = reply.split(" ");

    let idx = 0;
    const interval = setInterval(() => {
      setLatestReply(content.slice(0, idx + 1).join(" "));
      idx++;
      if (idx >= content.length) clearInterval(interval);
    }, 28);

    return () => clearInterval(interval);
  }, [prevChats, reply]);

  useEffect(() => {
    const el = chatsContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const bottom = el.scrollHeight - el.scrollTop === el.clientHeight;
      setShouldAutoScroll(bottom);
      userScrolledRef.current = !bottom;
    };
    el?.addEventListener("scroll", handleScroll);
    return () => el?.removeEventListener("scroll", handleScroll);
  }, []);

  // helper: isShort message (used to center small user messages)
  const isShortMessage = (text) => {
    if (!text) return false;
    // fewer than 40 characters and not multiline — treat as "short"
    return text.trim().length <= 40 && !text.includes("\n");
  };

  return (
    <>
      {newChat && 
        <h1 className={`multiColorName`}>
          {user ? (
            <>
              <span>Hi <b className="hero-gradient-word">{user.name},</b> <br />How can I help you?</span>
            </>
          ) : (
            <>
              <a href="/signup" style={{ textDecoration: "none" }}>
                Signup
              </a>
            </>
          )}
        </h1>
      }

      <div className="chats" ref={chatsContainerRef}>
        {prevChats?.slice(0, -1).map((chat, idx) => {
  if (chat.role === "user") {
    return (
      <div className="userMsgRow" key={idx}>
        <p className="userMessage">{chat.content}</p>
      </div>
    );
  } else {
    return (
      <div className="gptMsgRow" key={idx}>
        <div className="assistantMessage">
          <ReactMarkdown rehypePlugins={rehypeHighlight}>
            {chat.content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }
})}


        {prevChats?.length > 0 && (
          <>
            {latestReply === null ? (
              <div className="gptDiv gptMsgRow" key={"non-typing"}>
                <div className="assistantMessage">
                  <ReactMarkdown rehypePlugins={rehypeHighlight}>
                    {prevChats[prevChats.length - 1].content}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="gptDiv gptMsgRow" key={"typing"}>
                <div className="assistantMessage">
                  <ReactMarkdown rehypePlugins={rehypeHighlight}>
                    {latestReply}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatsEndRef} />
      </div>
    </>
  );
}

export default Chat;
