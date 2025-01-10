import React, { useState, FC } from 'react';
import { View, Text, StyleSheet, Image, Modal, TouchableOpacity } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import axios from 'axios';
import { CustomModal } from "@/components/CustomModal";

interface PetCardProps {
    visible: boolean;
    onClose: () => void;
    id: number;
    petName: string;
    breed: string;
    sex: string;
    dateOfBirth: Date;
    weight: number;
    coatColor: string;
    markings: string;
    medicCondition: string;
    petImage: string;
    ownerId: string;
    petImageUrl: string;
    onPetDeleted: () => void;
}

export type RootStackParamList = {
    Home: undefined;
    "pet_information/edit_pet_form": {
        id: number;
        name: string;
        breed: string;
        sex: string;
        dob: Date;
        weight: number;
        coatColor: string;
        markings: string;
        medicCondition: string;
        ownerId: string;
        petImageUrl: string;
    };
};

type EditPetScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    "pet_information/edit_pet_form"
>;

const PetCard: FC<PetCardProps> = ({
    visible,
    onClose,
    id,
    petName,
    breed,
    sex,
    dateOfBirth,
    weight,
    coatColor,
    markings,
    medicCondition,
    petImage,
    ownerId,
    petImageUrl,
    onPetDeleted
}) => {
    const [loading, setLoading] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false); // State for Custom Modal
    const navigation = useNavigation<EditPetScreenNavigationProp>();
    const formattedDob = new Date(dateOfBirth).toLocaleDateString();

    // Handle delete logic
    const handleDelete = async () => {
        setLoading(true);
        try {
            await axios.delete(`http://10.91.144.154:8080/api/pet/deletePet/${id}`);
            setLoading(false);
            onClose(); // Close the modal
            onPetDeleted(); // Callback to refresh the list
        } catch (error) {
            setLoading(false);
            console.error("Error deleting pet profile:", error);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalContainer}>
                <View style={styles.card}>
                    <Image source={{ uri: petImage }} style={styles.petImage} />
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeText}>×</Text>
                    </TouchableOpacity>
                    <View style={styles.nameAndActions}>
                        <Text style={styles.petName}>{petName}</Text>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => setDeleteModalVisible(true)} // Open the Custom Modal
                            >
                                <Image
                                    source={require('../../assets/images/delete-icon.png')}
                                    style={styles.deleteIcon}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    onClose(); // Close the modal first
                                    navigation.navigate("pet_information/edit_pet_form", {
                                        id,
                                        name: petName,
                                        breed,
                                        sex,
                                        dob: dateOfBirth,
                                        weight,
                                        coatColor,
                                        markings,
                                        medicCondition,
                                        ownerId,
                                        petImageUrl
                                    });
                                }}
                                style={styles.actionButton}
                            >
                                <Image
                                    source={require('../../assets/images/edit-icon.png')}
                                    style={styles.editIcon}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.detailsContainer}>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Breed: </Text>{breed}
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Sex: </Text>{sex}
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>DOB: </Text>{formattedDob}
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Weight: </Text>{weight}
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Coat Color: </Text>{coatColor}
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Special Markings: </Text>{markings}
                        </Text>
                        <Text style={styles.detailText}>
                            <Text style={styles.boldText}>Medical Condition: </Text>{medicCondition}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Custom Modal for Delete Confirmation */}
            <CustomModal
                visible={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={handleDelete}
                title="Delete Pet Profile?"
                message="Please confirm that you want to delete this pet profile."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
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
});

export default PetCard;