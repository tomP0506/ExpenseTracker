import { StyleSheet, Text, View, Pressable, SectionList, Switch } from "react-native";
import { supabase } from "../lib/supabase";
import { useTransaction } from "../context/TransactionContext";

export default function AccountScreen(){
    const {accounts, toggleAccountHidden} = useTransaction();

    const sections = Object.entries(
        accounts.reduce((acc, a) => {
            const bank = a.institution_name ?? 'Unknown bank';
            (acc[bank] ??= []).push(a);
            return acc;
        }, {})
    ).map(([title, data]) => ({title, data}));

    return (
        <View style={styles.container}>
            <SectionList
                // style={{marginHorizontal: -16}}
                // contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 16}}
                sections={sections}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{paddingBottom: 16}}
                renderSectionHeader={({section}) => (
                    <View style={styles.headerMask}>
                        <Text style={styles.bankeHeader}>{section.title}</Text>
                    </View>
                )}
                renderItem={({item}) => (
                    <View style={styles.accountRow}>
                        <View style={styles.accountInfo}>
                            <Text style={styles.accountName}>
                                {item.name}{item.mask ? ` ••${item.mask}` : ''}
                            </Text>
                            <Text style={styles.balance, item.hidden && styles.hiddenText}>
                                ${item.current_balance.toFixed(2)}
                            </Text>
                        </View>
                        <Switch value={!item.hidden} onValueChange= {() => toggleAccountHidden(item)} />
                    </View>
                )}
                ListEmptyCommand={
                    <Text style={styles.empty}>No connected banks yet - connect one from Transactions tab</Text>
                }
            />

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
    headerMask: {
        backgroundColor: '#f2f2f2',
        // padding: 16,
        // paddingBottom: 12,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    bankeHeader: {
        fontSize: 18,
        fontWeight: '700',
        padding:16,
        // paddingTop: 16,
        // paddingBottom: 4,
        backgroundColor: '#d6d6d6',
        borderRadius: 10,
    },
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    accountInfo:{
        flex: 1,
    },
    hiddenText: {
        color: '#bbb',
    },
    accountName: {
        fontSize: 15,
    },
    balance: {
        fontSize: 15,
        fontWeight: '600',
    },
    empty: {
        color: '#888',
        marginTop: 24,
        textAlign: 'center',
    },
    // section: {
    //     backgroundColor: '#eaeaea',
    //     borderRadius: 12,
    //     padding: 16,
    // },
    // sectionTitle: {
    //     fontSize: 16,
    //     fontWeight: '600',
    //     marginBottom: 6,
    // },
    // placeholder: {
    //     color: '#888',
    // },
    // subtitle: {
    //     color: '#666',
    //     marginBottom: 16,
    // },
    signOutButton: {
        marginTop: 12,
        backgroundColor: '#c0392b',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    signOutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});