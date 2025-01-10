import React, { useEffect, useState } from 'react';
import { Text,Alert, View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, FlatList, Button } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation } from 'expo-router';
import { auth } from '@/firebase';
import { CustomModal } from '@/components/CustomModal';
import LoadingScreen from '@/components/LoadingScreen';


interface SelectedImage {
  uri: string;
  type: string;
  name: string;
}


const AddAdoptionPet: React.FC = () => {
    const [petName, setName] = useState('');
    const [breed, setBreed] = useState('');
    const [sex, setSex] = useState<'Male' | 'Female' | null>(null);
    const [age, setAge] = useState('');
    const [type, setType] = useState<'Cat' | 'Dog' | 'Others' | null>(null);
    const [description, setDes] = useState('');
    const [coatColor, setCoatColor] = useState('');
    const [imageUri, setImageUri] = useState('');  // Store the image URI
    const [images, setImages] = useState<SelectedImage[]>([]);
    const navigation = useNavigation();
    const userId = auth.currentUser?.uid;
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [loading, setLoading] = useState(false);  // New loading state

    useEffect(() => {
      navigation.setOptions({
        title: "Add Adoption",
      });
    }, [navigation]);
  
    const pickImage = async () => {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true, // allows multiple images to be selected
        base64: false,
      });
  
      if (!result.canceled) {
        const selectedImages = (result.assets || []).map((asset) => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: asset.uri.split('/').pop() || `image_${Date.now()}.jpg`,
        }));
        console.log(selectedImages)
        setImages((prevImages) => [...prevImages, ...selectedImages]);
      }
    };

 
  
    const removeImage = (uri: string) => {
      setImages((prevImages) => prevImages.filter((image) => image.uri !== uri));
    };

    const uploadImages = async () => {
      const formData = new FormData();
  
      images.forEach((image, index) => {
        //console.log(image.uri)

        formData.append(`file${index}`, {
          uri: image.uri,
          type: image.type,
          name: image.name,
        } as any); // `as any` is used here due to TS complaints with FormData
      });
    };
  
    
    const handleSubmit = async () => {

      if (!petName || !breed || !sex || !age || !type || !images) {
        Alert.alert(
          "Error",
          "Please fill in all the fields and upload a image."
        );
        return;
      }

      const formData = new FormData();
      formData.append('petName', petName);
      formData.append('breed', breed);
      formData.append('sex', sex);
      formData.append('age', age); // Convert date to ISO string
      formData.append('type', type);
      formData.append('coatColor', coatColor);
      formData.append('description', description);
      //Change to userId for testing
      formData.append('ownerId', userId);

      const imagePromises = images.map(async (image) => {

        if (image.uri) {
          const filename = image.uri.split('/').pop(); // Get the file name
          const match = /\.(\w+)$/.exec(filename);
          const types = match ? `image/${match[1]}` : 'image'; // Get the file type
          console.log(types)
          // Fetch the image as a blob
          const blobResponse = await fetch(image.uri);
          const blob = await blobResponse.blob();
          // Append the image to formData
          formData.append('images', {
            uri: image.uri,
            name: filename,
            type: types,
          });

        }
      });
      //console.log(formData)
    
      // Wait for all images to be processed
      await Promise.all(imagePromises);
      
    
      try{
        const response = await fetch("http://10.91.144.154:8080/api/adoption/addAdoption", {
        method: "POST",
        body: formData,
      }); 

        const result = await response.text
        Alert.alert("Success", "Pet adoption Added successfully!", [
          {
            text: "OK",
            onPress: () =>
              navigation.navigate("adoption", {refresh: true,}),
          },
        ]);

        console.log("Success:", result)
      }catch(error){
        console.error("Error:", error);
      }
    
    };

    const toggleDialog = () => {
      setIsDialogVisible(!isDialogVisible);
    };
  
    const handleCancel = () => {
      setName('');
      setBreed('');
      setSex('Male');
      setAge('');
      setType('Dog');
      setDes('');
      setCoatColor('');
      setImageUri('');
    };
  
  
    return (
        
      <ScrollView style={[{backgroundColor:'#fff'}]}>
      
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.petsScrollContainer}
        >

        {images.length > 0 && (
          <FlatList
            data={images}
            keyExtractor={(item) => item.uri}
            horizontal
            renderItem={({ item }) => (
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.uri }} style={styles.image} />
                <TouchableOpacity onPress={() => removeImage(item.uri)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
          
      
        <TouchableOpacity
          onPress={pickImage}
          style={styles.addPetIconContainer}
        >
          <Image
            source={require("../../assets/images/plus_icon.png")}
            style={{ width: 28, height: 28, marginTop: 10 }}
          />
        </TouchableOpacity>

        </ScrollView>
        </View>
          <View style={styles.container}>

            {/* Add Pet Form */}

            <View style={styles.row}>
              <TextInput
                style={styles.input}
                value={petName}
                placeholder="Pet Name*"
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                value={breed}
                placeholder="Breed*"
                onChangeText={setBreed}
              />
            </View>
            <View style={styles.row}>

            <TextInput
              style={styles.input}
              value={age}
              placeholder="Age*"
              onChangeText={setAge}
            />
            <TextInput
              style={styles.input}
              placeholder="Color*"
              value={coatColor}
              onChangeText={setCoatColor}
            />
            </View>
            {/* Dropdown */}
            <View style={styles.row}>
            <Text style={styles.label}>Gender*</Text>
            <TouchableOpacity
              style={[
                styles.genderButton,
                sex === 'Male' ? styles.genderSelected : null
              ]}
              onPress={() => setSex('Male')}
            >
              <Text style={styles.genderText}>♂ M</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                sex === 'Female' ? styles.genderSelected : null
              ]}
              onPress={() => setSex('Female')}
            >
              <Text style={styles.genderText}>♀ F</Text>
            </TouchableOpacity>
            </View>
            {/* Types */}
        
            <View style={styles.row}>
            <Text style={styles.label}>Type*</Text>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'Cat' ? styles.typeSelected : null
              ]}
              onPress={() => setType('Cat')}
            >
              <Text style={styles.typeText}>🐱 Cat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'Dog' ? styles.typeSelected : null
              ]}
              onPress={() => setType('Dog')}
            >
              <Text style={styles.typeText}>🐶 Dog</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'Others' ? styles.typeSelected : null
              ]}
              onPress={() => setType('Others')}
            >
              <Text style={styles.typeText}>⋯ Others</Text>
            </TouchableOpacity>
          </View>
            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput
              style={[styles.input,styles.descriptionInput]}
              value={description || " "}
              onChangeText={setDes}
              multiline
            />
            <TouchableOpacity style={styles.confirmButton} onPress={toggleDialog}>
              <ThemedText style={styles.confirmButtonText}>Submit</ThemedText>
              <CustomModal
                  visible={isDialogVisible}
                  onClose={() => setIsDialogVisible(false)}
                  onConfirm={handleSubmit} // Call delete on confirmation
                  title= "Upload this adoption?"
                  message="Please confirm that you want to add this new pet."
                  confirmText="Yes"
                  cancelText="No"
                />
            </TouchableOpacity>
          </View>
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
    petsScrollContainer: {
      flexDirection: "row",
      backgroundColor: '#fff',

      gap: 16,
    },
    petCard: {
      alignItems: "center",
      justifyContent: "center",
      width: 120,
      height: 120,
      backgroundColor: "white",
      borderColor: "#A0A0A0",
      borderWidth: 2,
      marginLeft: 16,
    },
    petImage: {
      width: "100%",
      height: "100%",
      borderRadius: 60,
    },
    addPetIconContainer: {
      alignItems: "center",
      justifyContent: "center",
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "white",
      borderColor: "#A0A0A0",
      borderWidth: 2,
      marginLeft: 16,
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
      },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    confirmButton: {
      marginTop: 100,
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
    genderButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      marginRight: 10,
      borderWidth: 1,
      borderColor: '#FF8C42',
      borderRadius: 20,
    },
    genderSelected: {
      backgroundColor: '#FF8C42',
    },
    genderText: {
      fontSize: 16,
    },
    descriptionInput: {
      height: 100,
      textAlignVertical: 'top',
    },
    typeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      marginRight: 10,
      borderWidth: 1,
      borderColor: '#FF8C42',
      borderRadius: 20,
    },
    typeSelected: {
      backgroundColor: '#FF8C42',
    },
    typeText: {
      fontSize: 16,
    },
    imageContainer: {
      position: 'relative',
      backgroundColor: '#fff',
      margin: 10,
    },
    imagePickerContainer: {
      marginTop: 12,
      marginBottom: 30,
      width: 200,
      height: 100,
      justifyContent: 'center',
      alignSelf: 'center',
      backgroundColor: '#f9f9f9',
      borderWidth: 1,
      borderColor: '#6B6B6B',
      borderStyle: 'dashed'
    },
    image: {
      width: 100,
      height: 100,
      borderRadius: 10,
    },
    removeButton: {
      position: 'absolute',
      top: -10,
      right: -10,
      backgroundColor: 'orange',
      borderRadius: 50,
      padding: 5,
    },
    removeButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    uploadText: {
      color: '#6B6B6B',
      marginTop: 10,
      alignSelf: 'center',
      fontSize: 14,
      fontWeight: 'bold',
    },
    label: {
      marginRight: 10,
      fontWeight: 'bold',
    },
    header: {
      backgroundColor: '#ff6600',
      padding: 20,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20
    },
    menuIcon: {
      position: 'absolute',
      top: 30,
      left: 10,
      padding: 10
    },
    profileIcon: {
      position: 'absolute',
      top: 30,
      right: 10,
      padding: 10
    },
    headerText: {
      color: '#fff',
      fontSize: 20,
    },
    headerSubText: {
      color: '#fff',
      fontSize: 28,
      fontWeight: 'bold',
      marginTop: 10
    },
    headerDesc: {
      color: '#fff',
      fontSize: 14,
      marginTop: 5
    },
    
    imagePreview: {
      width: 300,
      height: 200,
    },
    input: {
      flex: 1,
      borderColor: '#FF8C42',
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      marginRight: 10,
    },
    textArea: {
      height: 100,
    },
    uploadIcon: {
      color: '#6B6B6B',
      alignSelf: 'center',
    },
    
  });
  
  
export default AddAdoptionPet;
