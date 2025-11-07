import { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatPanelProps {
  type: 'coder' | 'artist' | 'tutor';
  title: string;
  color: string;
  icon: React.ReactNode;
  messages: Message[];
  onSendMessage: (content: string) => void;
}

export default function ChatPanel({ type, title, color, icon, messages, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className={`p-4 ${color} border-b border-slate-700 flex items-center`}>
        {icon}
        <h2 className="text-lg font-semibold text-white ml-2">{title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Start a conversation with {title}</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 text-slate-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${title}...`}
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
