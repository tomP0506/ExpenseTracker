import { StyleSheet, Text, View, Button } from 'react-native';

export default function TransactionScreen({navigation}){
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Transactions</Text>
            <Text>Your bank charges will appear here.</Text>
            <Button
                title='View a charge'
                onPress={() => navigation.navigate('TransactionDetail', {
                    description: 'Coffee Shop',
                    amount: 4.5,
                    })
                }
            />
        </View>
    );
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
});