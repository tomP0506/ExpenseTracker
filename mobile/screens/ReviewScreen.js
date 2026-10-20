import { StyleSheet, Text, View, FlatList, Pressable } from "react-native";
import { useTransaction } from "../context/TransactionContext";

export default function ReviewScreen({ navigation }){
    const { needsReview, categories, categoryName, assignCategory, keepAllSuggested, accountMask } = useTransaction();

    return (
        <View style={styles.container}>
            <FlatList
                data={needsReview}
                keyExtractor={(item) => String(item.id)}
                ListHeaderComponent={needsReview.length > 0 ? (
                    <Text style={styles.hint}>
                        These charges posted after you categorized them while pending.
                        Keep the old category or pick a new one.
                    </Text>
                ) : null}
                ListEmptyComponent={<Text style={styles.empty}>Nothing to review</Text>}
                renderItem={({ item }) => (
                    <Pressable
                        style={styles.row}
                        onPress={() => navigation.navigate('TransactionDetail', {id: item.id})}
                    >
                        <View style={styles.info}>
                            <Text style={styles.description}>{item.description}</Text>
                            <Text style={styles.date}>
                                {item.posted_at}{accountMask(item.account_id) ? `· ••${accountMask(item.account_id)}` : ''}
                            </Text>
                            <View style={styles.chipRow}>
                                <Pressable
                                    style={[styles.chip, styles.keepChip]}
                                    onPress={() => assignCategory(item.id, item.suggested_category_id)}
                                >
                                    <Text style={styles.keepChipText}> Keep {categoryName(item.suggested_category_id)}</Text>
                                </Pressable>
                                {categories
                                    .filter((cat) => cat.id !== item.suggested_category_id)
                                    .map((cat) => (
                                        <Pressable key={cat.id} style={styles.chip} onPress={() => assignCategory(item.id, cat.id)}>
                                            <Text style={styles.chipText}>{cat.name}</Text>
                                        </Pressable>
                                    ))}
                            </View>
                        </View>
                        <Text style={[styles.amount, item.amount < 0 && styles.credit]}>
                            {item.amount < 0 ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
                        </Text>
                    </Pressable>
                )}
            />
            {needsReview.length > 0 && (
                <View style={styles.footer}>
                    <Pressable style={styles.keepAllButton} onPress={keepAllSuggested}>
                        <Text style={styles.keepAllText}>Keep All ({needsReview.length})</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    hint: {padding: 16, fontSize: 13, color: '#666'},
    empty: {padding: 16, color: '#888'},
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    info: {flex: 1, marginRight: 12},
    description: {fontSize: 16, paddingBottom: 8},
    date: {fontSize: 12, color: '#999'},
    amount: {fontSize: 16, fontWeight: '600'},
    credit: {color: '#2e7d32'},
    chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8},
    chip: {paddingVertical: 4, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#e8e8f0'},
    chipText: {fontSize: 13},
    keepChip: { backgroundColor: '#4a6da7' },
    keepChipText: { fontSize: 13, color: '#fff', fontWeight: '600' },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#ddd', backgroundColor: '#fafafa' },
    keepAllButton: { backgroundColor: '#4a6da7', padding: 12, borderRadius: 8, alignItems: 'center' },
    keepAllText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})