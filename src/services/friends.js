import { db } from './firebase';
import {
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    getDoc,
    collection,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { sendNotification } from './notifications';

// Send a friend request
export async function sendFriendRequest(currentUserId, currentUserInfo, targetUserId) {
    const targetRef = doc(db, 'users', targetUserId);
    const myRef = doc(db, 'users', currentUserId);

    // Add to target's received requests
    await updateDoc(targetRef, {
        friendRequests: arrayUnion({
            uid: currentUserId,
            displayName: currentUserInfo.displayName,
            avatar: currentUserInfo.avatar,
            type: 'received',
            timestamp: Date.now()
        })
    });

    // Add to my sent requests
    await updateDoc(myRef, {
        friendRequests: arrayUnion({
            uid: targetUserId,
            type: 'sent',
            timestamp: Date.now()
        })
    });

    // Notify target
    await sendNotification(targetUserId, 'friend_request', {
        userId: currentUserId,
        userName: currentUserInfo.displayName,
        userAvatar: currentUserInfo.avatar
    });
}

// Accept a friend request
export async function acceptFriendRequest(currentUserId, currentUserInfo, requesterId) {
    const myRef = doc(db, 'users', currentUserId);
    const requesterRef = doc(db, 'users', requesterId);

    // 1. Add to both friends lists
    await updateDoc(myRef, { friends: arrayUnion(requesterId) });
    await updateDoc(requesterRef, { friends: arrayUnion(currentUserId) });

    // 2. Remove requests from both sides (need to clean up the array objects)
    // Firestore arrayRemove only works if object matches exactly. 
    // Since we might not have the exact object details for removal, 
    // a cleaner way is to read, filter, and write back. 
    // BUT for simplicity in this project, assuming we structure requests simply or fetch-filter-update.

    // Let's do the fetch-filter-update approach for robustness
    const mySnap = await getDoc(myRef);
    const reqSnap = await getDoc(requesterRef);

    if (mySnap.exists()) {
        const data = mySnap.data();
        const newRequests = (data.friendRequests || []).filter(r => r.uid !== requesterId);
        await updateDoc(myRef, { friendRequests: newRequests });
    }

    if (reqSnap.exists()) {
        const data = reqSnap.data();
        const newRequests = (data.friendRequests || []).filter(r => r.uid !== currentUserId);
        await updateDoc(requesterRef, { friendRequests: newRequests });
    }

    // Notify requester
    await sendNotification(requesterId, 'friend_accept', {
        userId: currentUserId,
        userName: currentUserInfo.displayName,
        userAvatar: currentUserInfo.avatar
    });
}

// Reject/Cancel request
export async function removeFriendRequest(currentUserId, targetUserId) {
    const myRef = doc(db, 'users', currentUserId);
    const targetRef = doc(db, 'users', targetUserId);

    // Fetch-filter-update for both
    const mySnap = await getDoc(myRef);
    if (mySnap.exists()) {
        const data = mySnap.data();
        const newRequests = (data.friendRequests || []).filter(r => r.uid !== targetUserId);
        await updateDoc(myRef, { friendRequests: newRequests });
    }

    const targetSnap = await getDoc(targetRef);
    if (targetSnap.exists()) {
        const data = targetSnap.data();
        const newRequests = (data.friendRequests || []).filter(r => r.uid !== currentUserId);
        await updateDoc(targetRef, { friendRequests: newRequests });
    }
}

// Unfriend
export async function removeFriend(currentUserId, friendId) {
    const myRef = doc(db, 'users', currentUserId);
    const friendRef = doc(db, 'users', friendId);

    await updateDoc(myRef, { friends: arrayRemove(friendId) });
    await updateDoc(friendRef, { friends: arrayRemove(currentUserId) });
}

// Get relationship status
// Cancel a sent request (Sender cancels their own request)
export async function cancelFriendRequest(currentUserId, targetUserId) {
    try {
        const myRef = doc(db, 'users', currentUserId);
        const targetRef = doc(db, 'users', targetUserId);

        const [mySnap, targetSnap] = await Promise.all([getDoc(myRef), getDoc(targetRef)]);

        if (mySnap.exists()) {
            const myData = mySnap.data();
            const myRequests = myData.friendRequests || [];
            // Remove the 'sent' request to target
            const newMyRequests = myRequests.filter(r => r.uid !== targetUserId);
            await updateDoc(myRef, { friendRequests: newMyRequests });
        }

        if (targetSnap.exists()) {
            const targetData = targetSnap.data();
            const targetRequests = targetData.friendRequests || [];
            // Remove the 'received' request from current user
            const newTargetRequests = targetRequests.filter(r => r.uid !== currentUserId);
            await updateDoc(targetRef, { friendRequests: newTargetRequests });
        }
    } catch (error) {
        console.error("Error cancelling friend request: ", error);
        throw error;
    }
}

export function getFriendStatus(currentUser, targetUserId) {
    if (!currentUser) return 'none';
    if (currentUser.friends?.includes(targetUserId)) return 'friends';

    const reqs = currentUser.friendRequests || [];
    const sent = reqs.find(r => r.uid === targetUserId && r.type === 'sent');
    const received = reqs.find(r => r.uid === targetUserId && r.type === 'received');

    if (received) return 'received';
    if (sent) return 'sent';
    return 'none';
}
