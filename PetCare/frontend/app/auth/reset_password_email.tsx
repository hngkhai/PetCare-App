const handleReset = async () => {
    const auth = getAuth(); // Initialize Firebase auth

    // Check if the email field is empty
    if (!email) {
        Alert.alert("Error", "Please enter your email address.");
        return;
    }

    try {
        // Send a request to your backend to check if the email exists
        const response = await fetch('http://your-backend-api-url.com/check-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email }), // Send the email to the backend
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle non-200 responses from your backend
            throw new Error(data.message || 'Error checking email');
        }

        if (!data.exists) {
            // If the backend confirms that the email does not exist
            Alert.alert("Error", "Email does not exist in our records!");
            return;
        }

        // If the email exists, proceed with Firebase's sendPasswordResetEmail function
        await sendPasswordResetEmail(auth, email);
        Alert.alert("Success", "Reset instructions sent to: " + email);
        navigation.navigate("auth/reset_password_email"); // Navigate to check email screen

    } catch (error) {
        // Handle different Firebase errors
        switch (error.code) {
            case "auth/user-not-found":
                Alert.alert("Error", "Email does not exist!");
                break;
            case "auth/invalid-email":
                Alert.alert("Error", "The email address is not valid.");
                break;
            default:
                Alert.alert("Error", error.message); // Generic error message
                break;
        }
    }
};

