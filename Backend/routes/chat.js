import express from 'express';
import Thread from '../models/Thread.js'
import  getGeminiAIAPIResponse from "../utils/geminiai.js"

const router=express.Router();

function requireLogin(req, res, next) {
    if (!req.user) {
        console.log("❌ No user in session");
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

router.get("/user", requireLogin, async (req, res) => {
    try {
        const threads = await Thread.find({ user: req.user._id });
        res.json(threads);
    } catch (err) {
        console.error("❌ Failed to fetch user threads:", err);
        res.status(500).json({ error: "Failed to fetch threads" });
    }
});


//test
router.post("/test", async(req, res) => {
    try {
        const thread=new Thread({
            threadId: "xyz",
            title: "testing new thread",
        });
        const response=await thread.save();
        res.send(response);
    } catch (err) {
        console.log("Failed to post", err);
        res.status(500).json({error: "Failed to save in database"});
    }
});

//get all threads
router.get("/thread", requireLogin, async(req, res) => {
    try {
        const threads=await Thread.find({}).sort({updatedAt: -1});
        res.json(threads);
    } catch (err) {
        console.log("Failed to post", err);
        res.status(500).json({error: "Failed to fetch"});
    }
});

// get all threads for the logged-in user
router.get("/history", requireLogin, async(req, res) => {
    try {
        const threads = await Thread.find({ user: req.user._id }).sort({updatedAt: -1});
        res.json(threads);
    } catch (err) {
        res.status(500).json({error: "Failed to fetch"});
    }
});

// update get thread by id for user
router.get("/thread/:threadId", requireLogin, async(req, res) => {
    const {threadId} = req.params;
    try {
        const thread=await Thread.findOne({threadId, user: req.user._id});
        if(!thread){
            return res.status(404).json({error: "thread not found"})
        }
        res.json(thread.messages);
    } catch (err) {
        res.status(500).json({error: "Failed to fetch"});
    }
});

// update delete thread for user
router.delete("/thread/:threadId", requireLogin, async(req, res) => {
  try {
    const threadId = req.params.threadId?.trim();
    const deletedThread = await Thread.findOneAndDelete({ threadId, user: req.user._id });
    if (!deletedThread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    return res.status(200).json({ success: "Thread deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete thread" });
  }
});
////////chat user history

// updated chat route to associate threads with users
router.post("/chat", requireLogin, async(req, res) => {
    console.log("🔍 req.user:", req.user); // <--- Add this
    const {threadId, message} = req.body;

    if(!threadId || !message) {
        return res.status(400).json({error: "missing required fields"});
    }
    try {
        let thread = await Thread.findOne({ threadId, user: req.user._id });
        if (!thread) {
            thread = new Thread({
                threadId,
                user: req.user._id,
                title: message,
                messages: [{ role: "user", content: message }],
            });
        } else {
            thread.messages.push({role: "user", content: message});
        }
        const assistantReply= await getGeminiAIAPIResponse(message);
        const replyText=assistantReply.response || "Sorry, I couldn't generate a reply.";
        thread.messages.push({ role: "assistant", content: replyText });
        thread.updatedAt=new Date();
        await thread.save();
        res.json({reply: replyText});
    } catch (err) {
        console.log("Failed to post", err);
        return res.status(500).json({error: "something went wrong"});
    }
});


export default router;