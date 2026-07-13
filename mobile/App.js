import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { TransactionProvider } from "./context/TransactionContext";
import TransactionScreen from "./screens/TransactionScreen";
import TransactionDetailScreen from "./screens/TransactionDetailScreen";

const Stack = createNativeStackNavigator();

export default function App(){
  return (
    <TransactionProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Transactions" component={TransactionScreen} />
          <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </TransactionProvider>
  );
}