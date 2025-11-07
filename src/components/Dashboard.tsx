import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ChatPanel from './ChatPanel';
import Sidebar from './Sidebar';
import { Menu, LogOut, Code, Palette, GraduationCap, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatState {
  coder: { sessionId: string | null; messages: Message[] };
  artist: { sessionId: string | null; messages: Message[] };
  tutor: { sessionId: string | null; messages: Message[] };
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatState, setChatState] = useState<ChatState>({
    coder: { sessionId: null, messages: [] },
    artist: { sessionId: null, messages: [] },
    tutor: { sessionId: null, messages: [] },
  });

  useEffect(() => {
    initializeSessions();
  }, [user]);

  const initializeSessions = async () => {
    if (!user) return;

    const types: Array<'coder' | 'artist' | 'tutor'> = ['coder', 'artist', 'tutor'];

    for (const type of types) {
      await createNewSession(type);
    }
  };

  const createNewSession = async (type: 'coder' | 'artist' | 'tutor') => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        chat_type: type,
        title: 'New Chat',
      })
      .select()
      .single();

    if (!error && data) {
      setChatState((prev) => ({
        ...prev,
        [type]: { sessionId: data.id, messages: [] },
      }));
    }
  };

  const loadSession = async (sessionId: string, chatType: 'coder' | 'artist' | 'tutor') => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setChatState((prev) => ({
        ...prev,
        [chatType]: { sessionId, messages: data },
      }));
    }
  };

  const handleSendMessage = async (type: 'coder' | 'artist' | 'tutor', content: string) => {
    if (!user) return;

    let sessionId = chatState[type].sessionId;

    if (!sessionId) {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          chat_type: type,
          title: content.substring(0, 50),
        })
        .select()
        .single();

      if (error || !data) return;
      sessionId = data.id;
    }

    const userMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      role: 'user' as const,
      content,
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: userMessage.role,
        content: userMessage.content,
      });

    if (insertError) {
      console.error('Error saving message:', insertError);
      return;
    }

    setChatState((prev) => ({
      ...prev,
      [type]: {
        sessionId,
        messages: [...prev[type].messages, userMessage],
      },
    }));

    const assistantMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      role: 'assistant' as const,
      content: `This is a placeholder response from the ${type}. Connect your API key to enable real responses.`,
      created_at: new Date().toISOString(),
    };

    setTimeout(async () => {
      const { error: assistantError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: assistantMessage.role,
          content: assistantMessage.content,
        });

      if (assistantError) {
        console.error('Error saving assistant message:', assistantError);
        return;
      }

      setChatState((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          messages: [...prev[type].messages, assistantMessage],
        },
      }));

      await supabase
        .from('chat_sessions')
        .update({
          updated_at: new Date().toISOString(),
          title: content.substring(0, 50),
        })
        .eq('id', sessionId);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLoadSession={loadSession}
      />

      <div className="flex flex-col h-screen">
        <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-slate-700 rounded-lg transition"
              >
                <Menu className="w-6 h-6 text-slate-300" />
              </button>
              <div className="flex items-center">
                <Sparkles className="w-8 h-8 text-cyan-400 mr-2" />
                <h1 className="text-2xl font-bold text-white">FISSION AI</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm">{user?.email}</span>
              <button
                onClick={logout}
                className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-300 hover:text-white"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChatPanel
              type="coder"
              title="Coder"
              color="bg-gradient-to-r from-blue-600 to-blue-700"
              icon={<Code className="w-6 h-6 text-white" />}
              messages={chatState.coder.messages}
              onSendMessage={(content) => handleSendMessage('coder', content)}
            />
            <ChatPanel
              type="artist"
              title="Artist"
              color="bg-gradient-to-r from-pink-600 to-pink-700"
              icon={<Palette className="w-6 h-6 text-white" />}
              messages={chatState.artist.messages}
              onSendMessage={(content) => handleSendMessage('artist', content)}
            />
            <ChatPanel
              type="tutor"
              title="Tutor"
              color="bg-gradient-to-r from-green-600 to-green-700"
              icon={<GraduationCap className="w-6 h-6 text-white" />}
              messages={chatState.tutor.messages}
              onSendMessage={(content) => handleSendMessage('tutor', content)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
