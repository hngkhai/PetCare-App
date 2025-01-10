import {
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  View,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useLayoutEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import categoriesData from "@/constants/ArticleCategories";

type Article = {
  id: string;
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

const BrowseAllScreen = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("ALL");
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const navigation = useNavigation();
  const route = useRoute();

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Browse Articles" });
  }, [navigation]);

  const categories = [
    {
      label: "ALL",
      value: "ALL",
      icon: (
        <Ionicons
          name="albums"
          size={20}
          color="#fff"
          style={styles.categoryImage}
        />
      ),
    },
    ...categoriesData, // Spread the imported categories here
  ];

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories[0].value
  );

  useEffect(() => {
    if (selectedCategory === "ALL" || !selectedCategory) {
      setFilteredArticles(articles); // Show all articles when "ALL" is selected
    } else {
      const filtered = articles.filter(
        (article) => article.articleCategory === selectedCategory
      );
      setFilteredArticles(filtered);
    }
  }, [selectedCategory, articles]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchArticles = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(
            "http://10.91.144.154:8080/api/article/getAllArticles"
          );
          const fetchedArticles = response.data;
          const updatedArticles = fetchedArticles.map((article: Article) => ({
            ...article,
            thumbnailImage: article.thumbnailImage.startsWith("data:image")
              ? article.thumbnailImage
              : `${article.thumbnailImage.trim()}`,
            poster: {
              ...article.poster,
              profilePicUrl: article.poster.profilePicUrl.startsWith(
                "data:image"
              )
                ? article.poster.profilePicUrl
                : `${article.poster.profilePicUrl.trim()}`,
            },
          }));
          setArticles(updatedArticles);
        } catch (error) {
          console.error("Error fetching articles:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchArticles();
    }, [])
  );

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    setSelectedCategory("ALL");

    if (text === "") {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(
        (article) =>
          article.articleTitle.toLowerCase().includes(text.toLowerCase()) ||
          article.articleBody.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredArticles(filtered);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredArticles(articles); // Reset to full list when search is cleared
  };

  const renderArticleItem = ({ item }: { item: Article }) => {
    return (
      <TouchableOpacity
        style={styles.articleCard}
        onPress={() =>
          navigation.navigate("articles/getSelectedArticle", {
            articleId: item.articleId,
            selectedCategory: item.articleCategory,
          })
        }
      >
        <Image
          source={{ uri: item.thumbnailImage }}
          style={styles.articleImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0)",
            "rgba(0, 0, 0, 0.5)",
            "rgba(0, 0, 0, 1)",
          ]}
          start={[0, 0]}
          end={[0, 1]}
          style={styles.gradientOverlay}
        />
        <View style={styles.textContainer}>
          <ThemedText style={styles.articleTitle} numberOfLines={1}>
            {item.articleTitle}
          </ThemedText>
          <View style={styles.authorContainer}>
            <Image
              source={{ uri: item.poster.profilePicUrl }}
              style={styles.authorImage}
            />
            <ThemedText style={styles.articleAuthor}>
              {item.poster.userName} -{" "}
              {new Date(item.publishedTime).toLocaleDateString()}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
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
              {category.labelImage ? (
                <Image
                  source={category.labelImage}
                  style={styles.categoryImage}
                />
              ) : (
                category.icon // Display the icon if no image is provided
              )}
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
        </ScrollView>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search anything here"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search" // Enables search action on the keyboard
            onSubmitEditing={() => {
              // Optional: Trigger the search on "Enter" press
              console.log("Search submitted for:", searchQuery);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle-outline" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? ( // Show loading spinner when fetching articles
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8675E6" />
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
          renderItem={renderArticleItem}
          keyExtractor={(item) =>
            item.id ? item.id.toString() : Math.random().toString()
          }
          contentContainerStyle={styles.articlesScrollContainer}
          style={styles.flatList}
          contentInset={{ bottom: Dimensions.get("window").height * 0.075 }}
        />
      )}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "ALL" && styles.activeTab]}
          onPress={() => {
            navigation.navigate("articles/browseAll", { selectedTab: "ALL" });
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
            ALL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "POSTED" && styles.activeTab,
          ]}
          onPress={() => {
            navigation.navigate("articles/browsePosted", {
              selectedTab: "POSTED",
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
            POSTED
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  headerContainer: {
    padding: 16,
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryButton: {
    backgroundColor: "#A4A4A4",
    paddingVertical: 10,
    paddingHorizontal: 15,
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
    fontWeight: "400",
    color: "#fff",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  articlesScrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 45,
  },
  flatList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  articleCard: {
    width: "100%",
    height: 200,
    backgroundColor: "#8A8888",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  articleImage: {
    width: "100%",
    height: "65%",
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
  textContainer: {
    padding: 10,
    marginHorizontal: 10,
    width: "100%",
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  articleAuthor: {
    fontSize: 12,
    paddingBottom: 5,
    fontWeight: "bold",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  authorImage: {
    width: 25,
    height: 25,
    borderRadius: 15,
    marginRight: 10,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 20,
    marginBottom: 5,
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
    backgroundColor: "#8675E6",
  },
  inactiveTabText: {
    color: "#333",
  },
  activeTabText: {
    color: "white",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f5f5f5",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    marginLeft: 8,
  },
});

export default BrowseAllScreen;
