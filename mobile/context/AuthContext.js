import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({children}) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        //on startup: is there already a session 
        supabase.auth.getSession().then(({data}) => {
            setSession(data.session);
            setLoading(false);
        });

        const {data: authListener} = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
            }
        );

        return () => authListener.subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{session, loading}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(){
    return useContext(AuthContext);
}