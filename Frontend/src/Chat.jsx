import "./Chat.css";
import { useContext, useEffect, useState, useRef} from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
    const {newChat, prevChats, reply}=useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);
    const chatsEndRef = useRef(null);
    const chatsContainerRef = useRef(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const userScrolledRef = useRef(false);
    const user = JSON.parse(localStorage.getItem("user"));

     const scrollToBottom = () => {
        chatsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

     useEffect(() => {
        scrollToBottom();
    }, [prevChats, latestReply, setShouldAutoScroll]);

    useEffect(() => {
        if(reply === null) {
            setLatestReply(null);
            return;
        }
        // Reset auto-scroll when new response starts
        setShouldAutoScroll(true);
        userScrolledRef.current = false;

        if(!prevChats?.length) return;

        const content=reply.split(" ");

        let idx=0;
        const interval=setInterval(() => {
            setLatestReply(content.slice(0, idx+1).join(" "));
            idx++;
            if(idx >= content.length) clearInterval(interval);
        }, 40);

        return () => clearInterval(interval);

    }, [prevChats, reply]);

    return ( 
        <>
            {newChat && <h1 className="multiColorName">Hi <b> {user?.name}</b>, How can i help you</h1>}
            <div className="chats" ref={chatsContainerRef}>
                {
                    prevChats?.slice(0, -1).map((chat, idx) => 
                        <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={idx}>
                            {
                                chat.role === "user" ? 
                                <p className="userMessage">{chat.content}</p> : 
                                <ReactMarkdown rehypePlugins={rehypeHighlight}>{chat.content}</ReactMarkdown>
                            }
                        </div>
                    )
                }

                {
                    prevChats.length > 0 && (
                        <>
                            {
                                latestReply === null ? (
                                    <div className="gptDiv" key={"non-typing"}>
                                        <ReactMarkdown rehypePlugins={rehypeHighlight}>{prevChats[prevChats.length-1].content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="gptDiv" key={"typing"}>
                                        <ReactMarkdown rehypePlugins={rehypeHighlight}>{latestReply}</ReactMarkdown>
                                    </div>
                                )
                            }   
                        </>
                    )
                }
                <div ref={chatsEndRef} />
            </div>
        </>
     );
}

export default Chat;