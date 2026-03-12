import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface AiDirectorChatProps {
  onApplyPrompt?: (prompt: string) => void;
}

interface ApiMessage {
  role: 'user' | 'model';
  text: string;
}

const AiDirectorChat: React.FC<AiDirectorChatProps> = ({ onApplyPrompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'model',
      text: "Action! I'm your AI Director. Tell me a bit about the scene you want to create, and let's make it cinematic. What's our subject?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Conversation history sent to the API (excludes the hardcoded greeting)
  const apiHistoryRef = useRef<ApiMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMessage = inputText.trim();
    setInputText('');

    // Add user message to display and API history
    const userId = Date.now().toString();
    setMessages(prev => [...prev, { id: userId, role: 'user', text: userMessage }]);
    apiHistoryRef.current.push({ role: 'user', text: userMessage });

    // Add placeholder for bot response
    const botId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: botId, role: 'model', text: '', isStreaming: true }]);
    setIsTyping(true);

    let fullText = '';

    try {
      const response = await fetch('/api/director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiHistoryRef.current })
      });

      if (!response.ok || !response.body) throw new Error('Stream request failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages(prev =>
                prev.map(msg => msg.id === botId ? { ...msg, text: fullText } : msg)
              );
            }
          } catch (parseErr) {
            // Ignore incomplete SSE chunks
          }
        }
      }

      // Save completed response to API history
      if (fullText) {
        apiHistoryRef.current.push({ role: 'model', text: fullText });
      }

      setMessages(prev =>
        prev.map(msg => msg.id === botId ? { ...msg, isStreaming: false } : msg)
      );
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === botId
            ? { ...msg, text: "Cut! Something went wrong on set. Let's take it from the top.", isStreaming: false }
            : msg
        )
      );
      // Remove failed user message from API history
      apiHistoryRef.current.pop();
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center justify-center gap-2
          ${isOpen ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-brand-600 hover:bg-brand-500 text-white animate-bounce-slight'}
        `}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
            <span className="font-bold hidden md:block pr-1">AI Director</span>
          </>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 w-[90vw] md:w-[400px] h-[600px] max-h-[75vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-40 transition-all duration-300 transform origin-bottom-right
          ${isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/80 backdrop-blur rounded-t-2xl">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <h3 className="text-white font-bold leading-tight">AI Director</h3>
            <p className="text-xs text-brand-400">Cinematography Assistant</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-3 ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="text-sm">
                    {msg.text ? (
                      <>
                        <MarkdownRenderer content={msg.text} />
                        {onApplyPrompt && !msg.isStreaming && (
                          <button
                            onClick={() => onApplyPrompt(msg.text)}
                            className="mt-2 text-xs flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors bg-slate-900/50 px-2 py-1 rounded border border-slate-700 hover:border-brand-500"
                            title="Send to Playground"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            Use in Playground
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex gap-1 items-center h-5">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 rounded-b-2xl">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="E.g., I want a moody shot of a detective..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-slight {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-slight {
          animation: bounce-slight 2s ease-in-out infinite;
        }
      `}} />
    </>
  );
};

export default AiDirectorChat;
