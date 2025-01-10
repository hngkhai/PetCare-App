import React, {
  useLayoutEffect,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Modal,
  Animated,
  ActivityIndicator,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useIsFocused,
  useFocusEffect,
} from "@react-navigation/native";
import axios from "axios";
import Icon from "react-native-vector-icons/Ionicons";
import { CustomModal } from "@/components/CustomModal";
import categoriesData from "@/constants/ArticleCategories";
import { auth } from "../../firebase";

const GetSelectedArticle = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { articleId } = route.params;
  const isFocused = useIsFocused();
  const userId = auth.currentUser?.uid;

  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  // State to control header visibility
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchArticle = async () => {
    try {
      setLoading(true); // Start loading before fetching data
      const response = await axios.get(
        `http://10.91.144.154:8080/api/article/getArticleByArticleId/${articleId}`
      );

      const fetchedArticles = response.data;

      // Check if fetchedArticles is indeed an object
      if (fetchedArticles && typeof fetchedArticles === "object") {
        const updatedArticle = {
          ...fetchedArticles,
          thumbnailImage: fetchedArticles.thumbnailImage.startsWith(
            "data:image"
          )
            ? fetchedArticles.thumbnailImage
            : `${fetchedArticles.thumbnailImage.trim()}`,
          poster: {
            ...fetchedArticles.poster,
            profilePicUrl: fetchedArticles.poster.profilePicUrl.startsWith("data:image")
              ? fetchedArticles.poster.profilePicUrl
              : `${fetchedArticles.poster.profilePicUrl.trim()}`,
          },
        };
        setArticle(updatedArticle);
      }
    } catch (error) {
      console.error("Error fetching article:", error);
      alert("Failed to load article. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEllipsisPress = () => {
    setModalVisible(true);
  };

  const handleDeletePress = () => {
    setModalVisible(false);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await axios.delete(
        `http://10.91.144.154:8080/api/article/deleteArticle/${articleId}`
      );
      if (response.status === 200) {
        console.log("Article deleted successfully");
        setDeleteModalVisible(false);
        navigation.navigate("articles/browsePosted", {
          deletedArticleId: articleId, // Pass the deleted article ID
        });
        // navigation.goBack(); // Navigate back to the previous screen
      } else {
        alert("Failed to delete the article. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("An error occurred while trying to delete the article.");
    }
  };

  // Interpolate the opacity based on scrollY
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100], // Adjust the range as needed
    outputRange: [1, 0], // Fade from visible (1) to invisible (0)
    extrapolate: "clamp",
  });

  // Handle fetching the article whenever the screen is focused (including after edits)
  useFocusEffect(
    useCallback(() => {
      if (isFocused || route.params?.refresh) {
        fetchArticle();
      }
    }, [isFocused, route.params?.refresh])
  );

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerTransparent: true,
      headerStyle: {
        backgroundColor: "transparent",
      },
      headerTintColor: "#fff",
      headerLeft: () => (
        <Animated.View style={{ opacity: headerOpacity }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.headerButton,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </Pressable>
        </Animated.View>
      ),
      headerRight: () =>
        // Only show ellipsis if the userId matches the article poster's id
        userId === article?.poster?.id ? (
          <Animated.View style={{ opacity: headerOpacity }}>
            <Pressable
              onPress={handleEllipsisPress}
              style={({ pressed }) => [
                styles.headerButton,
                { opacity: pressed ? 0.5 : 1 },
              ]}
            >
              <Icon name="ellipsis-vertical" size={24} color="#fff" />
            </Pressable>
          </Animated.View>
        ) : null,
    });
  }, [navigation, headerOpacity, userId, article]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA04A" />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.container}>
        <Text>No article data available.</Text>
      </View>
    );
  }

  // Find the category for the article
  const category = categoriesData.find(
    (cat) => cat.value === article.articleCategory
  );

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: article.thumbnailImage }}
            style={styles.thumbnail}
            resizeMode="cover"
          />

          <View style={styles.imageContainer}>
            <Image source={article.thumbnail} style={styles.thumbnail} />
            <View style={styles.overlay} />

            {/* Category Image and Label */}
            {category && (
              <View style={styles.categoryContainer}>
                <Image
                  source={category.labelImage}
                  style={styles.categoryImage}
                />
                <Text style={styles.categoryButtonText}>{category.label}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{article.articleTitle || "Untitled"}</Text>
          <Text style={styles.content}>
            {article.articleBody || "No content available."}
          </Text>
          <View style={styles.footer}>
            <View style={styles.dateAuthorContainer}>
              <Image
                source={{
                  uri:
                    article.poster?.profilePicUrl ||
                    "fallback_profile_image_url",
                }} // Add a fallback image URL here
                style={styles.authorImage}
              />
              <View style={styles.dateContainer}>
                <Text style={styles.publishedDate}>
                  PUBLISHED ON{" "}
                  {article.publishedTime
                    ? new Date(article.publishedTime).toLocaleDateString()
                    : "Unknown"}
                </Text>
                <Text style={styles.author}>
                  By {article.poster?.userName?.toUpperCase() || "Unknown"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Pressable
              onPress={() => {
                setModalVisible(false);
                navigation.navigate("articles/editArticle", {
                  articleId: articleId,
                });
              }}
            >
              <Text style={styles.modalOption}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setModalVisible(false);
                setDeleteModalVisible(true);
              }}
            >
              <Text style={styles.modalOption}>Delete</Text>
            </Pressable>
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete} // Call delete on confirmation
        title="Delete this Article?"
        message="Please confirm that you want to delete this article. Note that this change is irreversible."
        confirmText="Yes"
        cancelText="No"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerButton: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    height: 250,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: 0,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: 300,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalOption: {
    fontSize: 18,
    marginVertical: 10,
  },
  closeButton: {
    fontSize: 16,
    color: "red",
    marginTop: 20,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: 80,
    right: 20,
    backgroundColor: "#8675E6",
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryButtonText: {
    fontSize: 13,
    color: "#fff",
  },
  categoryImage: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#FFAB5F",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 25,
    marginTop: -60,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  footer: {
    borderColor: "#ccc",
    paddingTop: 10,
  },
  dateAuthorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateContainer: {
    flex: 1,
  },
  publishedDate: {
    fontSize: 14,
    color: "#666",
  },
  author: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
});

export default GetSelectedArticle;
