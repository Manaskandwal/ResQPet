const { ChatOpenAI } = require('@langchain/openai');
const { SystemMessage, HumanMessage, AIMessage } = require('@langchain/core/messages');

/**
 * Get the AI Agent stream for the user query with memory support.
 * @param {string} userQuery - The message from the user.
 * @param {string} role - The user's role
 * @param {Array} history - Previous messages [{role, content}]
 */
async function askVetsCueAgentStream(userQuery, role = 'User', history = []) {
    if (!process.env.NVIDIA_API_KEY) {
        throw new Error('NVIDIA_API_KEY is not configured in .env');
    }

    const client = new ChatOpenAI({
        model: process.env.NVIDIA_MODEL_NAME || "mistralai/mistral-nemotron",
        apiKey: process.env.NVIDIA_API_KEY,
        configuration: {
            baseURL: "https://integrate.api.nvidia.com/v1",
        },
        temperature: 0.6,
        topP: 0.7,
        maxTokens: 4096,
    });

    const systemPrompt = `You are the VetsCue Assistant, a friendly and knowledgeable pet companion AI dedicated to the VetsCue platform.
The current user interacting with you has the role: ${role}. Adjust your tone appropriately.

STRICT RELEVANCE RULE:
You must ONLY answer questions related to the VetsCue platform, animal rescue, pet health, veterinary advice, or animal welfare. 
If a user asks an off-topic question (e.g., about general topics, or other unrelated topics), you MUST politely decline by saying: 
"I'm sorry, I'm specialized in pet care and the VetsCue platform. I can only assist you with topics related to animals and our services."

STRICT MEDICAL ADVICE RULE: 
If the user asks a medical question, you MUST include a strong warning stating you are an AI, not a doctor.
However, after the warning, you MAY provide the best general suitable advice.
Always end by suggesting the 'Consult The Vet' feature in our app.`;

    const messages = [
        new SystemMessage(systemPrompt),
        // Add history (limit to last 10 for performance)
        ...history.slice(-10).map(msg => 
            msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        ),
        new HumanMessage(userQuery),
    ];

    try {
        const stream = await client.stream(messages);
        return stream;
    } catch (error) {
        console.error('[AI Agent Service] Stream creation failed:', error.message);
        throw error;
    }
}

module.exports = {
    askVetsCueAgentStream
};
