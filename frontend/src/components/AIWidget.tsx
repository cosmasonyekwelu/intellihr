import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { Button } from './ui/Button';
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
      text: 'Welcome to IntelliHR Copilot. Ask me about attendance, payroll, leave, or employee operations.',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((current) => [...current, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const response = await api.ai.ask(textToSend);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: response.answer,
        timestamp: new Date()
      }]);
    } catch (error: any) {
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: `I could not reach the AI service: ${error.message || 'Server offline'}.`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: 'Payroll trend', text: 'Why was payroll higher this month?' },
    { label: 'Attendance', text: 'Summarize attendance issues for this month' },
    { label: 'Leave queue', text: 'Which leave requests need attention?' }
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Button
        type="button"
        size="icon"
        onClick={() => setIsOpen((current) => !current)}
        id="widget_toggle"
        className="h-14 w-14 rounded-full shadow-lg shadow-indigo-600/25"
        aria-label="Toggle IntelliHR Copilot"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 flex h-[520px] w-[calc(100vw-2.5rem)] max-w-[400px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-950 p-4 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="flex items-center gap-1.5 text-sm font-bold">
                IntelliHR Copilot
                <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
              </h3>
              <p className="text-xs text-slate-300">Workflow-aware assistant</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-lg px-3 py-2 text-sm leading-6 ${
                  message.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 shadow-sm'
                }`}>
                  <div dangerouslySetInnerHTML={{ __html: message.text }} />
                  <span className="mt-1 block text-right text-[10px] opacity-60">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {loading && <div className="text-sm font-medium text-slate-500">Copilot is thinking...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => handleSend(prompt.text)}
                  className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSend(query);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ask a question..."
                id="ai_chat_input"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
              <Button type="submit" size="icon" disabled={!query.trim() || loading} aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
