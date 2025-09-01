// =================================================================
//     APP.JS - CORE/GLOBAL LOGIC (WITH NOTIFICATIONS & FIXES)
// =================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBXGAdDLhSvZSbBclnX9EV2sGVcZovEDW8",
  authDomain: "blog-f4294.firebaseapp.com",
  projectId: "blog-f4294",
  storageBucket: "blog-f4294.appspot.com",
  messagingSenderId: "270596039723",
  appId: "1:270596039723:web:8f0667a20236841484766e",
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Global variable for notification listener
let notificationListener = null;

// Function to listen for real-time notifications
function listenForNotifications(userId) {
    if (notificationListener) {
        notificationListener(); // Unsubscribe from any previous listener
    }

    const notificationsRef = db.collection('notifications')
        .where('recipientId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(15);

    notificationListener = notificationsRef.onSnapshot(snapshot => {
        const notificationBadge = document.getElementById('notification-badge');
        const notificationList = document.getElementById('notification-list-container'); // Assuming you have a container for notifications

        if (!notificationBadge || !notificationList) return;

        notificationList.innerHTML = '';
        let unreadCount = 0;

        if (snapshot.empty) {
            notificationList.innerHTML = '<p class="px-4 py-8 text-center text-sm text-gray-500">No new notifications.</p>';
            notificationBadge.classList.add('hidden');
            return;
        }

        snapshot.forEach(doc => {
            const notif = doc.data();
            if (!notif.isRead) {
                unreadCount++;
            }

            const notifItem = document.createElement('a');
            const postLink = `index.html#post-${notif.postId}`; // Create a link to the post
            notifItem.href = postLink; 
            notifItem.className = `block px-4 py-3 text-sm text-classic-taupe hover:bg-pastel-ivory border-b border-ivory-linen ${!notif.isRead ? 'bg-pastel-ivory' : ''}`;
            
            let message = '';
            if (notif.type === 'like') {
                message = `❤️ <strong>${notif.senderName}</strong> liked your post: "${notif.postTitle}"`;
            } else if (notif.type === 'comment') {
                message = `💬 <strong>${notif.senderName}</strong> commented on your post: "${notif.postTitle}"`;
            } else if (notif.type === 'follow') {
                message = `👋 <strong>${notif.senderName}</strong> started following you.`;
            }
            notifItem.innerHTML = message;
            notificationList.appendChild(notifItem);
        });

        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    }, error => {
        console.error("Error listening to notifications: ", error);
    });
}


document.addEventListener('DOMContentLoaded', () => {
    console.log("app.js (Core) Script Loaded!");

    // --- ELEMENT SELECTORS ---
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const userAuthLinks = document.getElementById('user-auth-links');
    const userProfileInfo = document.getElementById('user-profile-info');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoutBtn = document.getElementById('logout-btn');
    const profileDropdownBtn = document.getElementById('profile-dropdown-btn');
    const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
    const notificationBellBtn = document.getElementById('notification-bell-btn');

    // --- AUTH STATE LISTENER (UPDATED FOR ROBUSTNESS) ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is logged in
            if (userAuthLinks) userAuthLinks.classList.add('hidden');
            if (userProfileInfo) userProfileInfo.classList.remove('hidden');
            
            listenForNotifications(user.uid);

            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                let userData = {};
                if (userDoc.exists) {
                    userData = userDoc.data();
                }

                const displayName = userData.displayName || user.displayName || 'User';
                const userEmail = user.email || '';
                
                // --- ROBUST AVATAR LOGIC ---
                // This ensures there is always a valid image source
                let userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8B5E34&color=fff`; // Default fallback
                
                if (userData.photoURL) {
                    userAvatar = userData.photoURL;
                } else if (user.photoURL) {
                    userAvatar = user.photoURL;
                }

                // Update all relevant UI elements
                const headerAvatar = document.getElementById('header-user-avatar');
                const dropdownName = document.getElementById('dropdown-user-name');
                const dropdownEmail = document.getElementById('dropdown-user-email');
                const adminPanelLink = document.getElementById('admin-panel-link');

                if (headerAvatar) headerAvatar.src = userAvatar;
                if (dropdownName) dropdownName.textContent = displayName;
                if (dropdownEmail) dropdownEmail.textContent = userEmail;

                if (adminPanelLink) {
                    if (userData.role === 'admin') {
                        adminPanelLink.classList.remove('hidden');
                    } else {
                        adminPanelLink.classList.add('hidden');
                    }
                }
            } catch (error) {
                console.error("Error fetching user data for header:", error);
            }

        } else {
            // User is logged out
            if (userAuthLinks) userAuthLinks.classList.remove('hidden');
            if (userProfileInfo) userProfileInfo.classList.add('hidden');
            if (notificationListener) {
                notificationListener(); // Stop listening for notifications
            }
        }
    });

    // --- MODAL & FORM LOGIC ---
    if (loginModal && signupModal) {
        const loginBtn = document.getElementById('login-btn');
        const signupBtn = document.getElementById('signup-btn');
        const closeModalButtons = document.querySelectorAll('.close-modal-btn');
        const showSignupLink = document.getElementById('show-signup-link');
        const showLoginLink = document.getElementById('show-login-link');

        if (loginBtn) loginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
        if (signupBtn) signupBtn.addEventListener('click', () => signupModal.classList.remove('hidden'));
        
        closeModalButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                loginModal.classList.add('hidden');
                signupModal.classList.add('hidden');
            });
        });

        if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); loginModal.classList.add('hidden'); signupModal.classList.remove('hidden'); });
        if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); signupModal.classList.add('hidden'); loginModal.classList.remove('hidden'); });
    }

    if (loginForm) {
        const loginError = document.getElementById('login-error');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;
            if (loginError) loginError.textContent = '';
            try {
                await auth.signInWithEmailAndPassword(email, password);
                if (loginModal) loginModal.classList.add('hidden');
                loginForm.reset();
            } catch (err) {
                if (loginError) loginError.textContent = err.message;
            }
        });
    }

    if (signupForm) {
        const signupError = document.getElementById('signup-error');
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = signupForm['signup-name'].value;
            const email = signupForm['signup-email'].value;
            const password = signupForm['signup-password'].value;
            if (signupError) signupError.textContent = '';
            try {
                const res = await auth.createUserWithEmailAndPassword(email, password);
                const user = res.user;
                await user.updateProfile({ displayName: name });
                
                await db.collection('users').doc(user.uid).set({
                    displayName: name,
                    email: email,
                    role: 'user',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    photoURL: '',
                    bio: '',
                    coverPhotoURL: '',
                    followers: [],
                    following: [],
                    followersCount: 0,
                    followingCount: 0
                });
                
                if (signupModal) signupModal.classList.add('hidden');
                signupForm.reset();
            } catch (err) {
                if (signupError) signupError.textContent = err.message;
            }
        });
    }

    // --- DROPDOWN & NOTIFICATION LISTENERS ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.signOut());
    }
    
    if (profileDropdownBtn && profileDropdownMenu) {
        profileDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdownMenu.classList.toggle('hidden');
        });
    }

    if (notificationBellBtn && profileDropdownMenu) {
        notificationBellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdownMenu.classList.toggle('hidden');
            // Here you can add logic to mark notifications as read
        });
    }

    // Hide dropdown if clicking outside
    document.addEventListener('click', (e) => {
        if (profileDropdownMenu && !profileDropdownMenu.classList.contains('hidden')) {
            const isClickInside = profileDropdownMenu.contains(e.target.parentElement);
            const isClickOnBtn = profileDropdownBtn && profileDropdownBtn.contains(e.target);
            if (!isClickInside && !isClickOnBtn) {
                 profileDropdownMenu.classList.add('hidden');
            }
        }
    });
});