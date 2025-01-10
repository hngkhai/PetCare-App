import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity,Image, Dimensions, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';
import AdoptCard from '../adoption/adopt_info_modal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import LoadingScreen from '../../components/LoadingScreen';
import axios from 'axios';
import { auth } from '@/firebase';


type PetType = 'Cat' | 'Dog' | 'Others';

interface Pet {
  id: string;
  petName: string;
  breed: string;
  sex: string;
  age: string;
  type: PetType;
  coatColor : string;
  description:string;
  adptName: string;
  adptNumber: string;
  adptEmail:string;
  petImageUrl: string;
  imagesList : string[];

}

type RootStackParamList = {
  Adoption: undefined;
  "adoption/edit_adoption": { 
    id: string;
  };
};

type FirstScreenNavigationProp = StackNavigationProp<RootStackParamList,"adoption/edit_adoption">;

interface Props {
  navigation: FirstScreenNavigationProp;
}



/*
const petsData: Pet[] = [
  {
    id: 1,
    name: 'Candie',
    breed: 'Cross-Breed',
    sex: 'Female',
    age: '10 months',
    type: 'Dog',
    adoptionCenter: 'SPCA Adoption Center',
    imageUrl: '/images/candie.jpg', // Replace with real image URL
  }
];*/

const Adoption: React.FC = () => {
  const [filter, setFilter] = useState<PetType | 'ALL'>('ALL');
  const [pets, setPets] = useState<Pet[]>([]);
  const [isPetInfoModalVisible, setIsPetInfoModalVisible] = useState(false);
  const [selectedPet, setSelectedPet] = useState<any>({});
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [images, setImages] = useState<string[]>([]); // Initialize as an empty array
  const [selectedTab, setSelectedTab] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Set this based on user role
  const [adpName, setAdpName] = useState<string>(""); // Set this based on user role

  //const userId = "YBHenmlgklzvRYqQCWOc";
  const userId = auth.currentUser?.uid;

  //Added
  const navigation = useNavigation();
 
  useLayoutEffect(() => {
    navigation.setOptions({ title: "Adoption Center" });
  }, [navigation]);

 // Function to fetch user data and determine admin status
 const fetchUserRole = async () => {
  try {
    console.log("fetching user data: " + userId);
    const response = await axios.get(
      `http://10.91.144.154:8080/api/auth/getUserByUserId/${userId}`
    );
    const userData = response.data;
    console.log(userData.status)
    // Assuming the user role is stored in userData.role
    setIsAdmin(userData.status === 'admin');
    setAdpName(userData.userName)
  } catch (error) {
    console.error("Error fetching user data: ", error);
    Alert.alert("Error", "Failed to fetch user data.");
  }
};

useEffect(() => {
  // Call the function to fetch user role on component mount
  if (userId) {
    fetchUserRole();
  }
}, [userId]);

  const toggleDialog = () => {
      setIsDialogVisible(!isDialogVisible);
    };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers(); // Refresh the data
    // Simulate a network request and refresh after 2 seconds
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);
    
  const handleOpenPetInfoModal = (pet:Pet) => {
    setSelectedPet(pet);
    setImages(pet.imagesList)
    //console.log(images)
    setIsPetInfoModalVisible(true);
  };

  const handleClosePetInfoModal = () => {
    setIsPetInfoModalVisible(false);
  };


const handleDelete = async (petId:String) => {
  
  try{
    const response = await fetch("http://10.91.144.154:8080/api/adoption/deleteAdoption/"+petId, {
    method: "DELETE",
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE",
        "Content-Type": "application/json",
    },
  }); 
    
    const result = await response.text
    
    Alert.alert("Success", "Pet adoption deleted successfully!", [
      {
        text: "OK",
        onPress: async () => {
          setIsDialogVisible(false);
          await fetchUsers(); // Refresh the list after deletion
        }
      },
    ]);
    console.log("Success:",result)
  }catch(error){
    console.error("Error:", error);
  }    
  
};

