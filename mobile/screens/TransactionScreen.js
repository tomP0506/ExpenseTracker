import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useTransaction } from '../context/TransactionContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform  } from 'react-native';

import Animated, {FadeOut, LinearTransition, FadeIn} from 'react-native-reanimated';


export default function TransactionScreen({ navigation }){
    const {transactions, loading, error, refreshing, refresh, assignCategory, connectBank, syncTransactions, categories, categoryName, visibleTransactions, accountMask} = useTransaction();
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

    // const totals = transactions.reduce((acc, t) => {
    //     const name = categoryName(t.category_id);
    //     acc[name] = (acc[name] || 0) + t.amount;
    //     return acc;
    // }, {});

    const uncategorized = visibleTransactions.filter((t) => t.category_id === null && t.suggested_category_id == null);
    const uncategorizedTotal = uncategorized.reduce((sum, t) => sum + t.amount, 0);

    return (
        <View style={styles.container}>
            <FlatList
                data={uncategorized}
                keyExtractor={(item) => String(item.id)}
                refreshing={refreshing}
                onRefresh={refresh}
                renderItem={({item}) => (
                    <Animated.View exiting={FadeOut} entering={FadeIn} layout={LinearTransition}>
                        <Pressable
                            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                            onPress={() => 
                                navigation.navigate('TransactionDetail', {id: item.id})
                            }
                        >
                            <View style={styles.info}>
                                <Text style={styles.description}>{item.description}</Text>
                                <Text style={styles.date}>{item.posted_at} {accountMask(item.account_id) ? ` · ••${accountMask(item.account_id)}` : ''}</Text>
                                <View style={styles.chipRow}>
                                    {categories.map((cat) => (
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
                    </Animated.View>
                )}
            />
            <View style={[styles.summary, {paddingBottom: 16}]}>
                
                {/* {Object.entries(totals).map(([category, total]) => (
                    <View key={category} style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{category}</Text>
                        <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                    </View>
                ))} */}
                {/* <Text style={styles.summaryTotal}>Uncategorized total: ${uncategorizedTotal.toFixed(2)}</Text> */}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Uncategorized Total({uncategorized.length}):</Text>
                    <Text style={styles.totalAmount}>${uncategorizedTotal.toFixed(2)}</Text>
                </View>
                {Platform.OS === 'web' && (
                    <Pressable style={styles.connectButton} onPress={() => syncTransactions()}>
                        <Text style={styles.connectButtonText}>Sync</Text>
                    </Pressable>
                )}
                {/* <Pressable style={styles.connectButton} onPress={connectBank}>
                    <Text style={styles.connectButtonText}>Connect a test Bank</Text>
                </Pressable>
                <Pressable style={styles.connectButton} onPress={syncTransactions}>
                    <Text style={styles.connectButtonText}>Sync Transactions</Text>
                </Pressable> */}
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
        alignItems: 'flex-start',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    description: {
        fontSize: 16,
        paddingBottom: 8,
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
        flexWrap: 'wrap',
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
    // summaryTotal: {
    //     fontSize: 16,
    //     fontWeight: '600',
    //     marginBottom: 8,
    // },
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
    info: {
        flex: 1,
        marginRight: 12,
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    credit: {
        color: '#2e7d32'
    }
});