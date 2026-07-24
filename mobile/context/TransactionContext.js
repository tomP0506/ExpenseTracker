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
    const [categories, setCategories] = useState([]);

    async function loadTransactions() {
        const {data, error} = await supabase
            .from('transactions')
            .select('*')
            .order('posted_at', {ascending: false, nullsFirst: false});

        if (error) {
            setError(error.message);
        }
        else{
            setTransactions(data.map((t) => ({ ...t, amount: Number(t.amount)})));
            setError(null);
        }
    }

    async function loadCategories() {
        const {data, error} = await supabase.from('categories').select('*').order('id', {ascending: false, nullsFirst: false});
        // console.log('loadCategories →', { data, error });
        if(!error) setCategories(data);
    }

    async function clearCategory(categoryId) {
        const {error} = await supabase.from('transactions').delete().eq('category_id', categoryId);
        if(error){
            Alert.alert('Could not clear', error.message);
            return;
        }

        await loadTransactions();
    }

    useEffect(() => {
        async function initialLoad() {
            setLoading(true);
            await Promise.all([loadTransactions(),loadCategories()]);
            setLoading(false);
        }
        initialLoad();
    }, []);

    async function refresh() {
        setRefreshing(true);
        await loadTransactions();
        setRefreshing(false);
    }

    async function addCategory(name) {
        const {data} = await supabase.from('categories').select('id').eq('name', name);
        if(data &&  data.length > 0){
            Alert.alert('Name already exists');
            return;
        }
        const {error} = await supabase.from('categories').insert({name});
        if(error){
            Alert.alert('Could not add category', error.message);
            return;
        }
        await loadCategories();
    }

    async function assignCategory(id, categoryId) {
        const previousTransactions = transactions;

        //optimistic
        setTransactions(
            transactions.map((t) => (t.id == id ? { ...t, category_id: categoryId} : t))
        );

        const {error} = await supabase
            .from('transactions')
            .update({category_id: categoryId})
            .eq('id', id);

        if (error) {
            setTransactions(previousTransactions);
            Alert.alert('Could not save', 'Your save was undone. Please try again.');
        }

        
    }

    function categoryName(categoryId){
        if(!categoryId) return 'Uncategorized';
        return categories.find((c) => c.id === categoryId)?.name ?? 'Uncategorized';
    }

    async function deleteCategory(id) {
        const {error} = await supabase.from('categories').delete().eq('id', id);
        if (error){
            Alert.alert('Could not delete category', error.message);
            return;
        }
        await loadCategories();
        await loadTransactions();
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
            value={{transactions, loading, error, refreshing, refresh, assignCategory, connectBank, syncTransactions, categories, addCategory, categoryName, deleteCategory, clearCategory}}
        >
            {children}
        </TransactionContext.Provider>
    );
}

export function useTransaction(){
    return useContext(TransactionContext);
}
