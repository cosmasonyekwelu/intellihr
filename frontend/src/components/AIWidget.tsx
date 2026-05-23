import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const AIWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '<h3>Welcome to IntelliHR AI Agent</h3><p>I am your n8n & OpenAI-powered operations assistant. How can I help you automate HR workflows today?</p>',
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const response = await api.ai.ask(textToSend);
      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: response.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: `<p style="color: #ef4444;">I failed to contact the AI Controller: ${error.message || 'Server Offline'}.</p>`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: 'Why was payroll higher?', text: 'Why was payroll higher this month?' },
    { label: 'Attendance Issues', text: 'Summarize attendance issues for this month' },
    { label: 'Underperforming employees?', text: 'Which employees are underperforming?' },
    { label: 'Generate HR Report', text: 'Generate HR report for management' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        id="widget_toggle"
        className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all duration-300 relative group"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0f172a] animate-pulse" />
        )}
      </button>

      {/* Expandable Chat Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 max-h-[600px] h-[520px] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Panel Header */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/10">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                IntelliHR Copilot
                <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase block">
                OpenAI GPT-4o-mini
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                    AI
                  </div>
                )}
                
                <div
                  className={`max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'
                  }`}
                >
                  <div 
                    className="space-y-2 ai-message-body"
                    dangerouslySetInnerHTML={{ __html: msg.text }} 
                  />
                  <span className="text-[8px] opacity-40 mt-1.5 block text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold animate-pulse">
                  AI
                </div>
                <div className="max-w-[75%] rounded-2xl p-3.5 text-xs bg-slate-800 text-slate-400 rounded-tl-none border border-slate-700/50 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-1 text-[10px] italic">Copilot querying database...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts list (visible when idle) */}
          {!loading && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              {quickPrompts.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleSend(p.text)}
                  className="px-2.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-[10px] font-semibold text-indigo-400 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(query);
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              id="ai_chat_input"
              className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white flex items-center justify-center transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
