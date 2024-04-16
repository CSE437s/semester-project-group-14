import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet} from "react-native";
import HomeScreen from "../screens/HomeScreen";
import PromptScreen from "../screens/PromptScreen";
import FeedScreen from "../screens/FeedScreen"; 
import FollowScreen from "../screens/FollowScreen";
import NotificationScreen from '../screens/NotificationScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TouchableOpacity } from "react-native-gesture-handler";

const Tab = createBottomTabNavigator();

export default function FooterNavigator() {
  let navigation = useNavigation();
  return (
    <Tab.Navigator

      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Feed') {
            iconName = focused ? "home": "home-outline";
          } else if (route.name === 'Follow') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Prompt') {
            iconName = focused ? 'help' : 'help-outline';
          } else if (route.name === 'Statistics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline'; // Adjusted icon names
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
      <Tab.Screen name="Feed" component={FeedScreen} 
      options={{
          // headerTitle: (props) => <LogoTitle {...props} />,
          headerRight: () => (
            <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')} 
              title="Info"
              color="#fff"
              style={styles.notificationButton}
            >
              <Ionicons name={'notifications-outline'} size={25} color={"black"} />
            </TouchableOpacity>
          ),
        }}
 />
      <Tab.Screen name="Follow" component={FollowScreen} />
      <Tab.Screen name="Prompt" component={PromptScreen} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />

    </Tab.Navigator>
  );
}
const styles = StyleSheet.create({
  notificationButton: {
    // backgroundColor: "#c0e0ed",
    margin: 10
  }
});
