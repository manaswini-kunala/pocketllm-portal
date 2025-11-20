require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.HF_API_KEY;
const MODEL = 'HuggingFaceH4/zephyr-7b-beta';

console.log(`Testing HF API with model: ${MODEL}`);
console.log(`API Key present: ${!!API_KEY}`);

async function testConnection() {
    try {
        const response = await axios.post(
            `https://router.huggingface.co/hf-inference/models/${MODEL}`,
            {
                inputs: "<|system|>\nYou are a helpful assistant.</s>\n<|user|>\nHello!</s>\n<|assistant|>\n",
                parameters: {
                    max_new_tokens: 50,
                    return_full_text: false
                }
            },
            {
                headers: {
                    Authorization: API_KEY ? `Bearer ${API_KEY}` : undefined,
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log('Success! Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testConnection();
