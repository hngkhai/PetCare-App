import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { View, TextInput, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Keyboard, ActivityIndicator ,Linking, Alert} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// constant useNavigation = useNavigation();
//   useEffect(()=>{
//     navigation.setoptions({
//       title:"AI PetCare Chatbot"
//     })
//   });

const linkifyText = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <Text
          key={index}
          style={{ color: 'white', textDecorationLine: 'underline' }}
          onPress={() => Linking.openURL(part)}
        >
          {part}
        </Text>
      );
    }
    return part;  // Return non-URL parts as normal text
  });
};



// const Chatbot = () => {
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([
//     { type: 'bot', text: "Hi there! 🐾 I'm PetBuddy, your pet care research assistant. How can I help you and your pet today?" }
//   ]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [lastMessage, setLastMessage] = useState('');
//   const scrollViewRef = useRef<ScrollView>(null);

//   const sendMessage = async () => {
//     if (message.trim()) {
//       setMessages([...messages, { type: 'user', text: message }]);
//       setMessage('');
//       setIsLoading(true);
//       Keyboard.dismiss();    
//       try {//refer to ipconfig
//         //ip address: 10.91.203.213:8000 (change accordingly)
//         const response = await fetch('http://192.168.183.247:8000/get_response', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ msg: message }),  // Change 'text' to 'msg'
//         });
    
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
    
//         const data = await response.json();
    
//         // Set the bot's response in the state (complete response at once)
//         setMessages((prevMessages) => [
//             ...prevMessages,
//             { type: 'bot', text: data.response },
//         ]);
//     } catch (error) {
//         console.error('Error:', error);
//         setMessages((prevMessages) => [
//             ...prevMessages,
//             { type: 'bot', text: 'There was an error processing your request.' },
//         ]);
//     } finally {
//         // Reset the loading state after the response is received or an error occurs
//         setIsLoading(false);
//     }
    
      
      
     
//     }
//   };
const Chatbot = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Welcome! How can I assist you today? Please choose from the options below:\n\n1️⃣ To get a guided tour of our app features and learn how to make the most out of it, select 1 to chat with GuideBot.\n\n2️⃣ For pet care advice and research assistance, select 2 to chat with PetBuddy.\n\nPlease enter your choice to proceed! (Note: This is case-sensitive.)" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState(null);  // Track user's choice
  const scrollViewRef = useRef(null);
  const options = [
    { label: "Register", query: "Register", id: 3 },
    { label: "Login", query: "Login", id: 5 },
    { label: "Reset Password", query: "Reset Password", id: 7 },
    { label: "View Personal Account", query: "View Personal Account", id: 10 },
    { label: "Edit Personal Information", query: "Edit Personal Information", id: 12 },
    { label: "Log Out", query: "Log Out", id: 14 },
    { label: "View Home Page", query: "View Home Page", id: 16 },
    { label: "View All Articles", query: "View All Articles", id: 18 },
    { label: "Filter Articles", query: "Filter Articles", id: 20 },
    { label: "Search Articles", query: "Search Articles", id: 22 },
    { label: "View Article Details", query: "View Article Details", id: 23 },
    { label: "Add New Article", query: "Add New Article", id: 24 },
    { label: "View Posted Articles", query: "View Posted Articles", id: 27 },
    { label: "Edit Article", query: "Edit Article", id: 29 },
    { label: "Delete Article", query: "Delete Article", id: 32 },
    { label: "Display Active Missing Pets", query: "Display Active Missing Pets", id: 33 },
    { label: "Report Pet as Missing", query: "Report Pet as Missing", id: 37 },
    { label: "Update Last Seen Location", query: "Update Last Seen Location", id: 40 },
    { label: "Edit Missing Pet Report", query: "Edit Missing Pet Report", id: 42 },
    { label: "Mark Missing Pet as Found", query: "Mark Missing Pet as Found", id: 45 },
    { label: "Explore Petcare Amenities", query: "Explore Petcare Amenities", id: 47 },
    { label: "Filter Petcare Amenities", query: "Filter Petcare Amenities", id: 50 },
    { label: "Search Petcare Amenities", query: "Search Petcare Amenities", id: 53 },
    { label: "View Pet Information", query: "View Pet Information", id: 55 },
    { label: "Edit Pet Information", query: "Edit Pet Information", id: 57 },
    { label: "Add Pet", query: "Add Pet", id: 60 },
    { label: "Delete Pet", query: "Delete Pet", id: 61 },
    { label: "Add Adoption Pet", query: "Add Adoption Pet", id: 64 },
    { label: "Edit Adoption Pet", query: "Edit Adoption Pet", id: 66 },
    { label: "Delete Pet Adoption", query: "Delete Pet Adoption", id: 68 },
    { label: "Display Adoption Pet", query: "Display Adoption Pet", id: 70 }
  ];


  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Chatbot" });
  }, [navigation]);


  const sendMessage = async () => {
    if (message.length>=100){
      Alert.alert("Error", "Please input not more than 100 characters")
      return
    }
    if (message.trim()) {
      setMessages([...messages, { type: 'user', text: message }]);
      setMessage('');
      setIsLoading(true);
      Keyboard.dismiss();

      try {
        // Check if user has selected a chatbot
        if (!selectedChatbot) {
          // Check if user input is 1 or 2 for chatbot selection
          const choice = message.trim();
          if (choice === '1') {
            setSelectedChatbot(1);
            setMessages((prevMessages) => [
              ...prevMessages,
              { type: 'bot', text: "You are now chatting with GuideBot! How can I assist you with app navigation?" },
            ]);
          } else if (choice === '2') {
            setSelectedChatbot(2);
            setMessages((prevMessages) => [
              ...prevMessages,
              { type: 'bot', text: "You are now chatting with PetBuddy! How can I assist with pet care today?" },
            ]);
          } else {
            setMessages((prevMessages) => [
              ...prevMessages,
              { type: 'bot', text: "Invalid choice. Please select 1 for GuideBot or 2 for PetBuddy." },
            ]);
          }
        } else {
          // Send message to backend with user's choice
          const response = await fetch('http://10.91.180.40:8000/get_response', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ msg: message, choice: selectedChatbot }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          // Set the bot's response in the state
          setMessages((prevMessages) => [
            ...prevMessages,
            { type: 'bot', text: data.response },
          ]);
        }
      } catch (error) {
        console.error('Error:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: 'bot', text: 'There was an error processing your request.' },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // Scroll to the bottom of the chat when a new message is added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.chatArea} ref={scrollViewRef}>
        {messages.map((msg, index) => (
          <View key={index} style={[styles.messageContainer]}>
            {msg.type === 'bot' && (
              <View style={styles.robotContainer}>
                <Image
                  source={require('../../assets/images/chatbot.png')}
                  style={styles.robotImage}
                />
              </View>
            )}
            <View style={[styles.message, msg.type === 'user' ? styles.userMessage : styles.botMessage]}>
              <Text style={msg.type === 'user' ? styles.userMessageText : styles.messageText}>
                {linkifyText(msg.text)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} disabled={isLoading || message.trim() === ''}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Image
              source={require('../../assets/images/sendMsgIcon.png')}
              style={styles.sendMessageImage}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F5E9',
    padding: 10,
  },
  chatArea: {
    flex: 1,
    marginBottom: 10,
  },
  messageContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginVertical: 5,
    maxWidth: '100%',
    padding: 15,
  },
  robotContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  message: {
    padding: 10,
    borderRadius: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#EDEDED',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#2C2C2C',
  },
  userMessageText: {
    fontSize: 16,
    color: '#000',
  },
  messageText: {
    fontSize: 16,
    color: '#FFF',
  },
  robotImage: {
    width: 30,
    height: 30,
    marginBottom: 5,
  },
  sendMessageImage: {
    width: 30,
    height: 30,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 5,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    padding: 10,
  },
});

export default Chatbot;
