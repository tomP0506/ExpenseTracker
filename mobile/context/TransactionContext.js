import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/supabase";
import { supabase } from "../lib/supabase";

const TransactionContext = createContext();

export function TransactionProvider({children}){
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    async function loadTransactions() {
        const {data, error} = await supabase
            .from('transactions')
            .select('*')
            .order('id', {ascending: true});

        if (error) {
            setError(error.message);
        }
        else{
            setTransactions(data.map((t) => ({ ...t, amount: Number(t.amount)})));
            setError(null);
        }
    }

    useEffect(() => {
        async function initialLoad() {
            setLoading(true);
            await loadTransactions();
            setLoading(false);
        }
        initialLoad();
    }, []);

    async function refresh() {
        setRefreshing(true);
        await loadTransactions();
        setRefreshing(false);
    }

    async function assignCategory(id, category) {
        const previousTransactions = transactions;

        //optimistic
        setTransactions(
            transactions.map((t) => (t.id == id ? { ...t, category} : t))
        );

        const {error} = await supabase
            .from('transactions')
            .update({category})
            .eq('id', id);

        if (error) {
            setTransactions(previousTransactions);
            Alert.alert('Could not save', 'Your save was undone. Please try again.');
        }
    }

    async function syncTransactions() {
        const {data, error} = await supabase.functions.invoke('sync-transactions');
        if (error) {
            Alert.alert('Sync failed', "Check the function logs in Supabase");
            return;
        }
        await loadTransactions();
        Alert.alert('Synced', `Pulled ${data.synced} transactions.`);
    }

    async function connectBank() {
        const {data, error} = await supabase.functions.invoke('plaid-link-sandbox');
        if (error) {
            Alert.alert('Connection failed', 'Check the function logs in Supabase for details');
            return;
        }
        await syncTransactions();
    }

    return (
        <TransactionContext.Provider
            value={{transactions, loading, error, refreshing, refresh, assignCategory, connectBank, syncTransactions}}
        >
            {children}
        </TransactionContext.Provider>
    );
}

export function useTransaction(){
    return useContext(TransactionContext);
}
