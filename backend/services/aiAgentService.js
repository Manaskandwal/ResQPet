const { ChatOpenAI } = require('@langchain/openai');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');

/**
 * Get the AI Agent stream for the user query.
 * @param {string} userQuery - The message from the user.
 * @param {string} role - The user's role (User, Admin, NGO, Hospital, Ambulance)
 */
async function askVetsCueAgentStream(userQuery, role = 'User') {
    if (!process.env.NVIDIA_API_KEY) {
        throw new Error('NVIDIA_API_KEY is not configured in .env');
    }

    // Initialize ChatNVIDIA using Langchain OpenAI client pointing to NVIDIA endpoints
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

    const systemPrompt = `You are the VetsCue Assistant. Help users navigate the app and give general animal care advice. 
The current user interacting with you has the role: ${role}. Adjust your tone appropriately.

STRICT MEDICAL ADVICE RULE: 
If the user asks a medical question (e.g., about health, symptoms, or medicine), you MUST include a strong, unambiguous warning stating that you are an AI, not a doctor, and this is NOT medical advice. 
However, after the warning, you MAY provide the best general suitable advice or first-aid steps based on standard veterinary knowledge.
Always end your response to a medical question by explicitly suggesting that the user use the 'Consult The Vet' feature in our app and consult a professional veterinarian immediately to avoid any health complications.`;

    const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userQuery),
    ];

    // Create and return the stream
    try {
        const stream = await client.stream(messages);
        return stream;
    } catch (error) {
        console.error('[AI Agent Service] Stream creation failed:', error.message);
        if (error.response) {
            console.error('[AI Agent Service] Response data:', error.response.data);
        }
        throw error;
    }
}

module.exports = {
    askVetsCueAgentStream
};
