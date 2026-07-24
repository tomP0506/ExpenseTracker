import { StyleSheet, Text, View, Pressable } from "react-native";
import { supabase } from "../lib/supabase";

export default function AccountScreen(){
    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Connected banks</Text>
                <Text style={styles.placeholder}>Your connected bank details will appear here.</Text>
            </View>

            <Pressable style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
                <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    section: {
        backgroundColor: '#eaeaea',
        borderRadius: 12,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    placeholder: {
        color: '#888',
    },
    subtitle: {
        color: '#666',
        marginBottom: 16,
    },
    signOutButton: {
        marginTop: 'auto',
        backgroundColor: '#c0392b',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    signOutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});