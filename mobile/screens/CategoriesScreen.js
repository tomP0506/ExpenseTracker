import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, FlatList, Alert } from "react-native";
import { useTransaction } from '../context/TransactionContext';
import { Ionicons } from '@expo/vector-icons';
import { confirmAction } from '../lib/dialog';

export default function CategoriesScreen({navigation}) {
    const {transactions, categories, addCategory, deleteCategory, visibleTransactions } = useTransaction();
    const [newName, setNewName] = useState('');

    function handleAdd(){
        const name = newName.trim();
        if(!name) return;
        addCategory(name);
        setNewName('');
    }

    function confirmDelete(category){
        confirmAction(
            `Delete ${category.name}?`,
            `Charges in this category will become uncategorized`,
            () => deleteCategory(category.id),
            'Delete'
        );
    }


    function totalFor(categoryId){
        return visibleTransactions
            .filter((t) => t.category_id === categoryId)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    return (
        <View style={styles.container}>
            <View style={styles.addRow}>
                <TextInput
                    style={styles.input}
                    placeholder="New Category"
                    value={newName}
                    onChangeText={setNewName}
                />
                <Pressable style={styles.addButton} onPress={handleAdd}>
                    <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
            </View>

            <FlatList
                data={categories}
                keyExtractor={(item) => String(item.id)}
                renderItem={({item}) => (
                    <Pressable
                        style={styles.categoryRow}
                        onPress={() => navigation.navigate('CategoryDetail', {categoryId: item.id})}
                    >
                        <Text style={styles.categoryName}>{item.name}</Text>
                        <View style={styles.rowRight}>
                            <Text style={styles.categoryTotal}>${totalFor(item.id).toFixed(2)}</Text>
                            <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                                <Ionicons name="trash-outline" size={20} color="#c0392b"/>
                            </Pressable>
                        </View>
                    </Pressable>
                )}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16
    },
    addRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    addButton: {
        backgroundColor: '#4a6da7',
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    categoryName: {
        fontSize: 17,
        fontWeight: '600'
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    categoryTotal: {
        fontSize: 16,
    },
})