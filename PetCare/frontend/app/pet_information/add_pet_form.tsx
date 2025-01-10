import React, { useState, useLayoutEffect } from 'react';
import { Alert, View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import RNPickerSelect from 'react-native-picker-select';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth } from "../../firebase";
import axios from 'axios';

const AddPetForm = () => {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('M');
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weight, setWeight] = useState('');
  const [coatColor, setCoatColor] = useState('');
  const [markings, setMarkings] = useState('');
  const [medicalCondition, setMedicalCondition] = useState('');
  const [imageUri, setImageUri] = useState('');
  const userId = auth.currentUser?.uid;
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Add Pet Form" });
  }, [navigation]);


  const handleConfirm = (date) => {
    setDob(date);
    setShowDatePicker(false);
  }

  const validateForm = () => {
    // Name validation
    if (!name || name.length < 1 || name.length > 50) {
      Alert.alert("Invalid Input", "Name is required and must be between 1 and 50 characters.");
      return false;
    }
    // Breed validation
    if (!breed || breed.length < 1 || breed.length > 30) {
      Alert.alert("Invalid Input", "Breed is required and must be between 1 and 30 characters.");
      return false;
    }
    // Sex validation
    if (sex !== 'M' && sex !== 'F') {+
      Alert.alert("Invalid Input", "Sex must be either 'Male' or 'Female'.");
      return false;
    }
    // Date of Birth validation
    const today = new Date();
    if (dob > today) {
      Alert.alert("Invalid Input", "Date of Birth cannot be in the future.");
      return false;
    }
    // Weight validation
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 100) {
      Alert.alert("Invalid Input", "Weight must be a positive number up to 100 kg.");
      return false;
    }
    // Coat Color validation (optional)
    if (coatColor && (coatColor.length > 30)) {
      Alert.alert("Invalid Input", "Coat Color must be less than 30 characters.");
      return false;
    }
    // Special Markings and Medical Condition (optional but with length limit)
    if (markings.length > 200) {
      Alert.alert("Invalid Input", "Special Markings must be less than 200 characters.");
      return false;
    }
    if (medicalCondition.length > 200) {
      Alert.alert("Invalid Input", "Medical Condition must be less than 200 characters.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (validateForm()) {

      const formData = new FormData();
      formData.append('petName', name);
      formData.append('breed', breed);
      formData.append('sex', sex);

      formData.append('dateOfBirth', dob.toISOString());
      formData.append('weight', weight);
      formData.append('coatColor', coatColor);
      formData.append('markings', markings);
      formData.append('medicCondition', medicalCondition);
      formData.append('ownerId', userId);

      // Check if an image is selected and append it as a file
      if (imageUri) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('petImage', {
          uri: imageUri,
          name: filename,
          type: type,
        });
      }
      console.log(formData)
      try {
        const response = await axios.post('http://10.91.144.154:8080/api/pet/addPet', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Form submitted successfully:', response.data);
        Alert.alert('Success', 'Pet added successfully!');

        // Navigate back to home screen
        navigation.navigate("index", { refresh: true });

        // Clear the form
        setName('');
        setBreed('');
        setSex('M');
        setDob(new Date());
        setWeight('');
        setCoatColor('');
        setMarkings('');
        setMedicalCondition('');
        setImageUri('');
      } catch (error) {
        console.error('Error submitting form:', error);
        Alert.alert('Error', 'There was a problem submitting the form.');
      }
    }
  };

  // Function to open photo library
  const openImagePicker = async () => {
    // Request permission to access photos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to pick an image.');
      return;
    }

    // Launch photo library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri); // Store the selected image URI
    }
  };

  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        {/* Upload Image Section */}
        <TouchableOpacity style={styles.imagePickerContainer} onPress={openImagePicker}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <>
              <Icon style={styles.uploadIcon} name="image-outline" size={40} color="#9D9D9D" />
              <ThemedText style={styles.uploadText}>Upload Pet Image</ThemedText>
            </>
          )}
        </TouchableOpacity>
        {/* Add Pet Form */}
        <ThemedText style={styles.label}>Name*</ThemedText>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
        <ThemedText style={styles.label}>Breed*</ThemedText>
        <TextInput
          style={styles.input}
          value={breed}
          onChangeText={setBreed}
        />
        {/* Dropdown */}
        <ThemedText style={styles.label}>Sex*</ThemedText>
        <View style={styles.pickerContainer}>
          <RNPickerSelect
            items={[
              { label: 'Male', value: 'M' },
              { label: 'Female', value: 'F' },
            ]}
            onValueChange={(value) => setSex(value)}
            value={sex}
            style={pickerSelectStyles}
          />
          <Icon name="caret-down" size={20} color="#000" style={styles.dropdownIcon} />
        </View>
        {/* Date Picker */}
        <ThemedText style={styles.label}>Date of Birth</ThemedText>
        <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
          <ThemedText style={styles.dateText}>{dob.toLocaleDateString()}</ThemedText>
          <Icon name="calendar" size={20} color="#000" />
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={() => setShowDatePicker(false)}
        />
        <ThemedText style={styles.label}>Weight (kg)</ThemedText>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />
        <ThemedText style={styles.label}>Coat Color</ThemedText>
        <TextInput
          style={styles.input}
          value={coatColor}
          onChangeText={setCoatColor}
        />
        <ThemedText style={styles.label}>Special Markings</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe any special markings"
          placeholderTextColor={"#9D9D9D"}
          value={markings}
          onChangeText={setMarkings}
          multiline
          numberOfLines={4}
        />
        <ThemedText style={styles.label}>Medical Condition</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe any medical conditions"
          placeholderTextColor={"#9D9D9D"}
          value={medicalCondition}
          onChangeText={setMedicalCondition}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity style={styles.confirmButton} onPress={handleSubmit}>
          <ThemedText style={styles.confirmButtonText}>Confirm</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>

  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
    color: '#000',
    marginBottom: 15,
  },
  inputAndroid: {
    paddingVertical: 8,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
    color: '#000',
    marginBottom: 15,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  confirmButton: {
    marginTop: 10,
    paddingTop: 16,
    paddingBottom: 16,
    width: "45%",
    alignSelf: 'center',
    backgroundColor: '#FFA04A',
    borderRadius: 10,
  },
  confirmButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  pickerContainer: {
    position: 'relative',
    marginLeft: 20,
    marginRight: 20,
    marginTop: 5,
  },
  dropdownIcon: {
    position: 'absolute',
    right: 10,
    top: 15,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    margin: 20,
    marginTop: 5,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    flex: 1,
    color: '#000',
  },
  label: {
    marginLeft: 20,
    fontSize: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingBottom: 18,
    paddingTop: 5,
    paddingLeft: 20,
  },
  imagePickerContainer: {
    marginTop: 12,
    marginBottom: 30,
    width: 300,
    height: 200,
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#6B6B6B',
    borderStyle: 'dashed'
  },
  imagePreview: {
    width: 300,
    height: 200,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginTop: 5,
    margin: 20,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
  },
  uploadIcon: {
    color: '#6B6B6B',
    alignSelf: 'center',
  },
  uploadText: {
    color: '#6B6B6B',
    marginTop: 10,
    alignSelf: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
});


export default AddPetForm;