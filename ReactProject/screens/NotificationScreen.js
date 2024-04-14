import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { collection, query, getDoc,doc, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

const NotificationScreen = () => {
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
              console.log(likeDoc.data().likedAt);
              const notification = {
                  id: likeDoc.id,
                  type: "like",
                  title: "New Like",
                  content: `${username} liked your essence.`,
                  time: formatNotificationTime(likeDoc.data().likedAt),
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
              console.log("Updated Notifications:", filteredLikesNotifications);
              return updatedNotifications;
          });
          
  
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
          return onSnapshot(commentsQuery, (commentsSnapshot) => {
            const commentsNotifications = commentsSnapshot.docs.map((commentDoc) => {
              const commentContent = commentDoc.data().text;
              if (commentContent.trim() !== "") {
                  return {
                      id: commentDoc.id,
                      type: "comment",
                      title: "New Comment",
                      content: commentContent,
                      time: formatNotificationTime(commentDoc.data().createdAt),
                  };
              } else {
                  return null;
              }
          });
          
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
    return timestamp.toDate().toLocaleString();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {notifications.map((notification, index) => (
        <View key={`notification-${index}`} style={styles.notification}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationContent}>{notification.content}</Text>
          {notification.time && <Text style={styles.notificationTime}>{notification.time}</Text>}
        </View>
      ))}
    </ScrollView>
  );
  
  
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  notification: {
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  notificationContent: {
    fontSize: 16,
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999999",
  },
});

export default NotificationScreen;
