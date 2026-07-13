import { StyleSheet, Text, View, Pressable } from "react-native";
import { useTransaction } from "../context/TransactionContext";

export default function TransactionDetailScreen({route}){
    const {id} = route.params;
    const {transactions, assignCategory} = useTransaction();

    const transaction = transactions.find((t) => t.id === id)

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{transaction.description}</Text>
            <Text style={styles.amount}>${transaction.amount.toFixed(2)}</Text>
            <Text style={styles.category}>Category: {transaction.category}</Text>

            <View style={styles.chipRow}>
                <Pressable style={styles.chip} onPress={() => assignCategory(id, 'Personal')}>
                    <Text style={styles.chipText}>Personal</Text>
                </Pressable>
                <Pressable style={styles.chip} onPress={() => assignCategory(id, 'Family')}>
                    <Text style={styles.chipText}>Family</Text>
                </Pressable>
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
});