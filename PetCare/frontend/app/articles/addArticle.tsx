import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { auth } from "../../firebase";

export default function AddArticle() {
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Add loading state

  const navigation = useNavigation();
  const userId = auth.currentUser?.uid;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Add Article",
    });
  }, [navigation]);

  const categories = [
    {
      labelImage: require("../../assets/images/article_cat_grooming.png"),
      label: "Grooming",
      value: "grooming",
    },
    {
      labelImage: require("../../assets/images/article_cat_lifestyle.png"),
      label: "Lifestyle",
      value: "lifestyle",
    },
    {
      labelImage: require("../../assets/images/article_cat_community.png"),
      label: "Community",
      value: "community",
    },
    {
      labelImage: require("../../assets/images/article_cat_health.png"),
      label: "Health & Wellness",
      value: "health_wellness",
    },
    {
      labelImage: require("../../assets/images/article_cat_others.png"),
      label: "Others",
      value: "others",
    },
  ];

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
  };

  const handleThumbnailUpload = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (pickerResult.canceled) {
      return;
    }

    setThumbnailUri(pickerResult.assets[0].uri);
  };

  const handleSubmit = async () => {
    setLoading(true);

    // Validation for title (maximum of 20 words)
    const titleWordCount = title.trim().split(/\s+/).length;
    if (titleWordCount > 20) {
      Alert.alert("Error", "Title must not exceed 20 words.");
      setLoading(false);
      return;
    }

    // Validation for body text (minimum of 500 characters)
    if (bodyText.length < 500) {
      Alert.alert("Error", "Body text must be at least 500 characters.");
      setLoading(false);
      return;
    }

    if (!title || !bodyText || !selectedCategory || !thumbnailUri) {
      Alert.alert(
        "Error",
        "Please fill in all the fields and upload a thumbnail."
      );
      setLoading(false);
      return;
    }

    // Create the FormData for the request
    const formData = new FormData();
    formData.append("articleTitle", title);
    formData.append("articleBody", bodyText);
    formData.append("articleCategory", selectedCategory);
    formData.append("publishedTime", new Date().toISOString());
    formData.append("posterId", userId); // Replace with actual poster ID

    // Append the selected thumbnail as a file
    const filename = thumbnailUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append("thumbnailImage", {
      uri: thumbnailUri,
      name: filename,
      type: type,
    });

    try {
      const response = await axios.post(
        "http://10.91.144.154:8080/api/article/addArticle",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        Alert.alert("Success", "Article submitted successfully!");
        // Reset form fields after success
        setTitle("");
        setBodyText("");
        setSelectedCategory(null);
        setThumbnailUri(null);
        navigation.navigate("articles/browsePosted", { selectedTab: "POSTED" });
      } else {
        Alert.alert("Error", "Failed to submit the article. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting article:", error);
      Alert.alert(
        "Error",
        "An error occurred while submitting the article. Please try again."
      );
    } finally {
      // Stop loading
      setLoading(false);
    }
  };

  // If loading, show a loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA04A" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.label}>
        Article Thumbnail
        <Text style={styles.requiredAsterisk}>*</Text>
      </Text>
      <TouchableOpacity
        style={styles.thumbnailContainer}
        onPress={handleThumbnailUpload}
      >
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} style={styles.thumbnailImage} />
        ) : (
          <Image
            source={require("../../assets/images/default_image.png")}
            style={{
              width: 150,
              height: 150,
            }}
          />
        )}
      </TouchableOpacity>
      <Text style={styles.label}>
        Title
        <Text style={styles.requiredAsterisk}>*</Text>
      </Text>
      <LinearGradient
        colors={["#FFA04A", "#FF7802"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Enter title (max 20 words)"
            value={title}
            onChangeText={setTitle}
          />
        </View>
      </LinearGradient>
      <Text style={styles.label}>
        Body Text
        <Text style={styles.requiredAsterisk}>*</Text>
      </Text>
      <LinearGradient
        colors={["#FFA04A", "#FF7802"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Write your article here..."
            value={bodyText}
            onChangeText={setBodyText}
            multiline
            numberOfLines={6}
          />
        </View>
      </LinearGradient>
      <Text style={styles.label}>
        Category
        <Text style={styles.requiredAsterisk}>*</Text>
      </Text>
      <View style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.categoryButton,
              selectedCategory === category.value &&
                styles.selectedCategoryButton,
            ]}
            onPress={() => handleCategoryPress(category.value)}
          >
            <Image source={category.labelImage} style={styles.categoryImage} />
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category.value,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ alignItems: "center" }}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleSubmit}>
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingHorizontal: 30,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: "red",
  },
  gradientBorder: {
    borderRadius: 8,
    padding: 2.5,
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 5,
    paddingLeft: 10,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: "#A4A4A4",
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  selectedCategoryButton: {
    backgroundColor: "#8675E6",
  },
  categoryImage: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: 400,
    color: "#fff",
  },
  thumbnailContainer: {
    backgroundColor: "#ececec",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
    height: 200,
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  confirmButton: {
    backgroundColor: "#FFA04A",
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    paddingVertical: 12,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
