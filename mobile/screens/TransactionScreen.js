import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useTransaction } from '../context/TransactionContext';


export default function TransactionScreen({ navigation }){
    const {transactions, loading, error, refreshing, refresh, assignCategory} = useTransaction();

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
});