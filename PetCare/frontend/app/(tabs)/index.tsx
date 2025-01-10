import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FlatList,
  Dimensions,
  StyleSheet,
  View,
  ImageBackground,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import PetCard from "../pet_information/pet_info_modal";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

const screenWidth = Dimensions.get("window").width;
const carouselWidth = screenWidth * 0.8;

type Article = {
  articleId: string;
  articleTitle: string;
  articleBody: string;
  articleCategory: string;
  thumbnailImage: string;
  publishedTime: string;
  poster: {
    userName: string;
    profilePicUrl: string;
  };
};

type Pet = {
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
};

type RootStackParamList = {
  Home: undefined;
  "pet_information/add_pet_form": undefined;
};

type AddPetScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "pet_information/add_pet_form"
>;

export default function HomeScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [isPetInfoModalVisible, setIsPetInfoModalVisible] = useState(false);
  const [userId, setUserId] = useState("");
  const navigation = useNavigation<AddPetScreenNavigationProp>();
  const screenWidth = Dimensions.get("window").width;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedInUser(user);
        setUserId(user.uid);
      } else {
        setLoggedInUser(null);
        setUserId("");
        navigation.navigate("auth/login");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
    //console.log("user " + userId);
  }, [userId]);

  const fetchData = async () => {
    if (!userId) {
      setIsLoadingPets(false);
      return;
    }
    setIsLoadingPets(true);
    try {
      const response = await axios.get(
        `http://10.91.144.154:8080/api/pet/getPetsByUserId/${userId}`
      );
      const fetchedPets = response.data;
      const updatedPets = fetchedPets.map((pet: Pet) => ({
        ...pet,
        petImage: pet.petImage.startsWith("data:image")
          ? pet.petImage
          : `${pet.petImage.trim()}`,
      }));

      setPets(updatedPets);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoadingPets(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchData();
      }
    }, [userId])
  );

  const handlePetDeleted = () => {
    fetchData();
  };

  const handlePetPress = (petId: number) => {
    const pet = pets.find((p) => p.id === petId);
    if (pet) {
      setSelectedPet(pet);
      setIsPetInfoModalVisible(true);
    }
  };

  const handleClosePetInfoModal = () => {
    setIsPetInfoModalVisible(false);
    setSelectedPet(null);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setIsLoadingArticles(true);

    try {
      const response = await axios.get(
        "http://10.91.144.154:8080/api/article/getAllArticles"
      );
      const fetchedArticles = response.data.slice(0, 5);
      const updatedArticles = fetchedArticles.map((article: Article) => ({
        ...article,
        poster: {
          ...article.poster,
          profilePicUrl: article.poster.profilePicUrl.startsWith("data:image")
            ? article.poster.profilePicUrl
            : `${article.poster.profilePicUrl.trim()}`,
        },
      }));
      setArticles(updatedArticles);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  useEffect(() => {
    if (articles.length > 0) {
      const interval = setInterval(() => {
        const nextIndex = (activeIndex + 1) % articles.length;
        setActiveIndex(nextIndex);
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeIndex, articles]);

  const renderArticleItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate("articles/getSelectedArticle", {
          articleId: item.articleId,
          selectedCategory: item.articleCategory,
        });
      }}
      style={{ width: carouselWidth }}
    >
      <ImageBackground
        source={{ uri: `${item.thumbnailImage}` }}
        style={styles.articleCard}
        imageStyle={styles.articleImage}
        pointerEvents="box-none"
      >
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0)",
            "rgba(0, 0, 0, 0.5)",
            "rgba(0, 0, 0, 1)",
          ]}
          start={[0, 0]}
          end={[0, 1]}
          style={styles.gradientOverlay}
          pointerEvents="box-none"
        >
          <ThemedText style={styles.articleTitle} numberOfLines={1}>
            {item.articleTitle}
          </ThemedText>
          <View style={styles.authorContainer}>
            <Image
              source={{ uri: item.poster.profilePicUrl }}
              style={styles.authorImage}
            />
            <ThemedText style={styles.articleAuthor}>
              {item.poster.userName} •{" "}
              {new Date(item.publishedTime).toLocaleDateString()}
            </ThemedText>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  if (isLoadingArticles || isLoadingPets) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA04A" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />
        <ThemedText type="title">PetCare</ThemedText>
      </View>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">My Pets</ThemedText>
      </ThemedView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.petsScrollContainer}
      >
        {pets.map((pet) => (
          <TouchableOpacity key={pet.id} onPress={() => handlePetPress(pet.id)}>
            <View style={styles.petCard}>
              <Image source={{ uri: pet.petImage }} style={styles.petImage} />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => navigation.navigate("pet_information/add_pet_form")}
          style={styles.addPetIconContainer}
        >
          <Image
            source={require("../../assets/images/plus_icon.png")}
            style={{ width: 28, height: 28, marginTop: 10 }}
          />
        </TouchableOpacity>
      </ScrollView>

      <ThemedView style={{ marginTop:  15, backgroundColor: "white" }}>
        <View style={styles.headerContainer}>
          <ThemedText type="title" style={styles.browseArticlesHeader}>
            Browse Articles
          </ThemedText>
          <TouchableOpacity
            onPress={() => navigation.navigate("articles/browseAll")}
          >
            <ThemedText style={styles.seeAll}>See All</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.articleContainer}>
          <FlatList
            ref={flatListRef}
            data={articles}
            renderItem={renderArticleItem}
            keyExtractor={(item) => item.articleId}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToAlignment="center"
            decelerationRate="fast"
            snapToInterval={carouselWidth}
            onMomentumScrollEnd={(event) => {
              const index = Math.floor(
                event.nativeEvent.contentOffset.x / carouselWidth
              );
              setActiveIndex(index);
            }}
            pagingEnabled
            style={styles.carousel}
          />
          <View style={styles.indicatorContainer}>
            {articles.map((_, index) => (
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
        </View>
      </ThemedView>

      <View style={styles.chatbotContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate("chatbot/chatbot")}
          style={styles.chatbotIcon}
        >
          <Image
            source={require("../../assets/images/floatingChatbotIcon.png")}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {selectedPet && (
        <PetCard
          visible={isPetInfoModalVisible}
          onClose={handleClosePetInfoModal}
          id={selectedPet.id}
          petName={selectedPet.petName}
          breed={selectedPet.breed}
          sex={selectedPet.sex}
          dateOfBirth={selectedPet.dateOfBirth}
          weight={selectedPet.weight}
          coatColor={selectedPet.coatColor}
          markings={selectedPet.markings}
          medicCondition={selectedPet.medicCondition}
          petImage={selectedPet.petImage}
          ownerId={selectedPet.ownerId}
          petImageUrl={selectedPet.petImageUrl}
          onPetDeleted={handlePetDeleted}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: 100,
    backgroundColor: "white",
    paddingHorizontal: 16,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginTop: 30,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  titleContainer: {
    margin: 16,
    backgroundColor: "white",
  },
  petsScrollContainer: {
    flexDirection: "row",
    gap: 16,
  },
  petCard: {
    alignItems: "center",
    justifyContent: "center",
    width: 130,
    height: 130,
    borderRadius: 70,
    backgroundColor: "white",
  },
  petImage: {
    width: "100%",
    height: "100%",
    borderRadius: 70,
  },
  addPetIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 130,
    height: 130,
    borderRadius: 70,
    backgroundColor: "white",
    borderColor: "#A0A0A0",
    borderWidth: 2,
    marginLeft: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  browseArticlesHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  carousel: {
    width: carouselWidth,
  },
  articleContainer: {
    width: carouselWidth,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    alignSelf: "center", 
  },
  articleCard: {
    width: carouselWidth,
    height: Dimensions.get("window").height * 0.26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15
  },
  articleImage: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
  },
  articleAuthor: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFF",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  authorImage: {
    width: 25,
    height: 25,
    borderRadius: 15,
    marginRight: 10,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    padding: 20,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
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
    backgroundColor: "#FF7F50",
    width: 20,
    borderRadius: 5,
  },
  inactiveIndicator: {
    backgroundColor: "#D3D3D3",
  },
  seeAll: {
    color: "#927EEC",
    fontSize: 15,
    textAlign: "right",
    fontWeight: "bold",
  },
  chatbotIcon: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "white",
    borderRadius: 25,
    padding: 5,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  chatbotContainer: {
    position: "absolute",
    bottom: 20,
    right: 0,
    borderRadius: 10,
    elevation: 5,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});