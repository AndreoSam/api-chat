import React, { createContext, useContext, useEffect, useState } from 'react';
import { evaluate } from 'mathjs';

const ChatContext = createContext();

const LOCAL_STORAGE_KEY = 'chatMessages_v2';

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadMessages = () => {
            try {
                const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        setMessages(parsed);
                        return;
                    }
                }
                setMessages([{
                    id: crypto.randomUUID(),
                    sender: 'assistant',
                    content: 'Hello! I am your AI assistant...',
                    type: 'text',
                    timestamp: new Date().toISOString(),
                }]);
            } catch (error) {
                console.error('Failed to load messages:', error);
                setMessages([{
                    id: crypto.randomUUID(),
                    sender: 'assistant',
                    content: 'Welcome! There was an error loading your chat history.',
                    type: 'text',
                    timestamp: new Date().toISOString(),
                }]);
            }
        };

        loadMessages();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
            } catch (error) {
                console.error('Failed to save messages:', error);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [messages]);

    const sendMessage = async (userInput) => {
        if (!userInput.trim()) return;

        const userMessage = {
            id: crypto.randomUUID(),
            sender: 'user',
            content: userInput,
            type: 'text',
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        await new Promise((res) => setTimeout(res, 1000));

        const input = userInput.toLowerCase();
        let content = '';
        let pluginName = null;
        let pluginData = null;

        if (input.startsWith('/weather')) {
            const city = input.replace('/weather', '').trim();
            if (!city) {
                content = 'Please provide a city. Example: /weather London';
            } else {
                try {
                    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
                    const geoData = await geoRes.json();
                    if (!geoData.results?.length) {
                        content = `City "${city}" not found.`;
                    } else {
                        const { latitude, longitude, name } = geoData.results[0];
                        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&timezone=auto`);
                        const weatherData = await weatherRes.json();
                        if (!weatherData.current) {
                            content = `Weather data for "${name}" is currently unavailable.`;
                        } else {
                            const { temperature_2m, wind_speed_10m, time } = weatherData.current;
                            const timeStr = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            content = `**Weather in ${name}:**\nTemperature: **${temperature_2m}°C**\nWind Speed: **${wind_speed_10m} km/h**\n_As of ${timeStr}_`;
                            pluginName = 'weather';
                            pluginData = { name, temperature: temperature_2m, windSpeed: wind_speed_10m, time: timeStr };
                        }
                    }
                } catch (err) {
                    console.error(err);
                    content = 'Error fetching weather data.';
                }
            }
        } else if (input.startsWith('/calc')) {
            const expression = input.replace('/calc', '').trim();
            if (!expression) {
                content = 'Please provide an expression. Example: /calc 5 * (2 + 3)';
            } else {
                try {
                    if (/^[\d+\-*/().\s]+$/.test(expression)) {
                        const result = evaluate(expression);
                        content = `**Expression:** ${expression}\n**Result:** ${result}`;
                        pluginName = 'calc';
                        pluginData = { expression, result };
                    } else {
                        content = 'Invalid expression. Use only numbers and operators.';
                    }
                } catch (e) {
                    console.error(e);
                    content = 'Error evaluating expression.';
                }
            }
        } else if (input.startsWith('/define')) {
            const word = input.replace('/define', '').trim();
            if (!word) {
                content = 'Please provide a word. Example: /define empathy';
            } else {
                try {
                    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
                    const data = await res.json();
                    if (data.title === 'No Definitions Found') {
                        content = `Definition for "${word}" not found.`;
                    } else {
                        content = `**Definitions for "${data[0].word}":**\n` + data[0].meanings.map(meaning =>
                            `**${meaning.partOfSpeech}**:\n` +
                            meaning.definitions.slice(0, 2).map((def, i) => `${i + 1}. ${def.definition}`).join('\n')
                        ).join('\n\n');
                        pluginName = 'define';
                        pluginData = data;
                    }
                } catch (e) {
                    console.error(e);
                    content = 'Error fetching definition.';
                }
            }
        } else {
            content = 'Please use a valid command:\n- /weather [city]\n- /calc [expression]\n- /define [word]';
        }

        const assistantMessage = {
            id: crypto.randomUUID(),
            sender: 'assistant',
            content,
            type: pluginName ? 'plugin' : 'text',
            pluginName: pluginName || undefined,
            pluginData: pluginData || undefined,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
    };

    const clearMessages = () => {
        setMessages([]);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    };

    return (
        <ChatContext.Provider value={{ messages, isLoading, sendMessage, clearMessages }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
