import React, { useContext, useState, useEffect } from "react";
import { StyleSheet, View, Button, ActivityIndicator, Text, Image, FlatList, Modal, TextInput, TouchableOpacity, } from "react-native";
import PromptContext from "../contexts/PromptContext";
import { useNavigation, useRoute } from "@react-navigation/core";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  collectionGroup,
  where,
  addDoc,
  getDoc,
  getDocs,
  doc,
  onSnapshot,
  query,
  setDoc,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import moment from 'moment';


const jaroSimilarity = (s1, s2) => {
  if (s1 === s2) return 1.0;
  
  const s1Length = s1.length;
  const s2Length = s2.length;
  
  const matchDistance = Math.floor(Math.max(s1Length, s2Length) / 2) - 1;
  
  const s1Matches = new Array(s1Length);
  s1Matches.fill(false);
  const s2Matches = new Array(s2Length);
  s2Matches.fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  for (let i = 0; i < s1Length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2Length);
    
    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }
  
  if (matches === 0) return 0.0;
  
  let k = 0;
  for (let i = 0; i < s1Length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }
  
  const m = matches;
  const t = transpositions / 2;
  const jaroSimilarity = (m / s1Length + m / s2Length + (m - t) / m) / 3;
  
  return jaroSimilarity;
};


const StatisticsScreen = () => {
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [similarityScore, setSimilarityScore] = useState(null);
  const [mostRecentEssence, setMostRecentEssence] = useState(null);
  const [userResponse, setUserResponse] = useState(null);
  const [prompt] = useContext(PromptContext);
  const [loading, setLoading] = useState(true);
  const [feedData, setFeedData] = useState([]);
  const userId = auth.currentUser?.uid;
  let navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!prompt) {
          setLoading(false);
          return;
        }
    
        const currentUserId = auth.currentUser?.uid;
    
        const followingRef = collection(db, "users", currentUserId, "following");
        const unsubscribeFollowing = onSnapshot(followingRef, async (snapshot) => {
          const followingIds = snapshot.docs.map(doc => doc.id);
    
          const essencesRef = collectionGroup(db, "essences");
          const q = query(essencesRef, where("prompt", "==", prompt));
          const unsubscribeEssences = onSnapshot(q, async (querySnapshot) => {
            const essencesDataPromises = querySnapshot.docs.map(async (essenceDoc) => {
              const essenceData = essenceDoc.data();
              const likesQuerySnapshot = await getDocs(collection(db, `users/${essenceData.userId}/essences/${essenceDoc.id}/likes`));
              const numLikes = likesQuerySnapshot.size;
              const commentsQuerySnapshot = await getDocs(collection(db, `users/${essenceData.userId}/essences/${essenceDoc.id}/comments`));
              const numComments = commentsQuerySnapshot.size;
              const likesRef = collection(db, `users/${essenceData.userId}/essences/${essenceDoc.id}/likes`);
              const querySnapshot = await getDocs(
                query(likesRef, where("userId", "==", currentUserId))
              );
    
              const liked = !querySnapshot.empty;
    
              let username = "USER";
              let profilePicUrl = ""; 
              if (essenceData.userId) {
                const userDocRef = doc(db, "users", essenceData.userId);
                const userDocSnapshot = await getDoc(userDocRef);
                if (userDocSnapshot.exists()) {
                  const userData = userDocSnapshot.data();
                  username = userData.username || "USER";
                  profilePicUrl = userData.profilePicUrl || ""; 
                }
              }
    
              if (followingIds.includes(essenceData.userId)) {
                return {
                  id: essenceDoc.id,
                  ...essenceData,
                  username,
                  numLikes,
                  numComments,
                  liked,
                  profilePicUrl, 
                  response: essenceData.response
                };
              } else {
                return null;
              }
            });
    
            const essencesWithData = await Promise.all(essencesDataPromises);
            const filteredEssences = essencesWithData.filter(essence => essence !== null && jaroSimilarity(userResponse,essence.response) > 0.85);
    
            filteredEssences.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

            
    
            setFeedData(filteredEssences);
          });
    
          return () => {
            unsubscribeEssences();
          };
        });
    
        return () => {
          unsubscribeFollowing();
        };
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    
    fetchData();
  }, [prompt, userResponse]);

  useEffect(() => {
    const fetchPromptAndCheckResponse = async () => {
      const checkResponse = async () => {
        const userId = auth.currentUser?.uid;
        const essencesRef = collection(db, `users/${userId}/essences`);
        const querySnapshot = await getDocs(
          query(essencesRef, where("prompt", "==", prompt))
        );
        if (!querySnapshot.empty) {
          setUserResponse(querySnapshot.docs[0].data().response);
        } else {
          setUserResponse(null);
        }
      };
      checkResponse();
    };
    fetchPromptAndCheckResponse();
  }, [prompt]);



  const calculateSimilarity = () => {
    // Jaro Similarity Algorithm

    // Calculate Jaro similarity score
    const score = jaroSimilarity(input1, input2);
    setSimilarityScore(score);
  };

  const renderItem = ({ item }) => {
    const timeAgo = moment(item.createdAt.toDate()).fromNow();
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.userId })} style={styles.cardHeader}>
            <Image source={item.profilePicUrl ? { uri: item.profilePicUrl } : require("./../assets/profile-pic.jpg")} style={styles.avatar} />
            <Text style={styles.username}>{item.username}</Text>
          </TouchableOpacity>
          <View style={styles.timestampContainer}>
            <Text style={styles.timestamp}>{timeAgo}</Text> 
          </View>
        </View>
        
        {item.imageUri && 
          <Image  style={styles.essenceImage} source={{ uri: item.imageUri }}></Image>
        }
        <Text style={styles.response}>{item.response}</Text>
        <View style={styles.interactionBar}>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>These friends had similar answers:</Text>
      {similarityScore !== null &&
        <Text style={{ margin: 10 }}>
          Similarity Score: {similarityScore.toFixed(2)}
        </Text>
      }

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" />
        ) : (
          <FlatList
            data={feedData}
            renderItem={renderItem}
            keyExtractor={item => item.id}
          />
      )}
    </View>
  );
};

export default StatisticsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#c0e0ed",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    textAlignVertical:'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  essenceImage: {
    width: 80,
    height: 80,
    alignSelf: 'center', 
    marginBottom: 10, 
  },
  
  username: {
    fontWeight: "bold",
    fontSize: 16,
  },
  prompt: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  response: {
    fontSize: 16,
    color: "#333",
  },
  timestampContainer: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'row',

    
  },
  timestamp: {
    color: '#999',
    marginLeft: 'auto',

  },
  title: {
    fontSize: 20,
    margin: 20
  }


});