import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: { id: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (() => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
        } else {
          setUser(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      data = signInData;
    }

    if (data.user) {
      setUser({ id: data.user.id, email: data.user.email || '' });

      const { error: insertError } = await supabase
        .from('users')
        .upsert({ id: data.user.id, email: data.user.email || '' }, { onConflict: 'id' });

      if (insertError && insertError.code !== '23505') {
        console.error('Error creating user record:', insertError);
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
