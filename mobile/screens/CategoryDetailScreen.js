import {useLayoutEffect} from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Alert } from 'react-native';
import { useTransaction } from '../context/TransactionContext';
import { confirmAction } from '../lib/dialog';

export default function CategoryDetailScreen({route, navigation}){
    const {categoryId} = route.params;
    const {transactions, categoryName, clearCategory, visibleTransactions} = useTransaction();

    const name = categoryName(categoryId);
    const charges = visibleTransactions.filter((t) => t.category_id == categoryId);
    const total = charges.reduce((sum, t) => sum + t.amount, 0);

    useLayoutEffect(() => {
        navigation.setOptions({title: name});
    }, [navigation, name]);

    function confirmClear(){
        if(charges.length === 0) return;

        confirmAction(
            `Clear ${name}?`,
            `This permenantly deletes ${charges.length} charge(s).`,
            () => {
                clearCategory(categoryId);
                navigation.goBack();
            },
            'Clear'
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.total}>${total.toFixed(2)}</Text>
                <Pressable onPress={confirmClear}>
                    <Text style={styles.clearText}>Clear charges</Text>
                </Pressable>
            </View>

            <FlatList
                data={charges}
                keyExtractor={(item) => String(item.id)}
                renderItem={({item}) => (
                    <Pressable
                        style={styles.chargeRow}
                        onPress={() => navigation.navigate('TransactionDetail', {id: item.id})}
                    >
                        <Text>{item.description}</Text>
                        <Text>${item.amount.toFixed(2)}</Text>
                    </Pressable>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No charges in this category</Text>}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    clearText: {
        color: '#c0392b',
        fontWeight: '600',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    total: {
        fontSize: 22,
        fontWeight: '700',
    },
    chargeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        margin: 2,
        // borderWidth: 1,
        borderRadius: 8,
        // borderColor: '#565656',
        backgroundColor: '#e5e5e5',
    },
    empty: {
        padding: 16,
        color: '#888',
    },
})