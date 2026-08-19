import {useState, useEffect} from 'react';
import { View, Pressable, Text, StyleSheet, Alert} from 'react-native';
import {usePlaidLink} from 'react-plaid-link';
import { supabase } from '../lib/supabase';
import { useTransaction } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { notify } from '../lib/dialog';

const CONSENT_VERS = '1';

function PlaidLauncher({token, onSuccess, onExit}){
    const {open, ready, error} = usePlaidLink({token, onSuccess, onExit});
    useEffect(() => {
        console.log('plaid launcher ', {ready, error, hasToken: !!token});
        if (ready) open();
    }, [ready, error, open, token]);
    return null;
}

export default function LinkBank(){
    const {syncTransactions} = useTransaction();
    const {session} = useAuth();
    const consented = session?.user?.user_metadata?.consent_version === CONSENT_VERS;

    const [linkToken, setLinkToken] = useState(null);
    const [busy, setBusy] = useState(false);
    const [showConsent, setShowConsent] = useState(false);

    async function startLink() {
        setBusy(true);
        const {data, error} = await supabase.functions.invoke('create-link-token');
        setBusy(false);
        console.log('Create-link-token ', {data, error});
        if (error || !data?.link_token){
            notify('Could not start linking', 'Check the function logs');
            return;
        }
        setLinkToken(data.link_token);
    }

    function handleLinkPress(){
        if (consented) startLink();
        else setShowConsent(true);
    }

    async function agreeAndLink() {
        const {error} = await supabase.auth.updateUser({
            data: {consent_version: CONSENT_VERS, consent_at: new Date().toISOString() },
        });
        if(error){
            notify('Could not save consent', error.message);
            return;
        }
        setShowConsent(false);
        startLink();
    }

    async function finishLink(publicToken, institution) {
        setLinkToken(null);
        const {error} = await supabase.functions.invoke('exchange-public-token', {
            body: {public_token: publicToken, institution},
        });
        if (error){
            notify('Could not link bank', 'Check the function logs.');
            return;
        }
        await syncTransactions();
        notify('Bank linked', `Connected ${institution || 'your bank'}.`)
    }

    return (
        <View>
            <Pressable style={styles.button} onPress={handleLinkPress} disabled={busy}>
                <Text style={styles.buttonText}>{busy ? 'Working...': 'Link a bank'}</Text>
            </Pressable>

            {linkToken && (
                <PlaidLauncher
                    token={linkToken}
                    onSuccess={(public_token, metadata) => 
                        finishLink(public_token, metadata.institution?.name ?? '')
                    }
                    onExit={() => setLinkToken(null)}
                />
            )}

            {showConsent && (
                <View style={styles.consentCard}>
                    <Text style={styles.consentTitle}>Before you connect a bank</Text>
                    <Text style={styles.consentBody}>
                        To show and categorize your spending, this app will access your account
                        details, balances, and transaction history from the bank you link, through
                        our provider Plaid.{"\n\n"}
                        This data is stored securely (encrypted, on our server) and used only inside
                        this app. Access is read-only — it can never move money. You can disconnect a
                        bank at any time to delete its data.
                    </Text>
                    <Pressable style={styles.button} onPress={agreeAndLink}>
                        <Text style={styles.buttonText}>I Agree & Continue</Text>
                    </Pressable>
                    <Pressable style={styles.consentCancel} onPress={() => setShowConsent(false)}>
                        <Text style={styles.consentCancelText}>Cancel</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#4a6da7',
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancel: {
        padding: 12,
        alignItems: 'flex-end',
    },
    cancelText: {
        color: '#4a6da7',
        fontSize: 16,
    },
    consentBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    consentCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
    },
    consentTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
    },
    consentBody: {
        fontSize: 12,
        lineHeight: 22,
        color: '#333',
        marginBottom: 20,
    },
    consentCancel: {
        padding: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    consentCancelText: {
        color: '#4a6da7',
        fontSize: 15,
    },
});

