import { X, Clock, Code, Palette, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ChatSession {
  id: string;
  chat_type: 'coder' | 'artist' | 'tutor';
  title: string;
  created_at: string;
  updated_at: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession: (sessionId: string, chatType: 'coder' | 'artist' | 'tutor') => void;
}

export default function Sidebar({ isOpen, onClose, onLoadSession }: SidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      loadSessions();
    }
  }, [isOpen, user]);

  const loadSessions = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setSessions(data);
    }
    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'coder':
        return <Code className="w-4 h-4" />;
      case 'artist':
        return <Palette className="w-4 h-4" />;
      case 'tutor':
        return <GraduationCap className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 left-0 h-full w-80 bg-slate-800 border-r border-slate-700 z-50 transform transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Chat History</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-73px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-slate-400">
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-400">
              <div className="text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No chat history yet</p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    onLoadSession(session.id, session.chat_type);
                    onClose();
                  }}
                  className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-cyan-400">{getIcon(session.chat_type)}</span>
                    <span className="text-sm font-medium text-white capitalize">
                      {session.chat_type}
                    </span>
                    <span className="text-xs text-slate-500 ml-auto">
                      {formatDate(session.updated_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 truncate">{session.title}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
