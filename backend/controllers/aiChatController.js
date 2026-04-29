const { askVetsCueAgentStream } = require('../services/aiAgentService');
const AIChatSession = require('../models/AIChatSession');

/**
 * Handle streaming AI chat responses with persistent memory.
 * @route POST /api/chat
 * @access Private
 */
const handleChat = async (req, res) => {
    const { message } = req.body;
    const { _id: userId, role } = req.user;

    if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        // 1. Fetch or Create Chat Session for the user
        let session = await AIChatSession.findOne({ userId });
        if (!session) {
            session = await AIChatSession.create({ userId, messages: [] });
        }

        // 2. Prepare history for the AI Agent
        const history = session.messages.map(m => ({ role: m.role, content: m.content }));

        // 3. Get the stream from AI Agent
        const stream = await askVetsCueAgentStream(message, role, history);

        let aiResponseText = '';

        // 4. Iterate over the stream and send to client
        for await (const chunk of stream) {
            if (chunk.content) {
                const text = chunk.content;
                aiResponseText += text;
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
        }

        // 5. Update session memory in database
        session.messages.push({ role: 'user', content: message });
        session.messages.push({ role: 'ai', content: aiResponseText });
        await session.save();

        // End the stream
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('[AI Chat] Error during chat completion:', error);
        
        if (!res.headersSent) {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to process AI chat request', 
                error: error.message 
            });
        }
        
        res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to complete the response' })}\n\n`);
        res.end();
    }
};

/**
 * Fetch chat history for the authenticated user.
 * @route GET /api/chat/history
 * @access Private
 */
const getChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const session = await AIChatSession.findOne({ userId });
        
        if (!session) {
            return res.status(200).json({ success: true, messages: [] });
        }

        res.status(200).json({ success: true, messages: session.messages });
    } catch (error) {
        console.error('[AI Chat History] Error fetching history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
    }
};

/**
 * Clear chat history for the authenticated user.
 * @route DELETE /api/chat/history
 * @access Private
 */
const clearChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        await AIChatSession.deleteOne({ userId });
        res.status(200).json({ success: true, message: 'Chat history cleared' });
    } catch (error) {
        console.error('[AI Chat Clear] Error clearing history:', error);
        res.status(500).json({ success: false, message: 'Failed to clear chat history' });
    }
};

module.exports = {
    handleChat,
    getChatHistory,
    clearChatHistory
};
