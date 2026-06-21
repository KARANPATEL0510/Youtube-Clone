import { getFirebaseDb } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

export interface FriendProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  email: string;
  status?: 'online' | 'offline';
  lastActive?: number;
}

export interface Friendship {
  id: string;
  userIds: string[];
  status: 'pending' | 'accepted';
  requester: string;
  updatedAt: number;
  users: {
    [uid: string]: {
      displayName: string;
      photoURL?: string;
      email: string;
    };
  };
}

/** Search user by email */
export const searchUserByEmail = async (email: string): Promise<FriendProfile | null> => {
  try {
    const q = query(collection(getFirebaseDb(), 'users'), where('email', '==', email.trim()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const userDoc = querySnapshot.docs[0];
    const data = userDoc.data();
    return {
      uid: userDoc.id,
      displayName: data.displayName || 'Anonymous',
      photoURL: data.photoURL || undefined,
      email: data.email || '',
      status: data.status || 'offline',
      lastActive: data.lastActive || 0,
    };
  } catch (error) {
    console.error('Error searching user:', error);
    throw error;
  }
};

/** Send friend request */
export const sendFriendRequest = async (
  sender: { uid: string; displayName: string; photoURL?: string; email: string },
  targetEmail: string
) => {
  try {
    const target = await searchUserByEmail(targetEmail);
    if (!target) throw new Error('User not found');
    if (target.uid === sender.uid) throw new Error('You cannot add yourself');

    const uids = [sender.uid, target.uid].sort();
    const friendshipId = uids.join('_');
    const friendshipRef = doc(getFirebaseDb(), 'friendships', friendshipId);
    const friendshipSnap = await getDoc(friendshipRef);

    if (friendshipSnap.exists()) {
      const data = friendshipSnap.data() as Friendship;
      if (data.status === 'accepted') throw new Error('Already friends');
      if (data.status === 'pending') {
        if (data.requester === sender.uid) {
          throw new Error('Request already pending');
        } else {
          // Double pending -> auto-accept
          await updateDoc(friendshipRef, {
            status: 'accepted',
            updatedAt: Date.now(),
          });
          return;
        }
      }
    }

    await setDoc(friendshipRef, {
      id: friendshipId,
      userIds: uids,
      status: 'pending',
      requester: sender.uid,
      updatedAt: Date.now(),
      users: {
        [sender.uid]: {
          displayName: sender.displayName,
          photoURL: sender.photoURL || '',
          email: sender.email,
        },
        [target.uid]: {
          displayName: target.displayName,
          photoURL: target.photoURL || '',
          email: target.email,
        },
      },
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

/** Accept friend request */
export const acceptFriendRequest = async (friendshipId: string) => {
  try {
    const friendshipRef = doc(getFirebaseDb(), 'friendships', friendshipId);
    await updateDoc(friendshipRef, {
      status: 'accepted',
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
};

/** Reject / Cancel / Remove friendship */
export const removeFriendship = async (friendshipId: string) => {
  try {
    const friendshipRef = doc(getFirebaseDb(), 'friendships', friendshipId);
    await deleteDoc(friendshipRef);
  } catch (error) {
    console.error('Error removing friendship:', error);
    throw error;
  }
};

/** Listen to friendships */
export const subscribeFriendships = (
  userId: string,
  onUpdate: (friendships: Friendship[]) => void
) => {
  const q = query(
    collection(getFirebaseDb(), 'friendships'),
    where('userIds', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const list: Friendship[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Friendship);
    });
    onUpdate(list);
  }, (err) => {
    console.error('Subscription error in friendships:', err);
  });
};

/** Listen to real-time status of users */
export const subscribeUsersStatus = (
  userIds: string[],
  onUpdate: (statuses: Record<string, { status: 'online' | 'offline'; lastActive: number }>) => void
) => {
  if (userIds.length === 0) {
    onUpdate({});
    return () => {};
  }

  // To prevent Firestore limitations, chunk userIds if length > 30. Here we assume small lists.
  const q = query(collection(getFirebaseDb(), 'users'), where('uid', 'in', userIds));

  return onSnapshot(q, (snapshot) => {
    const statuses: Record<string, { status: 'online' | 'offline'; lastActive: number }> = {};
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      statuses[docSnapshot.id] = {
        status: data.status || 'offline',
        lastActive: data.lastActive || 0,
      };
    });
    onUpdate(statuses);
  }, (err) => {
    console.error('Subscription error in users statuses:', err);
  });
};
