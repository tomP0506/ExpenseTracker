import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/supabase";

const TransactionContext = createContext();

export function TransactionProvider({children}){
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadTransactions() {
            try {
                const response = await fetch(
                    `${SUPABASE_URL}/rest/v1/transactions?select=*&order=id.asc`,
                    {
                        headers: {
                            apikey: SUPABASE_ANON_KEY,
                            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                        },
                    }
                );

                if(!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const data = await response.json();
                setTransactions(data.map((t) => ({...t, amount: Number(t.amount)})));
            } catch (e){
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        
        loadTransactions();
    }, []);

    async function assignCategory(id, category) {
        const previousTransactions = transactions;

        //optimistic
        setTransactions(
            transactions.map((t) => (t.id == id ? { ...t, category} : t))
        );

        try{
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/transactions?id=eq.${id}`,
                {
                    method: 'PATCH',
                    headers: {
                        apikey: SUPABASE_ANON_KEY,
                        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': `application/json`,
                    },
                    body: JSON.stringify({category}),
                }
            );

            if (!response.ok){
                throw new Error(`Update failed with status ${response.status}`);
            }
        } catch(e){
            setTransactions(previousTransactions); //undo optimistic
            Alert.alert('Could not save', 'Your change was undone. Please try again.');
        }
    }

    return (
        <TransactionContext.Provider
            value={{transactions, loading, error, assignCategory}}
        >
            {children}
        </TransactionContext.Provider>
    );
}

export function useTransaction(){
    return useContext(TransactionContext);
}
