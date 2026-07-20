import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useTransaction } from '../context/TransactionContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function TransactionScreen({ navigation }){
    const {transactions, loading, error, refreshing, refresh, assignCategory, connectBank, syncTransactions} = useTransaction();
    const insets = useSafeAreaInsets();

    if (loading){
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }
    
    if (error){
        return (
            <View style={styles.centered}>
                <Text>Couldn't load transactions: {error}</Text>
            </View>
        );
    }

    const totals = transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {});

    return (
        <View style={styles.container}>
            <FlatList
                data={transactions}
                keyExtractor={(item) => String(item.id)}
                refreshing={refreshing}
                onRefresh={refresh}
                renderItem={({item}) => (
                    <Pressable
                        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                        onPress={() => 
                            navigation.navigate('TransactionDetail', {id: item.id})
                        }
                    >
                        <View>
                            <Text style={styles.description}>{item.description}</Text>
                            <Text style={styles.category}>{item.category}</Text>
                            <View style={styles.chipRow}>
                                <Pressable style={styles.chip} onPress={() => assignCategory(item.id, 'Personal')}>
                                    <Text style={styles.chipText}>Personal</Text>
                                </Pressable>
                                <Pressable style={styles.chip} onPress={() => assignCategory(item.id, 'Family')}>
                                    <Text style={styles.chipText}>Family</Text>
                                </Pressable>
                            </View>
                        </View>
                        <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
                    </Pressable>
                )}
            />
            <View style={[styles.summary, {paddingBottom: 16 + insets.bottom}]}>
                
                {Object.entries(totals).map(([category, total]) => (
                    <View key={category} style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{category}</Text>
                        <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                    </View>
                ))}
                <Pressable style={styles.connectButton} onPress={connectBank}>
                    <Text style={styles.connectButtonText}>Connect a test Bank</Text>
                </Pressable>
                <Pressable style={styles.connectButton} onPress={syncTransactions}>
                    <Text style={styles.connectButtonText}>Sync Transactions</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    description: {
        fontSize: 16,
    },
    amount: {
        fontSize: 16,
        fontWeight: '600'
    },
    rowPressed: {
        backgroundColor: '#bababa',
    },
    category: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    chip: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#e8e8f0',
    },
    chipText: {
        fontSize: 13,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    summary: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        backgroundColor: '#fafafa',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 2,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    totalAmount: {
        fontSize: 15,
    },
    connectButton: {
        backgroundColor: '#4a6da7',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    connectButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});