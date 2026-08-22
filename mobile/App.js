import { View, ActivityIndicator } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import { useFonts } from 'expo-font'
import { Ionicons } from "@expo/vector-icons";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { TransactionProvider } from "./context/TransactionContext";
import AuthScreen from "./screens/AuthScreens";
import TransactionScreen from "./screens/TransactionScreen";
import TransactionDetailScreen from "./screens/TransactionDetailScreen";
import CategoriesScreen from "./screens/CategoriesScreen";
import AccountScreen from "./screens/AccountScreen";
import CategoryDetailScreen from "./screens/CategoryDetailScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme ={
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f2f2f2'
    // background: '#ffffff'
  }
}

function TransactionsStack(){
  return (
    <Stack.Navigator screenOptions={{headerTintColor: '#4a6da7'}}>
      <Stack.Screen name="Transactions" component={TransactionScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    </Stack.Navigator>
  )
}

function CategoryStack(){
  return (
    <Stack.Navigator screenOptions={{headerTintColor: '#4a6da7'}}>
      <Stack.Screen name="CategoriesList" component={CategoriesScreen} options={{title: 'Categories'}} />
      <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen}/>
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen}/>
     </Stack.Navigator>
  )
}

function AppContent(){
  const {session, loading} = useAuth();

  if (loading){
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f2f2'}}>
        <ActivityIndicator size="large"/>
      </View>
    );
  }

  if(!session){
    return <AuthScreen/>;
  }

  return (
    <TransactionProvider>
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator screenOptions={{headerShown: false}}>
          <Tab.Screen
            name="TransactionsTab"
            component={TransactionsStack}
            options={{
              title: "Transactions",
              tabBarIcon: ({color, size}) => <Ionicons name="list" color={color} size={size}/>
            }}
          />
          <Tab.Screen
            name="CategoriesTab"
            component={CategoryStack}
            options={{
              title: "Categories",
              tabBarIcon: ({color, size}) => <Ionicons name="pricetags" color={color} size={size}/>
            }}
          />
          <Tab.Screen
            name="Account"
            component={AccountScreen}
            options={{
              headerShown: true,
              tabBarIcon: ({color, size}) => <Ionicons name="person" color={color} size={size}/>
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </TransactionProvider>
  );
}

export default function App(){
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);

  if(!fontsLoaded && !fontError){
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f2f2'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return(
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}