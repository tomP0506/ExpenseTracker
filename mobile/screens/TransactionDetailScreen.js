import { StyleSheet, Text, View, Pressable, TextInput } from "react-native";
import { useTransaction } from "../context/TransactionContext";
import { useState } from "react";

export default function TransactionDetailScreen({route, navigation}){
    const {id} = route.params;
    const {transactions, assignCategory, categories, categoryName, accountMask, visibleTransactions, splitTransaction, unsplitTransaction} = useTransaction();
    const [splitAmount, setSplitAmount] = useState('');

    const transaction = visibleTransactions.find((t) => t.id === id);
    if(!transaction) return null;

    async function handleSplit() {
        if(await splitTransaction(id, splitAmount)) navigation.goBack();
    }

    async function handleUnsplit() {
        if(await unsplitTransaction(transaction.parent_id)) navigation.goBack();
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{transaction.description}</Text>
            <Text style={styles.amount}>${transaction.amount.toFixed(2)}</Text>
            <Text style={styles.category}>Category: {categoryName(transaction.category_id)}</Text>
            <Text style={styles.category}>{transaction.posted_at}</Text>
            <Text style={styles.category}>Account Ending in{accountMask(transaction.account_id) ? ` ••${accountMask(transaction.account_id)}` : ''}</Text>

            <View style={styles.chipRow}>
                {categories.map((cat) => (
                    <Pressable key={cat.id} style={styles.chip} onPress={() => assignCategory(id, cat.id)}>
                        <Text style={styles.chipText}>{cat.name}</Text>
                    </Pressable>
                ))}
            </View>
            <View style={styles.splitBox}>
                {transaction.parent_id ? (
                    <Text style={styles.splitNote}>Part of a split charge</Text>
                ) : null}

                <Text style={styles.splitTitle}>Split this charge</Text>
                <TextInput
                    style={styles.splitInput}
                    placeholder={`Less than ${Math.abs(transaction.amount).toFixed(2)}`}
                    value={splitAmount}
                    onChangeText={setSplitAmount}
                    keyboardType="decimal-pad"
                />
                <Pressable style={styles.splitButton} onPress={handleSplit}>
                    <Text style={styles.splitButtonText}>Split</Text>
                </Pressable>

                {transaction.parent_id ? (
                    <Pressable style={styles.undoButton} onPress={handleUnsplit}>
                        <Text style={styles.undoButtonText}>Undo Split</Text>
                    </Pressable>
                ) : null}
            </View>

            <View style={styles.splitBox}>
                
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    amount: {
        fontSize: 20,
        marginBottom: 16,
    },
    category: {
        fontSize: 16,
        color: '#555',
        marginBottom: 16,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent:'center',
        gap: 12,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#e8e8f0',
    },
    chipText: {
        fontSize: 15,
    },
    splitBox: {
        marginTop: 32,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
    },
    splitTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 8,
    },
    splitInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        width: '100%',
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    splitButton: {
        backgroundColor: '#4a5da7',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    splitButtonText: {
        color: '#fff',
        fontSize: '15',
        fontWeight: '600',
    },
    splitNote: {
        fontSize: 13,
        color: '#888',
        marginBottom: 8,
    },
    undoButton: {
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    undoButtonText: {
        color: '#c0392b',
        fontSize: 14,
        fontWeight: '600',
    },
});