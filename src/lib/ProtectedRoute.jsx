import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { data: userData } = await supabase.auth.getUser();

      setSession(userData?.user ? session : null);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession?.user ? currentSession : null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-slate-600">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return children;
}
