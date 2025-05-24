import React from 'react'
import "./Index.css"
import ChatInterface from '../Components/ChatInterface'

const Index = () => {
    return (
        <div className="index-container">
            <div className="index-inner">
                <div className="index-header">
                    <h1 className="index-title">Simple AI Chat</h1>
                    <p className="index-subtitle">
                        A basic chat interface where you can ask questions about weather, math, or word definitions.
                    </p>
                </div>
                <ChatInterface />
            </div>
        </div>
    )
}

export default Index