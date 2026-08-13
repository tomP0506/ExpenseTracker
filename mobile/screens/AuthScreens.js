import { useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";

export default function AuthScreen(){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signIn() {
        setLoading(true);
        const {error} = await supabase.auth.signInWithPassword({email, password});
        if(error) Alert.alert('Sign in failed', error.message);
        setLoading(false);
    }

    async function signUp() {
        setLoading(true);
        const {error} = await supabase.auth.signUp({email, password});
        if(error) Alert.alert('Sign up failed', error.message);
        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Expense Tracker</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
            />

            {loading ? (
                <ActivityIndicator style={{marginTop: 12}} />
            ) : (
                <View style={styles.buttons}>
                    <Pressable style={styles.button} onPress={signIn}>
                        <Text style={styles.buttonText}>Sign in</Text>
                    </Pressable>
                    <Pressable style={[styles.button, styles.secondary]} onPress={signUp}>
                        <Text style={styles.buttonText}>Sign Up</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        gap: 12,
        backgroundColor: '#f2f2f2',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        backgroundColor: '#4a6da7',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    secondary: {
        backgroundColor: '#888',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});