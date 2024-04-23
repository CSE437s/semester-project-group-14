import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { collection, query, getDoc, doc, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment'; 
import { useNavigation } from '@react-navigation/native';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const userId = auth.currentUser?.uid;
  useEffect(() => {
    setNotifications([]);
  }, []);
  
  useEffect(() => {

    const unsubscribeLikes = onSnapshot(
      collection(db, `users/${userId}/essences`),
      (snapshot) => {
        const likesPromises = snapshot.docs.map((essenceDoc) => {
          const essenceId = essenceDoc.id;
          const likesRef = collection(db, `users/${userId}/essences/${essenceId}/likes`);
          const likesQuery = query(likesRef);
          return onSnapshot(likesQuery, async (likesSnapshot) => {
            const likesNotifications = await Promise.all(likesSnapshot.docs.map(async (likeDoc) => {
              const userDocRef = doc(db, "users", likeDoc.data().userId);
              const userSnapshot = await getDoc(userDocRef);
              const username = userSnapshot.exists() ? userSnapshot.data().username : "Unknown";  

              const essenceRef = doc(db, `users/${userId}/essences/${essenceId}`);
              const essenceSnapshot = await getDoc(essenceRef);
              const essenceData = essenceSnapshot.exists() ? essenceSnapshot.data() : null;
              const essenceResponse = essenceData ? essenceData.response : "No response";    

              const notification = {
                  id: likeDoc.id,
                  type: "like",
                  title: "New Like",
                  content: `${username} liked your essence "${essenceResponse}"`,
                  time: formatNotificationTime(likeDoc.data().likedAt),
                  timestamp: likeDoc.data().likedAt,
                  userId:likeDoc.data().userId,

              };
              if (notification.content.trim() !== "") {
                  return notification;
              } else {
                  return null;
              }
          }));
          
          const filteredLikesNotifications = likesNotifications.filter(notification => notification !== null);
          
          setNotifications((prevNotifications) => {
              const updatedNotifications = [
                  ...prevNotifications,
                  ...filteredLikesNotifications,
              ];
              return updatedNotifications;
          });
          console.log(notifications);
  
        });
        
        });

        return () => {
          unsubscribeLikes.forEach((unsubscribe) => unsubscribe());
        };
      }
    );
    const unsubscribeComments = onSnapshot(
      collection(db, `users/${userId}/essences`),
      (snapshot) => {
        const commentsPromises = snapshot.docs.map((essenceDoc) => {
          const essenceId = essenceDoc.id;
          const commentsRef = collection(db, `users/${userId}/essences/${essenceId}/comments`);
          const commentsQuery = query(commentsRef, orderBy("createdAt", "desc"));
          return onSnapshot(commentsQuery, async (commentsSnapshot) => {
            const commentsNotifications = await Promise.all(commentsSnapshot.docs.map(async (commentDoc) => {
              const commentContent = commentDoc.data().text;
              const userDocRef = doc(db, "users", commentDoc.data().userId);
              const userSnapshot = await getDoc(userDocRef); // Await the getDoc function
              const username = userSnapshot.exists() ? userSnapshot.data().username : "Unknown";  
              if (commentContent.trim() !== "") {
                return {
                  id: commentDoc.id,
                  type: "comment",
                  title: "New Comment",
                  content: `${username} commented ${commentContent}.`,
                  time: formatNotificationTime(commentDoc.data().createdAt),
                  timestamp: commentDoc.data().createdAt,
                  userId:commentDoc.data().userId,
                };
              } else {
                return null;
              }
            }));
            
            const filteredCommentsNotifications = commentsNotifications.filter(notification => notification !== null);
            
            setNotifications((prevNotifications) => {
              const updatedNotifications = [
                ...prevNotifications,
                ...filteredCommentsNotifications,
              ];

              
              return updatedNotifications;
            });
            
          });
        });
    
        return () => {
          unsubscribeComments.forEach((unsubscribe) => unsubscribe());
        };
      }
    );
    

    return () => {
      unsubscribeLikes();
      unsubscribeComments();
    };
  }, []);

  const formatNotificationTime = (timestamp) => {
    return moment(timestamp.toDate()).fromNow();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {notifications.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate())
        .map((notification, index) => (
        <View key={`notification-${index}`} style={styles.notification}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationTime}>{notification.time}</Text>
          </View>
          <View style={styles.notificationContent}>
            {notification.type === "like" ? (
              <Ionicons name="heart-outline" size={24} color="#4A90E2" />
            ) : (
              <Ionicons name="chatbubble-outline" size={24} color="#4A90E2" />
            )}
           <TouchableOpacity onPress={() => {
  navigation.navigate('Profile', { userId: notification.userId });
}}>
  <Text style={styles.notificationText}>{notification.content}</Text>
</TouchableOpacity>


          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#e6e6e6",
  },
  notification: {
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
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  notificationTime: {
    fontSize: 12,
    color: "#999999",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationText: {
    marginLeft: 10,
    fontSize: 16,
  },
});

export default NotificationScreen;
