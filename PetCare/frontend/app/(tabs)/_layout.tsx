import { Tabs, useNavigation } from "expo-router";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  Text,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from '@expo/vector-icons'; 

interface TabBarIconProps {
  source: ImageSourcePropType;
  color: string;
  label: string;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const purpleColor = Colors[colorScheme ?? "light"].purple; // Access the purple color
  const lightGreyColor = Colors[colorScheme ?? "light"].light_grey; // Access the light grey color
  const navigation = useNavigation();

  // CustomTabBarIcon Component
  const CustomTabBarIcon = ({ source, color }: TabBarIconProps) => (
    <Image
      source={source}
      style={{ tintColor: color, width: 28, height: 26, marginTop: 10, marginBottom: 5 }} // Customize size and tint color
      resizeMode="contain"
    />
  );

  // Custom back button component
  const CustomBackButton = () => (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={styles.backButton}
    >
      <Ionicons name="arrow-back" size={24} color="black" />
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: purpleColor, // Active color: purple
        tabBarInactiveTintColor: purpleColor, // Inactive color: also purple
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: 'Montserrat-Regular',
          color: lightGreyColor, 
          fontWeight: 'bold', 
          fontSize: 11,
          marginBottom: 10,
        },
        tabBarStyle: {
          height: 58,
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 35 : 20,
          left: 16, 
          right: 16,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            },
            android: { elevation: 10 },
          }), 
          borderRadius: 15, 
          elevation: 10, 
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: 4 }, 
          shadowOpacity: 0.3, 
          shadowRadius: 8, 
          backgroundColor: 'white',
          paddingBottom: 0,
        },
      }}
    >
      {/* "Home" screen is hidden in the tab bar but still the default page */}
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Home",
          tabBarButton: () => null,
          tabBarIcon: ({ color }) => (
            <CustomTabBarIcon
              source={require("../../assets/images/Nav_Adoption.png")}
              color={color}
              label="Home"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="missing_pets"
        options={{
          title: "Missing",
          tabBarStyle: { display: "none" }, 
          headerShown: true,
          headerTransparent: true,
          headerLeft: () => <CustomBackButton />,
          headerTitle: () => null,
          headerStyle: {backgroundColor: 'transparent'},
          tabBarIcon: ({ color }) => (
            <CustomTabBarIcon
              source={require("../../assets/images/Nav_Missing.png")}
              color={color}
              label="Missing"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="adoption"
        options={{
          title: "Adoption",
          tabBarStyle: { display: "none" }, // Hide tab bar on this screen
          headerShown: true,
          headerTransparent: true,
          headerLeft: () => <CustomBackButton />,
          headerTitle: () => <Text style={{marginLeft:50 ,fontWeight: 'bold', fontSize: 24}}>Adoption Center</Text>,
          headerStyle: {backgroundColor: 'transparent'},
          tabBarIcon: ({ color }) => (
            <CustomTabBarIcon
              source={require("../../assets/images/Nav_Adoption.png")}
              color={color}
              label="Adoption"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: "Nearby",
          tabBarStyle: { display: "none" }, // Hide tab bar on this screen
          headerShown: true,
          headerTransparent: true,
          headerLeft: () => <CustomBackButton />,
          headerTitle: () => null,
          headerStyle: {backgroundColor: 'transparent'},
          tabBarIcon: ({ color }) => (
            <CustomTabBarIcon
              source={require("../../assets/images/Nav_Nearby.png")}
              color={color}
              label="Nearby"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarStyle: { display: "none" }, // Hide tab bar on this screen
          headerShown: true,
          headerTransparent: true,
          headerLeft: () => <CustomBackButton />,
          headerTitle: () => null,
          headerStyle: {backgroundColor: 'transparent'},
          tabBarIcon: ({ color }) => (
            <CustomTabBarIcon
              source={require("../../assets/images/Nav_Account.png")}
              color={color}
              label="Account"
            />
          ),
        }}
      />
    </Tabs>
  );
}

// Styles
const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontFamily: "Montserrat-Regular",
    fontWeight: "bold",
    fontSize: 12,
  },
  backButton: {
    position: 'absolute', 
    top: 10,
    left: 15, 
    padding: 10,
  },
});
