import {useState} from 'react';
import { Modal, View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import { useTransaction } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';

const CONSENT_VERS = '1';

function linkHtml(token){
    return `<!DOCTYPE html><html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
    </head>
    <body>
        <script>
            const handler = Plaid.create({
            token: ${JSON.stringify(token)},
            onSuccess: function (public_token, metadata) {
                var inst = metadata.institution ? metadata.institution.name : '';
                window.location.href = 'expensetracker://success?public_token=' +
                encodeURIComponent(public_token) + '&institution=' + encodeURIComponent(inst);
            },
            onExit: function () { window.location.href = 'expensetracker://exit'; }
            });
            handler.open();
        </script>
    </body></html>`;
}

export default function LinkBank(){
    const {syncTransactions} = useTransaction();
    const [linkToken, setLinkToken] = useState();
    const [busy, setBusy] = useState(false);
    const {session} = useAuth();
    const consented = session?.user?.user_metadata?.consent_version === CONSENT_VERS;
    const [showConsent, setShowConsent] = useState(false);
    
    function handleLinkPress(){
        if(consented) startLink();
        else setShowConsent(true);
    }   

    async function agreeAndLink() {
        const {error} = await supabase.auth.updateUser({
            data: {consent_version: CONSENT_VERS, consent_at: new Date().toISOString() },
        });
        if(error){
            Alert.alert('Could not save consent', error.message);
            return;
        }
        setShowConsent(false);
        startLink();
    }

    async function startLink() {
        setBusy(true);
        const {data, error} = await supabase.functions.invoke('create-link-token');
        setBusy(false);
        if(error || !data?.link_token){
            Alert.alert('Could not start linking', 'Check the function logs.');
            return;
        }
        setLinkToken(data.link_token);
    }

    async function finishLink(publicToken, institution) {
        setLinkToken(null);
        const {error} = await supabase.functions.invoke('exchange-public-token', {
            body: {public_token: publicToken, institution},
        });
        if (error){
            Alert.alert('Could not link bank', 'Check the function logs.');
            return;
        }
        await syncTransactions();
        Alert.alert('Bank linked', `Connected ${institution || 'your bank'}.`)
    }

    function handleRedirect(url){
        if(url.startsWith('expensetracker://exit')){
            setLinkToken(null);
            return false;
        }
        if(url.startsWith('expensetracker://success')){
            const params = new URLSearchParams(url.split('?')[1] ?? '');
            finishLink(params.get('public_token'), params.get('institution') ?? '');
            return false;
        }
        return true;
    }

    return (
        <View>
            <Pressable style={styles.button} onPress={handleLinkPress} disabled={busy}>
                <Text style={styles.buttonText}>{busy ? 'Working...' : 'Link a bank'}</Text>
            </Pressable>

            <Modal visible={showConsent} animationType="slide" transparent onRequestClose={() => setShowConsent(false)}>
                <View style={styles.consentBackdrop}>
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
                </View>
            </Modal>
            <Modal visible={!!linkToken} animationType="slide" onRequestClose={() => setLinkToken(null)}>
                <View style={{flex: 1}}>
                    <Pressable style={styles.cancel} onPress={() => setLinkToken(null)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                    <WebView
                        originWhitelist={['*']}
                        source={{ html: linkHtml(linkToken), baseUrl: SUPABASE_URL }}
                        onShouldStartLoadWithRequest={(req) => handleRedirect(req.url)}
                    />
                </View>
            </Modal>
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