const fetchUsers = async () => {
    setIsLoading(true);
      try {
          //Need change according to loc
          const response = await fetch('http://10.91.144.154:8080/api/adoption/getAllAdoption');
          if (!response.ok) {
              throw new Error('Network response was not ok ' + response.statusText);
          }
          const users: Pet[] = await response.json();
          
        
          /*
          users.forEach(user => {
            console.log(`Pet Owner : ${user.petImageUrl}`);
          }); */

            setPets(users)
          
          //console.log(users);
      } catch (error) {
          console.error('Fetch error:', error);
      }finally {
        setIsLoading(false);
      }
  };


  useFocusEffect(
    React.useCallback(()=>{
    // Fetch users on component load
    fetchUsers();
}, [])
); // Empty dependency array ensures this runs once when the component mounts

const handleFilterChange = (type: PetType | 'ALL') => {
    setFilter(type);
  };

  const filteredPets = filter === 'ALL' ? pets : pets.filter((pet) => pet.type === filter);
  

  return (
    <View  style={{ flex: 1,marginTop:25 }}>
       {isLoading ? ( // Show loading spinner when fetching data
        /*
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA04A" />
        </View>*/
        <LoadingScreen />

      ) : (
    <ScrollView style={styles.scrollViewContainer} 
    refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
  <ThemedView style={styles.titleContainer}>
      </ThemedView>
      <View style={styles.container}>
      {/* Add your list or grid of adoptable pets here */}
      <View >
      <View style={styles.row}>
        <TouchableOpacity onPress={() => handleFilterChange('ALL')} style={[styles.button, filter === 'ALL' && styles.selected]}>
         <Text> ALL</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleFilterChange('Cat')} style={[styles.button, filter === 'Cat' && styles.selected]}>
         <Text>🐱 Cat</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleFilterChange('Dog')} style={[styles.button, filter === 'Dog' && styles.selected]}>
         <Text>🐶  Dog</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleFilterChange('Others')} style={[styles.button, filter === 'Others' && styles.selected]}>
         <Text>⋯ Others</Text> 
        </TouchableOpacity>
      </View>
      
      <View style={{paddingBottom: 65 }}>
        {filteredPets.map((pet) => (
          <TouchableOpacity key={pet.id} onPress={() => handleOpenPetInfoModal(pet)}>
          <View style={styles.petCard}>
          <Image source={{ uri: `${pet.imagesList[0]}` }} style={styles.petImage} />
          <View style={styles.petDetails}>
              <View style={styles.row}>
              <Image
              source={{ uri: pet.petImageUrl }}
              style={{ width: 40, height: 40, borderRadius: 50, }}
              resizeMode="contain"
            />
              <Text style={[styles.petTitle, { marginLeft: 20 }]}>{pet.adptName}</Text>

              </View>
              <View style={[styles.lineStyle,{margin:10}]}/>
              <Text style={styles.petTitle}>{pet.petName}</Text>
              <Text style={styles.petInfo}>Breed: {pet.breed}</Text>
              <Text style={styles.petInfo}>Gender: {pet.sex}</Text>
              <Text style={styles.petInfo}>Age: {pet.age}</Text>
            
              </View>

             {/* {isAdmin && ( // Only show if the user is an admin

              <View style={[{marginTop:50}]}>
              <TouchableOpacity style={styles.actionButton} onPress={toggleDialog}>
                <Image
                    source={require('../../assets/images/delete-icon.png')} // Use your actual icon path here
                    style={styles.deleteIcon}
                />
                <CustomModal
                visible={isDialogVisible}
                onClose={() => setIsDialogVisible(false)}
                onConfirm={() => handleDelete(pet.id)} // Call delete on confirmation
                title="Delete this adoption?"
                message="Please confirm that you want to delete pet. Note that this change is irreversible."
                confirmText="Yes"
                cancelText="No"
              />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('adoption/edit_adoption', { id:pet.id })} style={styles.actionButton}>
                <Image
                    source={require('../../assets/images/edit-icon.png')} // Use your actual icon path here
                    style={styles.editIcon}
                />
              </TouchableOpacity>
              </View>
             )}*/} 
          </View>
       </TouchableOpacity>
       
       ))}
      </View>
    </View>
    <AdoptCard
          visible={isPetInfoModalVisible}
          onClose={handleClosePetInfoModal}
          name= {selectedPet.petName}
          breed={selectedPet.breed}
          sex={selectedPet.sex}
          type={selectedPet.type}
          age={selectedPet.age}
          coatColor={selectedPet.coatColor}
          description={selectedPet.description}
          adptName={selectedPet.adptName}
          adptNumber={selectedPet.adptNumber}
          adptEmail={selectedPet.adptEmail}
          imageUrl={images}
            />
    </View>
    </ScrollView>
      )}
    {/*ICON*/}    
    {isAdmin && ( // Only show if the user is an admin
    <View style={styles.addPetIconContainer}>
       <TouchableOpacity
      onPress={() => navigation.navigate("adoption/add_adoption")} >
        <Image
              source={require("../../assets/images/plus_icon.png")}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
        </TouchableOpacity>
    </View>        
    )}


    {/*Toggle for Adopion center*/}
    
    {isAdmin && ( // Only show if the user is an admin*/

    <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "ALL" && styles.activeTab]}
          onPress={() => {
            navigation.navigate("adoption", {
              selectedTab: "ALL",
            });
          }}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "ALL"
                ? styles.activeTabText
                : styles.inactiveTabText,
            ]}
          >
            General
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "POSTED" && styles.activeTab,
          ]}
          onPress={() => {
            navigation.navigate("adoption/adoptionAdmin", {
              selectedTab: "POSTED",
              adpName: adpName, // Pass the adpName variable here


            });
          }}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "POSTED"
                ? styles.activeTabText
                : styles.inactiveTabText,
            ]}
          >
          {adpName.length > 15 ? `${adpName.substring(0, 6)}...` : adpName}
          </Text>
        </TouchableOpacity>
      </View>
    )}

  </View>
    
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lineStyle:{
    borderWidth: 2,
    borderColor:'#ff6600',
},
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: Dimensions.get("window").width*0.2, // Ensures there's space at the bottom of the scroll view
    backgroundColor: "white",
    
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginTop: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  titleContainer: {
    marginTop: 40,
    backgroundColor: "white",
  },
  selected: {
    backgroundColor: 'coral',
    borderWidth: 0,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'space-between',
    flex: 1,
    paddingHorizontal: 10,
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: 'oldlace',
    alignSelf: 'flex-start',
    marginHorizontal: '1%',
    marginBottom: 6,
    minWidth: Dimensions.get("window").width*0.21,
    textAlign: 'center',
  },
  actionButton: {
    marginRight: 20,
    justifyContent : 'center'
  },
