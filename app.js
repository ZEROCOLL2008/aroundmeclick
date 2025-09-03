// =================================================================
//     APP.JS - CORE LOGIC (WITH MOBILE HAMBURGER MENU)
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
        // This part requires a notification list container in your dropdown, which is not in the provided HTML.
        // const notificationList = document.getElementById('notification-list-container');
        if (!notificationBadge) return;

        let unreadCount = 0;
        snapshot.forEach(doc => {
            const notif = doc.data();
            if (!notif.isRead) {
                unreadCount++;
            }
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

    // --- ELEMENT SELECTORS (DESKTOP & MOBILE) ---
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    
    // Desktop elements
    const userAuthLinks = document.getElementById('user-auth-links');
    const userProfileInfo = document.getElementById('user-profile-info');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileDropdownBtn = document.getElementById('profile-dropdown-btn');
    const profileDropdownMenu = document.getElementById('profile-dropdown-menu');

    // Mobile elements
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileAuthLinks = document.getElementById('mobile-auth-links');
    const mobileProfileInfo = document.getElementById('mobile-profile-info');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const mobileSignupBtn = document.getElementById('mobile-signup-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

    // --- HAMBURGER MENU TOGGLE ---
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- AUTH STATE LISTENER (UPDATED FOR MOBILE) ---
    auth.onAuthStateChanged(async (user) => {
        const adminPanelLink = document.getElementById('admin-panel-link');
        const mobileAdminPanelLink = document.getElementById('mobile-admin-panel-link');

        if (user) {
            // User is LOGGED IN
            // Desktop view
            if (userAuthLinks) userAuthLinks.classList.add('hidden');
            if (userProfileInfo) userProfileInfo.classList.remove('hidden');
            // Mobile view
            if (mobileAuthLinks) mobileAuthLinks.classList.add('hidden');
            if (mobileProfileInfo) mobileProfileInfo.classList.remove('hidden');
            
            listenForNotifications(user.uid);

            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                let userData = {};
                if (userDoc.exists) {
                    userData = userDoc.data();
                }

                const displayName = userData.displayName || user.displayName || 'User';
                const userEmail = user.email || '';
                let userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8B5E34&color=fff`;
                
                if (userData.photoURL) {
                    userAvatar = userData.photoURL;
                } else if (user.photoURL) {
                    userAvatar = user.photoURL;
                }

                const headerAvatar = document.getElementById('header-user-avatar');
                const dropdownName = document.getElementById('dropdown-user-name');
                const dropdownEmail = document.getElementById('dropdown-user-email');

                if (headerAvatar) headerAvatar.src = userAvatar;
                if (dropdownName) dropdownName.textContent = displayName;
                if (dropdownEmail) dropdownEmail.textContent = userEmail;

                if (userData.role === 'admin') {
                    if (adminPanelLink) adminPanelLink.classList.remove('hidden');
                    if (mobileAdminPanelLink) mobileAdminPanelLink.classList.remove('hidden');
                } else {
                    if (adminPanelLink) adminPanelLink.classList.add('hidden');
                    if (mobileAdminPanelLink) mobileAdminPanelLink.classList.add('hidden');
                }
            } catch (error) {
                console.error("Error fetching user data for header:", error);
            }

        } else {
            // User is LOGGED OUT
            // Desktop view
            if (userAuthLinks) userAuthLinks.classList.remove('hidden');
            if (userProfileInfo) userProfileInfo.classList.add('hidden');
            // Mobile view
            if (mobileAuthLinks) mobileAuthLinks.classList.remove('hidden');
            if (mobileProfileInfo) mobileProfileInfo.classList.add('hidden');

            if (notificationListener) {
                notificationListener(); // Stop listening
            }
        }
    });

    // --- MODAL & FORM LOGIC (REUSING FOR MOBILE BUTTONS) ---
    const showLoginModal = () => loginModal?.classList.remove('hidden');
    const showSignupModal = () => signupModal?.classList.remove('hidden');

    // Desktop buttons
    if(loginBtn) loginBtn.addEventListener('click', showLoginModal);
    if(signupBtn) signupBtn.addEventListener('click', showSignupModal);
    
    // Mobile buttons
    if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', showLoginModal);
    if (mobileSignupBtn) mobileSignupBtn.addEventListener('click', showSignupModal);

    // Close modals
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            loginModal?.classList.add('hidden');
            signupModal?.classList.add('hidden');
        });
    });

    // Switch between modals
    document.getElementById('show-signup-link')?.addEventListener('click', (e) => { e.preventDefault(); loginModal?.classList.add('hidden'); signupModal?.classList.remove('hidden'); });
    document.getElementById('show-login-link')?.addEventListener('click', (e) => { e.preventDefault(); signupModal?.classList.add('hidden'); loginModal?.classList.remove('hidden'); });

    // --- Sign Out Logic (for both buttons) ---
    const signOutUser = () => auth.signOut();
    if (logoutBtn) logoutBtn.addEventListener('click', signOutUser);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', signOutUser);
    
    // --- DROPDOWN (DESKTOP ONLY) ---
    if (profileDropdownBtn && profileDropdownMenu) {
        profileDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdownMenu.classList.toggle('hidden');
        });
    }

    // Hide dropdown if clicking outside
    document.addEventListener('click', (e) => {
        if (profileDropdownMenu && !profileDropdownMenu.classList.contains('hidden')) {
            const isClickInside = profileDropdownMenu.contains(e.target) || profileDropdownBtn.contains(e.target);
            if (!isClickInside) {
                 profileDropdownMenu.classList.add('hidden');
            }
        }
    });

    // --- Login/Signup Form Submission Logic ---
    const loginForm = document.getElementById('login-form');
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

    const signupForm = document.getElementById('signup-form');
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
                    displayName: name, email: email, role: 'user',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    photoURL: '', bio: '', coverPhotoURL: '',
                    followers: [], following: [], followersCount: 0, followingCount: 0
                });
                
                if (signupModal) signupModal.classList.add('hidden');
                signupForm.reset();
            } catch (err) {
                if (signupError) signupError.textContent = err.message;
            }
        });
    }
});

// =========================================================================
//     MOBILE CATEGORIES TOGGLE & HIDE ON SCROLL (FINAL SIMPLIFIED VERSION)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // This check ensures the code only runs if the relevant elements are on the page
    if (document.getElementById('category-nav-bar')) {
        
        const categoryNavBar = document.getElementById('category-nav-bar');
        const toggleCategoriesBtn = document.getElementById('toggle-categories-btn');
        let lastScrollY = window.scrollY;

        // Scroll listener: Always controls visibility based on scroll direction
        window.addEventListener('scroll', () => {
            // Only run on mobile screens
            if (window.innerWidth >= 768) {
                // On larger screens, ensure the bar is always visible and in position
                categoryNavBar.classList.remove('-translate-y-full');
                return;
            }

            const currentScrollY = window.scrollY;

            // On scroll up, show. On scroll down (past 100px), hide.
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                categoryNavBar.classList.add('-translate-y-full'); // Hide
            } else if (currentScrollY < lastScrollY) {
                categoryNavBar.classList.remove('-translate-y-full'); // Show
            }

            // Update the last scroll position
            lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
        });

        // Button listener: Simply toggles the current state
        if (toggleCategoriesBtn && categoryNavBar) {
            toggleCategoriesBtn.addEventListener('click', () => {
                // The button just toggles the same class used by the scroll listener
                categoryNavBar.classList.toggle('-translate-y-full');
            });
        }
    }
});