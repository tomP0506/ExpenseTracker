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
    const isOAuthReturn = window.location.search.includes('oauth_state_id');
    const {open, ready, error} = usePlaidLink({
        token, 
        onSuccess, 
        onExit,
        receivedRedirectUri: isOAuthReturn ? window.location.href : undefined
    });
    useEffect(() => {
        console.log('plaid launcher ', {ready, error, hasToken: !!token});
        if (ready) open();
    }, [ready, open,]);
    return null;
}

export default function LinkBank(){
    const {syncTransactions, reauthItemIds, accounts} = useTransaction();
    const {session} = useAuth();
    const consented = session?.user?.user_metadata?.consent_version === CONSENT_VERS;

    const [linkToken, setLinkToken] = useState(null);
    const [busy, setBusy] = useState(false);
    const [showConsent, setShowConsent] = useState(false);

    async function startLink(itemId) {
        setBusy(true);
        const {data, error} = await supabase.functions.invoke('create-link-token', {
            body: { redirect_uri: window.location.origin + '/', item_id: itemId},
        } );
        setBusy(false);
        if (error || !data?.link_token){
            notify('Could not start linking', 'Check the function logs');
            return;
        }
        localStorage.setItem('plaid_link_token', data.link_token);
        if (itemId) localStorage.setItem('plaid_update_item', itemId);
        else localStorage.removeItem('plaid_update_item');
        setLinkToken(data.link_token);
    }

    useEffect(() => {
        if(window.location.search.includes('oauth_state_id')) {
            const stored = localStorage.getItem('plaid_link_token');
            if (stored) setLinkToken(stored);
        }
    }, []);

    function clearLinkState(){
        setLinkToken(null);
        localStorage.removeItem('plaid_link_token');
        localStorage.removeItem('plaid_update_item');
        window.history.replaceState({}, '', '/');
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
        const updateItemId = localStorage.getItem('plaid_update_item');
        clearLinkState();
        
        if (updateItemId) {
            await syncTransactions({silent: true});
            notify('Bank reconnected', `${institution || 'Your bank'} is syncing again`);
            return;
        }
        
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
            {reauthItemIds.map((itemId) => {
                const bank = accounts.find((a) => a.item_id === itemId)?.institution_name ?? 'A bank';
                return (
                    <View key={itemId} style={styles.reauthCard}>
                        <Text style={styles.reauthText}>{bank} needs you to sign in again.</Text>
                        <Pressable style={styles.button} onPress={() => startLink(itemId)} disabled={busy}>
                            <Text style={styles.buttonText}>Reconnect</Text>
                        </Pressable>
                    </View>
                );
            })}
            <Pressable style={styles.button} onPress={handleLinkPress} disabled={busy}>
                <Text style={styles.buttonText}>{busy ? 'Working...': 'Link a bank'}</Text>
            </Pressable>

            {linkToken && (
                <PlaidLauncher
                    token={linkToken}
                    onSuccess={(public_token, metadata) => 
                        finishLink(public_token, metadata.institution?.name ?? '')
                    }
                    onExit={(err, metadata) => {
                        if (err) {
                            console.error('Plaid exit error', err, metadata);
                            notify(
                                `Plaid: ${err.error_code}`,
                                `${err.display_message || err.error_message}\n\nrequest id: ${metadata.request_id}`
                            );
                        }
                        clearLinkState();
                    }}
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
    reauthCard: {
        backgroundColor: '#fdecea',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },
    reauthText: {
        color: '#8a1c12',
        fontSize: 14,
        marginBottom: 10,
    },
});

