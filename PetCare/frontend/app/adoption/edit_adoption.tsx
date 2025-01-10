import React, { useEffect, useState } from 'react';
import { Text,Alert, View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, FlatList, Button, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { CustomModal } from '@/components/CustomModal';
import LoadingScreen from '@/components/LoadingScreen';
import { auth } from '@/firebase';


type PetType = 'Cat' | 'Dog' | 'Others';

interface SelectedImage {
  uri: string;
  type: string;
  name: string;
}

interface Pet {
  id: string;
  petName: string;
  breed: string;
  sex: string;
  age: string;
  type: PetType;
  coatColor : string;
  description:string;
  adoptionCenter: string;
  imageUrl: string;
  imagesList : string[];
}

type RootStackParamList = {
    Adoption: undefined;
    "../adoption/edit_adoption": {    
        id: string; 
     };
  };
  

type SecondScreenRouteProp = RouteProp<RootStackParamList, "../adoption/edit_adoption">;
interface Props {
    route: SecondScreenRouteProp;
}

  
const EditAdoptionPet: React.FC = () => {
    const route = useRoute<SecondScreenRouteProp>();
    const {id} = route.params;

    const [pet, setPet] = useState<Pet>();
    const [petName, setName] = useState('');
    const [petbreed, setBreed] = useState('');
    const [petsex, setSex] = useState<'Male' | 'Female' | null>('');
    const [petage, setAge] = useState('');
    const [pettype, setType] = useState<'Cat' | 'Dog' | 'Others' | null>('');
    const [petdescription, setDes] = useState('');
    const [petcoatColor, setCoatColor] = useState('');
    const [petimages, setImages] = useState<SelectedImage[]>([]);
    const navigation = useNavigation();
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [loading, setLoading] = useState(true);  // New loading state
    const userId = auth.currentUser?.uid;

    useEffect(() => {
      navigation.setOptions({
        title: "Edit Adoption",
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
        
        setImages((prevImages) => [...prevImages, ...selectedImages]);
      }
    };
  
    function base64ToDataUri(base64: string, mimeType: string): string {
      return `data:${mimeType};base64,${base64}`;
    }

    const removeImage = (uri: string) => {
      setImages((prevImages) => prevImages.filter((image) => image.uri !== uri));
    };
   
    useEffect(() => {
      // Fetch users on component load
      console.log(id)
      const fetchUsers = async () => {
        setLoading(true);  // Start loading

          try {
              const response = await fetch('http://10.91.144.154:8080/api/adoption/getIndAdoption/'+id);
              if (!response.ok) {
                  throw new Error('Network response was not ok ' + response.statusText);
              }
              const adp: Pet = await response.json();
              setPet(adp)
              //console.log(adp);
           
        
                // Set the article details using updatedArticle
              setName(adp.petName);
              setBreed(adp.breed);
              setSex(adp.sex);
              setAge(adp.age);
              setType(adp.type);
              setDes(adp.description);
              setCoatColor(adp.coatColor);
              /*
              const trimmedImagesList = adp.imagesList.map((image: string) =>({
                uri: base64ToDataUri(image,'image/jpeg'),
                type: 'image/jpeg',
                name: base64ToDataUri(image,'image/jpeg').split('/').pop() || `image_${Date.now()}.jpg`,
              }));
              */
              const trimmedImagesList = adp.imagesList.map((image: string) => {
                const imageUri = image.startsWith("data:image")
                  ? image
                  : `${image.trim()}`;
              
                return {
                  uri: imageUri,
                  type: "image/png",
                  name: imageUri.split("/").pop() || `image_${Date.now()}.png`,
                };

              });
              setImages(trimmedImagesList)
              console.log(petimages[0].type)
              setLoading(false);  // Stop loading on error

          } catch (error) {
              console.error('Fetch error:', error);
              setLoading(false);  // Stop loading on error

          }
      };
  
      fetchUsers();
  }, []); // Empty dependency array ensures this runs once when the component mounts

  if (loading) {
    return <LoadingScreen />;  // Display loading screen while fetching data
}
    const handleSubmit = async () => {

      if (!petName || !petbreed || !petsex || !petage || !pettype || !petimages) {
        Alert.alert(
          "Error",
          "Please fill in all the fields and upload a image."
        );
        return;
      }

      const formData = new FormData();
      
      formData.append('petName', petName);
      formData.append('breed', petbreed);
      formData.append('sex', petsex);
      formData.append('age', petage); // Convert date to ISO string
      formData.append('type', pettype);
      formData.append('coatColor', petcoatColor);
      formData.append('description', petdescription);
      formData.append('ownerId', userId);

      //console.log(petimages)
      const imagePromises = petimages.map(async (image) => {
        if (image.uri) {
          const filename = image.uri.split('/').pop(); // Get the file name
          const name = filename.replace(/[^\w.-]/g, '_')
          const match = /\.(\w+)$/.exec(filename);
          //const types = match ? `image/${match[1]}` : 'image'; // Get the file type
          console.log(filename)
          try {
            console.log(`Appending file: ${image.name}, Type: ${image.type}`);
            //const fileUri = Platform.OS === 'android' ? image.uri : image.uri.replace('file://', '');
            //console.log(fileUri)
            formData.append('images', {
              uri: image.uri,
              name: name,
              type: image.type,
            });
          } catch (error) {
            console.error("Error fetching image:", error);
          }

        }
      });
      //console.log(formData)
    
      // Wait for all images to be processed
      await Promise.all(imagePromises);


      //console.log(formData)
      // Wait for all images to be processed
      //await Promise.all(imagePromises);
      console.log(formData.getAll('images').length)
          

      try{
        setLoading(true); // Start loading

        const response = await fetch(
          `http://10.91.144.154:8080/api/adoption/editAdoption/${id}`,{
          method: "PUT",
          body: formData,
                  }
        );
        //const result = await response.text

        console.log(response.status)

        
          Alert.alert("Success", "Pet adoption updated successfully!", [
            {
              text: "OK",
              onPress: () =>
                navigation.navigate("adoption", {refresh: true,}),
            },
          ]);
  
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
    };
  
  
    return (
        
      <ScrollView style={[{backgroundColor:'#fff'}]}>
      <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.petsScrollContainer}
      >

  {petimages.length > 0 && (
        <FlatList
          data={petimages}
          keyExtractor={(item) => item.uri}
          horizontal
          renderItem={({ item }) => (
            <View style={styles.imageContainer}>
              <Image source={{ uri:item.uri }} style={styles.image} />
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
              value={petbreed}
              placeholder="Breed*"
              onChangeText={setBreed}
            />
          </View>
          <View style={styles.row}>

          <TextInput
            style={styles.input}
            value={petage}
            placeholder="Age"
            onChangeText={setAge}
          />
          <TextInput
            style={styles.input}
            placeholder="Color"
            value={petcoatColor}
            onChangeText={setCoatColor}
          />
          </View>
          {/* Dropdown */}
          <View style={styles.row}>
          <Text style={styles.label}>Gender*</Text>
          <TouchableOpacity
            style={[
              styles.genderButton,
              petsex === 'Male' ? styles.genderSelected : null
            ]}
            onPress={() => setSex('Male')}
          >
            <Text style={styles.genderText}>♂ M</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderButton,
              petsex === 'Female' ? styles.genderSelected : null
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
              pettype === 'Cat' ? styles.typeSelected : null
            ]}
            onPress={() => setType('Cat')}
          >
            <Text style={styles.typeText}>🐱 Cat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              pettype === 'Dog' ? styles.typeSelected : null
            ]}
            onPress={() => setType('Dog')}
          >
            <Text style={styles.typeText}>🐶 Dog</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              pettype === 'Others' ? styles.typeSelected : null
            ]}
            onPress={() => setType('Others')}
          >
            <Text style={styles.typeText}>⋯ Others</Text>
          </TouchableOpacity>
        </View>
          <ThemedText style={styles.label}>Description</ThemedText>
          <TextInput
            style={[styles.input,styles.descriptionInput]}
            value={petdescription || " "}
            onChangeText={setDes}
            multiline
          />

          <TouchableOpacity style={styles.confirmButton} onPress={toggleDialog}>
            <ThemedText style={styles.confirmButtonText}>Update</ThemedText>
            <CustomModal
                visible={isDialogVisible}
                onClose={() => setIsDialogVisible(false)}
                onConfirm={handleSubmit} // Call delete on confirmation
                title="Update this adoption?"
                message="Please confirm that you want to update pet information."
                confirmText="Yes"
                cancelText="No"
              />
          </TouchableOpacity>
        </View>
      </ScrollView>
  
    );
  };
  
  
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
      backgroundColor: '#fff',
    },
    petsScrollContainer: {
      flexDirection: "row",
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
  
  
export default EditAdoptionPet;
