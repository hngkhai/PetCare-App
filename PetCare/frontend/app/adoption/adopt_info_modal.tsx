import{ FC, useEffect, useState } from 'react';
import React from 'react';

import { View, Text, StyleSheet, Image, Modal, TouchableOpacity, Button, ImageBackground, FlatList, Dimensions, Linking, Alert } from 'react-native';
import DialogBox from './dialog';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { CustomModal } from "@/components/CustomModal";

interface PetCardProps {
    visible: boolean;
    onClose: () => void;
    name: string;
    breed: string;
    sex: string;
    age: string;
    type: string;
    coatColor: string;
    description: string;
    adptName: string,
    adptNumber:string,
    adptEmail:string,
    imageUrl: string[];
}


const AdoptCard = ({
    visible,
    onClose,
    name,
    breed,
    sex,
    age,
    type,
    coatColor,
    description,
    adptName,
    adptNumber,
    adptEmail,
    imageUrl,

    
}: PetCardProps): React.JSX.Element => {
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [images, setImages] = useState<string[]>([]); // Initialize as an empty array
    const [activeIndex, setActiveIndex] = useState(0);
    const screenWidth = Dimensions.get("window").width;
    //const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');
    
  useEffect(() => {
    //setImages(imageUrl);
  }, []);
   
  const toggleDialog = () => {
    //console.log("hi"+imageUrl)
      setIsDialogVisible(!isDialogVisible);
  };

  const sendWhatsAppMessage = (name:String ,phoneNumber:String) => {
    const formattedNumber = phoneNumber.replace('+', '').replace(/\s+/g, ''); // Format phone number
    const message = `Hello,I would like to arrange an appointment to see ${name}`;  // Craft dynamic message with multiple parameters
    const url = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Error', 'WhatsApp is not installed on your device');
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.error('Error in opening WhatsApp: ', err));
  };
  
  
  const renderItemImages = ({ item }: { item: string }) => (
      <ImageBackground
        source={{ uri: `${item}`}} 
        style={styles.articleCard}
        imageStyle={styles.articleImage}
      >
        {/* Linear gradient overlay */}
        <LinearGradient
          colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 1)"]}
          start={[0, 0]}
          end={[0, 1]}
          style={styles.gradientOverlay} // Apply gradient style
        >
        </LinearGradient>
      </ImageBackground>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
            <View style={styles.card}>
            <FlatList
            data={imageUrl}
            renderItem={renderItemImages}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToAlignment="center"
            decelerationRate="fast"
            snapToInterval={screenWidth} // Snap to full screen width for one card at a time
            onMomentumScrollEnd={(event) => {
              const index = Math.floor(
                event.nativeEvent.contentOffset.x / screenWidth
              );
              setActiveIndex(index);
            }}
            pagingEnabled
            style={styles.carousel} // Add this style for responsiveness
          />
          <View style={styles.indicatorContainer}>
            {imageUrl.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  activeIndex === index
                    ? styles.activeIndicator
                    : styles.inactiveIndicator,
                ]}
              />
            ))}
          </View>
                

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeText}>×</Text>
                    </TouchableOpacity>
                    <View style={styles.nameAndActions}>
                        <Text style={styles.petName}>{name}</Text>
                    
                    </View>
                    <View style={styles.detailsContainer}>
                        <Text style={styles.detailText}><Text style={styles.boldText}>Breed      : </Text>{breed}</Text>
                        <Text style={styles.detailText}><Text style={styles.boldText}>Sex        : </Text>{sex}</Text>
                        <Text style={styles.detailText}><Text style={styles.boldText}>Age        : </Text>{age}</Text>
                        <Text style={styles.detailText}><Text style={styles.boldText}>Type       : </Text>{type}</Text>
                        <Text style={styles.detailText}><Text style={styles.boldText}>Coat Color : </Text>{coatColor}</Text>
                        <Text style={styles.detailText}><Text style={styles.boldText}>Description: </Text>{description}</Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Button color="#FF7F50" title="Book Appointment" onPress={() => sendWhatsAppMessage(name, adptNumber)}  />
                    </View>
                    {/*
                    <DialogBox
                        visible={isDialogVisible}
                        title="Comfirmation"
                        message="Please comfirm that you want to adopt this pet"
                        onClose={toggleDialog}/>*/}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    indicatorContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 10,
      },
      indicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
      },
      activeIndicator: {
        backgroundColor: "#8675E6",
        width: 20,
        borderRadius: 5,
      },
      inactiveIndicator: {
        backgroundColor: "#D3D3D3",
      },
    carousel: {
        width: '100%',
      },
 
    articleCard: {
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height * 0.4,
        alignItems: "center",
        justifyContent: "center",
    },
      articleImage: {
        width: "100%",
        height: "100%",
        borderRadius: 15,
      },
      gradientOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "flex-end",
        padding: 20,
        borderRadius: 15,
      },
      
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#FF9F43',
        borderRadius: 15,
        width: 300,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 7,
        right: 15,
    },
    closeText: {
        fontSize: 28,
        color:'white'
    },
    deleteIcon: {
        width: 24,
        height: 24,
    },
    editIcon: {
        width: 22,
        height: 22,
    },
    nameAndActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    petImage: {
        width: '100%',
        height: 180,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },    
    petName: {
        fontSize: 22,
        fontWeight: 'bold',
        paddingTop: 5,
        paddingLeft: 20,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    actionButton: {
        marginRight: 20,
    },
    buttonText: {
        fontSize: 20,
        color: '#fff',
    },
    detailsContainer: {
        margin: 20,
    },
    detailText: {
        textAlign: 'left',
        marginBottom: 10,
    },
    boldText: {
        fontWeight: 'bold',
    },
    buttonContainer: {
        padding: 16,
        color:"#FF9F43"
      },
});

export default AdoptCard;