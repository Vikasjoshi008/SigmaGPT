import express from 'express';
import Thread from '../models/Thread.js'
import  getGeminiAIAPIResponse from "../utils/geminiai.js"

const router=express.Router();

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
router.get("/thread", async(req, res) => {
    try {
        const threads=await Thread.find({}).sort({updatedAt: -1});
        res.json(threads);
    } catch (err) {
        console.log("Failed to post", err);
        res.status(500).json({error: "Failed to fetch"});
    }
});

router.get("/thread/:threadId", async(req, res) => {
    const {threadId} = req.params.threadId;
    try {
        const thread=await Thread.findOne({threadId});
        if(!thread){
            res.status(404).json({error: "thread not found"})
        }
        res.json(thread.messages);
    } catch (err) {
        console.log("Failed to post", err);
        res.status(500).json({error: "Failed to fetch"});
    }
});

router.delete("/thread/:threadId", async (req, res) => {
  try {
    const threadId = req.params.threadId?.trim();
    console.log("🧪 Attempting to delete threadId:", threadId);
    console.log("🧪 All threadIds in DB:", await Thread.find().select("threadId"));

    const deletedThread = await Thread.findOneAndDelete({ threadId });

    if (!deletedThread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    return res.status(200).json({ success: "Thread deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete thread:", err);
    return res.status(500).json({ error: "Failed to delete thread" });
  }
});


router.post("/chat", async(req, res) => {
    const {threadId, message} = req.body;

    if(!threadId || !message) {
        res.status(400).json({error: "missing required fields"});
    }
    try {
        let thread=await Thread.findOne({threadId});
        if(!thread) {
            thread = new Thread ({
                threadId,
                title: message,
                messages: [{ role: "user", content: message }],
            });
        } else {
            thread.messages.push({role: "user", content: message})
        }
        const assistantReply= await getGeminiAIAPIResponse(message);
        const replyText=assistantReply.response;
        thread.messages.push({ role: "assistant", content: replyText });
        thread.updatedAt=new Date();
        res.json({reply: replyText});
        await thread.save();
    } catch (err) {
        console.log("Failed to post", err);
        return res.status(500).json({error: "something went wrong"});
    }
});

export default router;