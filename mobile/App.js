import { View, ActivityIndicator, Pressable, Text } from "react-native";
import { supabase } from "./lib/supabase";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { TransactionProvider } from "./context/TransactionContext";
import AuthScreen from "./screens/AuthScreens";
import TransactionScreen from "./screens/TransactionScreen";
import TransactionDetailScreen from "./screens/TransactionDetailScreen";

const Stack = createNativeStackNavigator();

function AppContent(){
  const {session, loading} = useAuth();

  if (loading){
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large"/>
      </View>
    );
  }

  if(!session){
    return <AuthScreen/>;
  }

  return (
    <TransactionProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="Transactions" 
            component={TransactionScreen}
            options={{
              headerRight: () => (
                <Pressable onPress={() => supabase.auth.signOut()}>
                  <Text style={{color: '#4a6da7', fontSize: 16}}>Sign out</Text>
                </Pressable>
              )
            }}
            />
          <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </TransactionProvider>
  );
}

export default function App(){
  return(
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}