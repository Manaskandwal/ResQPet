const { askVetsCueAgentStream } = require('../services/aiAgentService');

/**
 * @desc    Chat with the VetsCue Assistant (Streams response via Server-Sent Events)
 * @route   POST /api/chat
 * @access  Private
 */
const handleChat = async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    try {
        const role = req.user ? req.user.role : 'User';

        // Set headers for Server-Sent Events (SSE)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // Flush headers immediately if possible
        res.flushHeaders();

        // Get the response stream from our service
        const stream = await askVetsCueAgentStream(message, role);

        for await (const chunk of stream) {
            if (chunk.content) {
                // Send standard SSE format
                res.write(`data: ${JSON.stringify({ text: chunk.content })}\n\n`);
            }
        }

        // Send a final message to tell the client the stream is done
        res.write(`data: [DONE]\n\n`);
        res.end();

    } catch (error) {
        console.error('[AI Chat] Error during chat completion:', error);
        
        // If headers are not sent, we can still send a JSON error.
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Failed to process AI chat request', error: error.message });
        }
        
        // If already streaming, close the stream with an error indicator
        res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to complete the response' })}\n\n`);
        res.end();
    }
};

module.exports = {
    handleChat
};
