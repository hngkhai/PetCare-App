import React, { useState, useLayoutEffect } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from './pet_info_modal';
import HomeScreen from "../(tabs)/index"; // Import your index.tsx component
import DateTimePickerModal from "react-native-modal-datetime-picker";
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';


type EditPetScreenRouteProp = RouteProp<RootStackParamList, "pet_information/edit_pet_form">;

const EditPetForm = () => {
  const route = useRoute<EditPetScreenRouteProp>();
  const navigation = useNavigation();
  const { id, name, breed, sex, dob, weight, coatColor, markings, medicCondition, ownerId, petImageUrl } = route.params;

  const initialDate = typeof dob === 'string' ? new Date(dob) : dob;
  const [petName, setPetName] = useState(name);
  const [petBreed, setPetBreed] = useState(breed);
  const [petSex, setPetSex] = useState(sex);
  const [petDob, setPetDob] = useState(initialDate);
  const [petWeight, setPetWeight] = useState(weight);
  const [petCoatColor, setPetCoatColor] = useState(coatColor);
  const [petSpecialMarkings, setPetSpecialMarkings] = useState(markings);
  const [petMedicalCondition, setPetMedicalCondition] = useState(medicCondition);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Edit Pet Form" });
  }, [navigation]);


  const handleSubmit = async () => {
    const updatedPet = {
      petId: id,
      petName,
      sex: petSex,
      breed: petBreed,
      weight: petWeight,
      dateOfBirth: petDob,
      medicCondition: petMedicalCondition,
      markings: petSpecialMarkings,
      coatColor: petCoatColor,
      ownerId: ownerId,
      petImageUrl: petImageUrl
    };
    console.log(updatedPet);
    // Send updatedPet to the backend
    try {
      const response = await axios.put('http://10.91.144.154:8080/api/pet/updatePet', updatedPet);
      console.log('Data updated successfully:', response.data);
      navigation.navigate("index", { refresh: true });
    } catch (error) {
      console.error('Error submitting data:', error);
    }
  };

  const handleConfirm = (date) => {
    setPetDob(date);
    setShowDatePicker(false);
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        {/* Form Fields */}
        <Text style={styles.label}>Name*</Text>
        <TextInput style={styles.input} value={petName} onChangeText={setPetName} />
        <Text style={styles.label}>Breed*</Text>
        <TextInput style={styles.input} value={petBreed} onChangeText={setPetBreed} />
        <Text style={styles.label}>Sex*</Text>
        <RNPickerSelect
          items={[
            { label: 'Male', value: 'M' },
            { label: 'Female', value: 'F' },
          ]}
          onValueChange={(value) => setPetSex(value)}
          value={petSex}
          style={pickerSelectStyles}
        />
        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{petDob.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={() => setShowDatePicker(false)}
          date={petDob} // Show the selected date in the picker
        />
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={petWeight.toString()} // Ensure petWeight is a string for display
          onChangeText={(text) => setPetWeight(parseFloat(text) || 0)} // Convert input to float
          keyboardType="numeric"
        />
        <Text style={styles.label}>Coat Color</Text>
        <TextInput style={styles.input} value={petCoatColor} onChangeText={setPetCoatColor} />
        <Text style={styles.label}>Special Markings</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={petSpecialMarkings}
          onChangeText={setPetSpecialMarkings}
          multiline
          numberOfLines={4}
        />
        <Text style={styles.label}>Medical Condition</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={petMedicalCondition}
          onChangeText={setPetMedicalCondition}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity style={styles.confirmButton} onPress={handleSubmit}>
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
    color: '#000',
    marginBottom: 15,
    marginLeft: 20,
    marginRight: 20,
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
    marginLeft: 20,
    marginRight: 20,
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


export default EditPetForm;