import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
} from "react-native";
import React from "react";
import { getAuth } from "firebase/auth";
import { useNavigation } from "@react-navigation/core";

const HomeScreen = () => {
  const auth = getAuth();
  const navigation = useNavigation();

  const handleSignOut = () => {
    auth
      .signOut()
      .then(() => {
        navigation.replace("Login");
      })
      .catch((error) => alert(error.message));
  };

  const essencesData = [
    { id: "1", title: "Favorite Cologne" },
    { id: "2", title: "Go-To Playlist" },
    { id: "3", title: "Comfort Food Recipe" },
    { id: "3", title: "Comfort Food Recipe" },
  ];

  const EssenceItem = ({ title }) => (
    <TouchableOpacity style={styles.essenceItem}>
      <Text style={styles.essenceTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile section */}
      <View style={styles.profileSection}>
        {/* Profile picture */}
        <Image
          source={require("./../assets/profile-pic.jpg")} // Placeholder image, replace with actual profile picture
          style={styles.profilePicture}
        />
        {/* Bio and follower/following count */}
        <View style={styles.profileInfo}>
          <Text style={styles.title}>Welcome, {auth.currentUser?.email}</Text>
          <Text style={styles.subtitle}>
            Share and discover the small joys in life.
          </Text>
          <Text style={styles.bio}>Write your bio here...</Text>
          <View style={styles.followCounts}>
            <Text style={styles.followText}>Followers: 100</Text>
            <Text style={styles.followText}>Following: 50</Text>
          </View>
        </View>
      </View>

      {/* Grid for "essences" */}
      <FlatList
        data={essencesData}
        renderItem={({ item }) => <EssenceItem title={item.title} />}
        keyExtractor={(item) => item.id}
        numColumns={2} // Display two columns in the grid
        contentContainerStyle={styles.essencesGrid}
      />

      {/* Sign out button */}
      <TouchableOpacity onPress={handleSignOut} style={styles.button}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 5,
  },
  bio: {
    marginBottom: 5,
  },
  followCounts: {
    flexDirection: "row",
  },
  followText: {
    marginRight: 10,
  },
  essencesGrid: {
    paddingBottom: 20,
  },
  essenceItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    margin: 5,
    paddingVertical: 15,
    aspectRatio: 1,
  },
  essenceTitle: {
    fontSize: 16,
  },
  button: {
    backgroundColor: "#3B82F6",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
