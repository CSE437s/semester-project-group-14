import { db } from "../firebaseConfig";
import { doc, setDoc, deleteDoc, collection, query, getDocs  } from "firebase/firestore";

// follow
export const followUser = async (currentUserId, userIdToFollow) => {
  await setDoc(doc(db, "users", currentUserId, "following", userIdToFollow), { //next we add to the current users following
    followedAt: new Date(),
  });

  await setDoc(doc(db, "users", userIdToFollow, "followers", currentUserId), { //also need to add to other users followers
    followedAt: new Date(),
  });
};

// unfollow
export const unfollowUser = async (currentUserId, userIdToUnfollow) => {
  await deleteDoc(doc(db, "users", currentUserId, "following", userIdToUnfollow)); //remove from curr user following

  await deleteDoc(doc(db, "users", userIdToUnfollow, "followers", currentUserId)); //remove from other users followers
};


export const fetchFollowerCount = async (userId) => { //get # of followers for user
  const followersRef = collection(db, "users", userId, "followers");
  const querySnapshot = await getDocs(query(followersRef));
  return querySnapshot.size;
};

export const fetchFollowingCount = async (userId) => { // get following for user
  const followingRef = collection(db, "users", userId, "following");
  const querySnapshot = await getDocs(query(followingRef));
  return querySnapshot.size;
};


export const fetchFollowing = async (userId) => {
    const followingRef = collection(db, "users", userId, "following");
    const querySnapshot = await getDocs(followingRef);
    const following = [];
    querySnapshot.forEach((doc) => {
      following.push({ id: doc.id, ...doc.data() });
    });
    return following;
};

export const fetchFollowers = async (userId) => {
    const followersRef = collection(db, "users", userId, "followers");
    const querySnapshot = await getDocs(followersRef);
    const followers = [];
    querySnapshot.forEach((doc) => {
      followers.push({ id: doc.id, ...doc.data() });
    });
    return followers;
};