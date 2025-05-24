import { useState } from 'react';
import './MessageInput.css';

const MessageInput = ({ onSendMessage, disabled }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
            onSendMessage(input);
            setInput('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="message-input-container">
            <form onSubmit={handleSubmit} className="message-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    disabled={disabled}
                    className="message-input-field"
                />
                <button
                    type="submit"
                    disabled={disabled || !input.trim()}
                    className="message-send-button"
                >
                    Send
                </button>
            </form>
            <div className="input-hint">
                Try: "/weather Tokyo", "/calc 15 + 25", or "/define happiness"
            </div>
        </div>
    );
};

export default MessageInput;
