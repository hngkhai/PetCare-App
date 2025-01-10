import { useEffect, useState } from "react";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking"; // Import linking to handle deep links
import "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = "light"; // Hardcoding color scheme to light mode
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Auth state
  const [loaded] = useFonts({
    "Montserrat-Regular": require("../assets/fonts/Montserrat-Regular.ttf"),
  });

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = await AsyncStorage.getItem("userToken");
      setIsAuthenticated(!!token);
    };

    checkAuthStatus();

    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Configure deep linking
  const linking = {
    prefixes: ["exp://10.91.144.154:19000", "yourapp://"], // Use your Expo URL
    config: {
      screens: {
        "auth/create_new_password": "reset-password", // The screen for resetting password
      },
    },
  };

  return (
    <ThemeProvider value={DefaultTheme}>
      {/* Pass linking configuration to Stack */}
      <Stack
        linking={linking}
        screenOptions={({ route }) => ({
          headerShown: route.name !== "(tabs)" && route.name !== "chatbot",
        })}
      >
        {!isAuthenticated ? (
          // Render login screen if user is not authenticated
          <Stack.Screen name="auth/login" options={{ title: "Login" }} />
        ) : (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="+not-found"
              options={{ title: "Page Not Found" }}
            />
            <Stack.Screen
              name="pet_information/add_pet_form"
              options={{ title: "Add A New Pet" }}
            />
            <Stack.Screen
              name="pet_information/edit_pet_form"
              options={{ title: "Edit Pet Information" }}
            />
            <Stack.Screen
              name="articles/browseAll"
              options={{ headerShown: true, title: "Browse Articles" }}
            />
            {/* Add the reset password screen here */}
            <Stack.Screen
              name="auth/create_new_password"
              options={{ title: "Reset Password" }}
            />
            {/* Chatbot */}
            <Stack.Screen
              name="chatbot/chatbot"
              options={{ headerShown: true,title: "AI PetCare Chatbot" }} // Hide header for chatbot screen
            />
          </>
        )}
      </Stack>
    </ThemeProvider>
  );
}
