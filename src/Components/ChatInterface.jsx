import React, { useEffect, useRef, useState } from 'react'
import './ChatInterface.css'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import { evaluate } from 'mathjs';
import ScrollToBottom from 'react-scroll-to-bottom';

const LOCAL_STORAGE_KEY = 'chatMessages_v2';

const ChatInterface = () => {
    const [messages, setMessages] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        const loadMessages = () => {
            try {
                const stored = localStorage.getItem(LOCAL_STORAGE_KEY);

                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        if (isMounted) setMessages(parsed);
                        return;
                    }
                }

                if (isMounted) {
                    setMessages([{
                        id: Date.now().toString(),
                        sender: 'assistant',
                        text: 'Hello! I am your AI assistant...',
                        timestamp: new Date().toISOString(),
                    }]);
                }
            } catch (error) {
                console.error('Failed to load messages:', error);
                if (isMounted) {
                    setMessages([{
                        id: Date.now().toString(),
                        sender: 'assistant',
                        text: 'Welcome! There was an error loading your chat history.',
                        timestamp: new Date().toISOString(),
                    }]);
                }
            }
        };

        loadMessages();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (messages === null) return;

        const timer = setTimeout(() => {
            try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
            } catch (error) {
                console.error('Failed to save messages:', error);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [messages]);

    if (messages === null) {
        return <div className="loading-indicator">Loading chat...</div>;
    }

    const handleSendMessage = async (userInput) => {
        if (!userInput.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: userInput,
            timestamp: new Date().toISOString(),
        }

        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setIsLoading(true);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        let responseContent = '';
        const input = userInput.toLowerCase();
        if (input.startsWith('/weather')) {
            const city = input.replace('/weather', '').trim();

            if (!city) {
                responseContent = 'Please provide a city. Example: /weather London';
            } else {
                try {
                    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
                    const geoData = await geoResponse.json();

                    if (!geoData.results || geoData.results.length === 0) {
                        responseContent = `City "${city}" not found. Please check the name and try again.`;
                    } else {
                        const { latitude, longitude, name } = geoData.results[0];

                        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&timezone=auto`);
                        const weatherData = await weatherResponse.json();

                        if (!weatherData.current) {
                            responseContent = `Weather data for "${name}" is currently unavailable.`;
                        } else {
                            const temperature = weatherData.current.temperature_2m;
                            const windSpeed = weatherData.current.wind_speed_10m;
                            const time = new Date(weatherData.current.time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            responseContent = `<strong>Weather in ${name}:</strong><br />Temperature: <strong>${temperature}°C</strong><br />Wind Speed: <strong>${windSpeed} km/h</strong><br /><em>As of ${time}</em>`;
                        }
                    }
                } catch (error) {
                    console.error('Error fetching weather:', error);
                    responseContent = 'An error occurred while fetching the weather. Please try again later.';
                }
            }
        }
        else if (input.startsWith('/calc')) {
            const expression = input.replace('/calc', '').trim();

            if (!expression) {
                responseContent = 'Please provide a math expression. Example: /calc 5 * (2 + 3)';
            } else {
                try {
                    if (/^[\d+\-*/().\s]+$/.test(expression)) {
                        const result = evaluate(expression);
                        if (result === undefined || isNaN(result)) {
                            responseContent = 'Could not evaluate the expression. Please check your syntax.';
                        } else {
                            responseContent = `<strong>Expression:</strong> ${expression}<br /><strong>Result:</strong> ${result}`;
                        }
                    } else {
                        responseContent = 'Invalid expression. Use only numbers and basic operators. Example: /calc 12 / (3 + 1)';
                    }
                } catch (error) {
                    console.error('Error evaluating expression:', error);
                    responseContent = 'There was an error evaluating your expression. Please try again.';
                }
            }
        }
        else if (input.startsWith('/define')) {
            const word = input.replace('/define', '').trim();

            if (!word) {
                responseContent = 'Please provide a word. Example: /define empathy';
            } else {
                try {
                    const dicResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
                    const dicData = await dicResponse.json();

                    if (dicData.title === 'No Definitions Found') {
                        responseContent = `Definition for "<strong>${word}</strong>" not found.`;
                    } else {
                        const definitions = dicData[0].meanings.map(meaning => {
                            const defList = meaning.definitions
                                .slice(0, 2)
                                .map((def, idx) => `${idx + 1}. ${def.definition}`)
                                .join('<br />');

                            return `<strong>${meaning.partOfSpeech}:</strong><br />${defList}`;
                        }).join('<br />');

                        responseContent = `<strong>Definitions for "${dicData[0].word}":</strong><br />${definitions}`;
                    }
                } catch (error) {
                    console.error('Error fetching definition:', error);
                    responseContent = 'An error occurred while fetching the definition. Please try again later.';
                }
            }
        }
        else {
            responseContent = 'Please use a valid command:\n- /weather [city]\n- /calc [expression]\n- /define [word]';
        }

        const aiMessage = {
            id: Date.now().toString(),
            sender: 'assistant',
            text: responseContent,
            timestamp: new Date().toISOString(),
        }

        setMessages((prevMessages) => [...prevMessages, aiMessage]);
        setIsLoading(false);
    }

    const clearHistory = () => {
        setMessages([]);
        localStorage.removeItem(LOCAL_STORAGE_KEY)
    }

    return (
        <div className="chat-container">
            
            <div className="chat-header">
                <div>
                    <h2>AI Chat Assistant</h2>
                    <p>Ask me anything!</p>
                </div>
                <button onClick={clearHistory} className="clear-button">
                    Clear Chat
                </button>
            </div>

            <ScrollToBottom className="chat-messages">
                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {isLoading && (
                    <div className="typing-indicator">
                        <div className="typing-bubble">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </ScrollToBottom >

            <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
    )
}

export default ChatInterface