import { StyleSheet, Text, View } from "react-native";

export default function TransactionDetailScreen({route}){
    const {description, amount} = route.params;
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{description}</Text>
            <Text>Amount: ${amount.toFixed(2)}</Text>
            <Text>Details about one charge will go here.</Text>
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
});