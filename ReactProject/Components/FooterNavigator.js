import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import PromptScreen from "../screens/PromptScreen";
import FeedScreen from "../screens/FeedScreen"; 
import Ionicons from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

export default function FooterNavigator() {
  return (
    <Tab.Navigator

      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          
          if (route.name === 'Feed') {
            iconName = focused ? "home": "home-outline";
          } else if (route.name === 'Prompt') {
            iconName = focused ? 'help' : 'help-outline';
          } else if (route.name === 'Home') {
            iconName = focused ? 'person-circle' : 'person-circle-outline'; // Adjusted icon names
          }

          // You can return any component that you like here!
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
      >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Prompt" component={PromptScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
    </Tab.Navigator>
  );
}
