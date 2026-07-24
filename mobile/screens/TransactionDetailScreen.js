import { StyleSheet, Text, View, Pressable } from "react-native";
import { useTransaction } from "../context/TransactionContext";

export default function TransactionDetailScreen({route}){
    const {id} = route.params;
    const {transactions, assignCategory, categories, categoryName} = useTransaction();

    const transaction = transactions.find((t) => t.id === id)

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{transaction.description}</Text>
            <Text style={styles.amount}>${transaction.amount.toFixed(2)}</Text>
            <Text style={styles.category}>Category: {categoryName(transaction.category_id)}</Text>

            <View style={styles.chipRow}>
                {categories.map((cat) => (
                    <Pressable key={cat.id} style={styles.chip} onPress={() => assignCategory(id, cat.id)}>
                        <Text style={styles.chipText}>{cat.name}</Text>
                    </Pressable>
                ))}
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
});