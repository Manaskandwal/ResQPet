const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage } = require('@langchain/core/messages');
require('dotenv').config();

async function testAI() {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
        console.error('Error: NVIDIA_API_KEY is not set in .env');
        process.exit(1);
    }

    console.log('Testing NVIDIA AI with model: mistralai/mistral-nemotron');
    
    try {
        const client = new ChatOpenAI({
            model: "mistralai/mistral-nemotron",
            apiKey: apiKey,
            configuration: {
                baseURL: "https://integrate.api.nvidia.com/v1",
            },
        });

        const response = await client.invoke([
            new HumanMessage("Hello, tell me a short joke about a cat.")
        ]);

        console.log('\nAI Response:');
        console.log(response.content);
        console.log('\nSuccess!');
    } catch (error) {
        console.error('\nError Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testAI();