deleteIcon: {
  marginTop : 60,
  width: 24,
  height: 24,
},
editIcon: {
  marginTop : 10,

  width: 22,
  height: 22,
},
  container: {
    marginTop : 10,

  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addPetIconContainer: {
  position: 'absolute',     // Absolutely position the button
  bottom: Dimensions.get("window").height * 0.15,               // Distance from the bottom of the screen
  right: 20,                // Distance from the right side of the screen
  alignItems: 'center',     // Center the content inside the button
  justifyContent: 'center',
  width: 50,                // Adjust the width of the button
  height: 50,               // Adjust the height of the button
  borderRadius: 30,         // Make it circular
  backgroundColor: '#ff6600', // Background color of the button
  borderColor: '#A0A0A0',   // Border color
  borderWidth: 2,           // Border width
  shadowColor: '#000',      // Shadow effect for depth
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
  elevation: 4,             // For Android shadow effect
  },

  petList: {
    flexDirection: 'column',
    gap: 20,
  },
  petCard: {
     borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    margin: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  petImage: {
    width: '100%',
    height: 150, // Adjust based on your image aspect ratio
    resizeMode: 'cover',
  },
  petDetails: {
    marginLeft:5,
    padding: 5,
    flexGrow: 1,
  },
  petTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  petInfo: {
    marginVertical: 5,
    color: '#666',
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Dimensions.get("window").height * 0.075,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: "white",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 25,
    elevation: 5,
  },
  tabButton: {
    padding: 10,
    width: Dimensions.get("window").width * 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  activeTab: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: "#ff6600",
  },
  inactiveTabText: {
    color: "#333",
  },
  activeTabText: {
    color: "white",
  },
  
});

export default Adoption;
