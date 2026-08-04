import {useState} from 'react';
import { Modal, View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import { useTransaction } from '../context/TransactionContext';

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
            <Pressable style={styles.button} onPress={startLink} disabled={busy}>
                <Text style={styles.buttonText}>{busy ? 'Working...' : 'Link a bank'}</Text>
            </Pressable>

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
    }
});