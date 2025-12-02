import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Streaming chat function using fetch for Server-Sent Events
export const streamChat = async (
    prompt: string,
    sessionId: string | null,
    persona: string,
    onChunk: (chunk: string) => void,
    onSessionId?: (sessionId: string) => void,
    onComplete?: (messageId: string) => void,
    onError?: (error: string) => void
) => {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:3001/api/chat/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ prompt, sessionId, persona }),
        });

        if (!response.ok) {
            throw new Error('Stream request failed');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('No response body');
        }

        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const decoded = decoder.decode(value, { stream: true });
            console.log('Received chunk raw:', decoded); // Debug log
            buffer += decoded;
            const lines = buffer.split('\n');

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;
                console.log('Processing line:', line); // Debug log
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.substring(6));
                        console.log('Parsed data:', data); // Debug log

                        if (data.chunk) {
                            onChunk(data.chunk);
                        } else if (data.sessionId && onSessionId) {
                            onSessionId(data.sessionId);
                        } else if (data.done && onComplete && data.messageId) {
                            onComplete(data.messageId);
                        } else if (data.error && onError) {
                            onError(data.error);
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Streaming error:', error);
        if (onError) {
            onError('Failed to stream response');
        }
    }
};

export default api;
