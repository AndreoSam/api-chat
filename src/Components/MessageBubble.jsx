import './MessageBubble.css';

const MessageBubble = ({ message }) => {
    const isUser = message.sender === 'user';
    // console.log(message);
    return (
        <div className={`message-container ${isUser ? 'user' : 'ai'}`}>
            <div className="message-bubble">
                <div
                    className={`bubble-content ${isUser ? 'bubble-user' : 'bubble-ai'}`}
                >
                    <div className="bubble-text" dangerouslySetInnerHTML={{ __html: message.text }} />
                </div>
                <div className={`bubble-time ${isUser ? 'user' : 'ai'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
