import {
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  View,
  Image,
  Dimensions,
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
import { auth } from "../../firebase";

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

const BrowsePostedScreen = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<string>("POSTED");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const userId = auth.currentUser?.uid;

  const [posterId, setPosterId] = useState(userId);

  const navigation = useNavigation();
  const route = useRoute();

  const handleSearch = (text) => {
    setSearchQuery(text);

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

  useEffect(() => {
    if (route.params?.deletedArticleId) {
      // Filter out the deleted article from the articles list
      const updatedArticles = articles.filter(
        (article) => article.id !== route.params.deletedArticleId
      );
      setArticles(updatedArticles);
    }
  }, [route.params?.deletedArticleId]);
  

  // Fetch articles with buffering and data comparison
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://10.91.144.154:8080/api/article/getArticleByPosterId/${posterId}`
      );

      // Only update state if data has changed
      const fetchedArticles = response.data;
      const updatedArticles = fetchedArticles.map((article: Article) => ({
        ...article,
        thumbnailImage: article.thumbnailImage.startsWith("data:image")
          ? article.thumbnailImage
          : `${article.thumbnailImage.trim()}`,
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
      setLoading(false); // Set loading to false after fetching
    }
  };

  const renderArticleItem = ({ item }: { item: Article }) => {
    return (
      <TouchableOpacity
        style={styles.articleCard}
        onPress={() =>
          navigation.navigate("articles/getSelectedArticle", {
            articleId: item.articleId,
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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Browse Posted Articles",
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      fetchArticles();
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.selectedTab) {
        setSelectedTab(route.params.selectedTab);
      }
    }, [route.params?.selectedTab])
  );

  useEffect(() => {
    // Update filteredArticles whenever articles or searchQuery changes
    if (searchQuery === "") {
      setFilteredArticles(articles); // Show all articles if search is empty
    } else {
      const filtered = articles.filter(
        (article) =>
          article.articleTitle
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          article.articleBody.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredArticles(filtered);
    }
  }, [articles, searchQuery]); // Dependency array includes articles and searchQuery

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
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

      {loading ? ( // Show loading indicator while fetching
        <ActivityIndicator size="large" color="#0000ff" />
      ) : filteredArticles.length === 0 ? ( // Check if filteredArticles is empty
        <View style={styles.noArticlesContainer}>
          <Ionicons name="pencil-outline" size={50} color="#999" />
          <Text style={styles.noArticlesText}>
            No Articles Posted Yet!
            Share Your Articles.
          </Text>
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

      <TouchableOpacity
        style={styles.addArticleButton}
        onPress={() => {
          navigation.navigate("articles/addArticle");
        }}
      >
        <Image
          source={require("../../assets/images/Article_Plus.png")}
          style={styles.addArticleIcon}
        />
      </TouchableOpacity>

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
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
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
  // searchInput: {
  //   borderWidth: 1,
  //   borderColor: "#ccc",
  //   borderRadius: 8,
  //   padding: 10,
  //   marginTop: 10,
  // },
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
  addArticleButton: {
    position: "absolute",
    bottom: Dimensions.get("window").height * 0.1,
    right: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  addArticleIcon: {
    width: 60,
    height: 60,
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
  noArticlesContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    position: "absolute", 
    top: 0,
    bottom: Dimensions.get("window").height * 0.07, 
    left: 0,
    right: 0,
  },
  noArticlesText: {
    marginTop: 10,
    fontSize: 18,
    textAlign: "center",
    color: "#999",
  },
});

export default BrowsePostedScreen;
