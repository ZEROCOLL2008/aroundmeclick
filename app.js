// =================================================================
//     APP.JS - FINAL + DARK MODE TOGGLE LOGIC (FIXED)
// =================================================================

// --- FIREBASE INITIALIZATION ---
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

// --- NOTIFICATION LISTENER FUNCTION ---
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
        if (!notificationBadge) return;

        let unreadCount = 0;
        snapshot.forEach(doc => {
            const notif = doc.data();
            if (!notif.isRead) {
                unreadCount++;
            }
        });

        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    }, error => {
        console.error("Error listening to notifications: ", error);
    });
}


// --- SINGLE, UNIFIED DOMCONTENTLOADED LISTENER ---
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
    
    // Admin Panel Links
    const adminPanelLink = document.getElementById('admin-panel-link');
    const mobileAdminPanelLink = document.getElementById('mobile-admin-panel-link');

    // =================================================
    // === DARK MODE TOGGLE LOGIC (FIXED) ===
    // =================================================
    
    // Desktop/Mobile buttons දෙකම class එකෙන් select කරගන්නවා
    const themeToggleBtns = document.querySelectorAll('.theme-toggle-button'); 
    const lightIcons = document.querySelectorAll('.theme-toggle-light-icon');
    const darkIcons = document.querySelectorAll('.theme-toggle-dark-icon');
    // 'theme-toggle-text' ID eka HTML eke tibbe nathi nisa mama eka ain kara

    // Function to set the theme
    function setTheme(isDark) {
        if (isDark) {
            document.body.classList.add('dark');
            // Buttons දෙකේම icons update කරනවා
            lightIcons.forEach(icon => icon.classList.add('hidden'));
            darkIcons.forEach(icon => icon.classList.remove('hidden'));
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            // Buttons දෙකේම icons update කරනවා
            lightIcons.forEach(icon => icon.classList.remove('hidden'));
            darkIcons.forEach(icon => icon.classList.add('hidden'));
            localStorage.setItem('theme', 'light');
        }
    }

    // Add click listener - හම්බවෙන හැම button එකටම දානවා
    if (themeToggleBtns.length > 0) {
        themeToggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Dropdown eka close wenna nathuwa inna
                const isCurrentlyDark = document.body.classList.contains('dark');
                setTheme(!isCurrentlyDark);
            });
        });
    }

    // Page load weddi save karapu theme eka check karanna
    const savedTheme = localStorage.getItem('theme');
    
    // ***** DEFAULT LIGHT MODE FIX *****
    // System eke dark mode on da kiyala balanne nathuwa, 
    // save karala thibboth vitharak dark mode danawa.
    if (savedTheme === 'dark') {
        setTheme(true); // Save වෙලා තියෙන්නේ 'dark' නම් විතරක් dark දාන්න
    } else {
        setTheme(false); // නැත්නම් හැම වෙලේම light (normal) දාන්න
    }
    // === END OF DARK MODE LOGIC ===

    // --- HAMBURGER MENU TOGGLE ---
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- AUTH STATE LISTENER (THE CORE OF THE APP) ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // --- USER IS LOGGED IN ---
            if (userAuthLinks) userAuthLinks.classList.add('hidden');
            if (userProfileInfo) userProfileInfo.classList.remove('hidden');
            if (mobileAuthLinks) mobileAuthLinks.classList.add('hidden');
            if (mobileProfileInfo) mobileProfileInfo.classList.remove('hidden');
            
            listenForNotifications(user.uid);

            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                let userData = {};
                let userRole = 'normal'; // Default to 'normal'

                if (userDoc.exists) {
                    userData = userDoc.data();
                    userRole = userData.role || 'normal';
                }

                // --- ROLE-BASED UI CONTROL ---
                document.body.classList.remove('role-normal', 'role-plus', 'role-pro', 'role-admin');
                document.body.classList.add(`role-${userRole}`);
                console.log(`User role identified. Body class set to: role-${userRole}`);
                // --- END OF ROLE CONTROL ---

                // --- UPDATE USER INFO IN UI ---
                const displayName = userData.displayName || user.displayName || 'User';
                const userEmail = user.email || '';
                let userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8B5E34&color=fff`;
                
                if (userData.photoURL && userData.photoURL.trim() !== '') {
                    userAvatar = userData.photoURL;
                } else if (user.photoURL && user.photoURL.trim() !== '') {
                    userAvatar = user.photoURL;
                }

                const elementsToUpdate = [
                    { id: 'header-user-avatar', prop: 'src', value: userAvatar },
                    { id: 'dropdown-user-avatar', prop: 'src', value: userAvatar },
                    { id: 'dropdown-user-name', prop: 'textContent', value: displayName },
                    { id: 'dropdown-user-email', prop: 'textContent', value: userEmail },
                ];
                elementsToUpdate.forEach(item => {
                    const el = document.getElementById(item.id);
                    if (el) el[item.prop] = item.value;
                });

                // Control "Admin Panel" link visibility
                if (userRole === 'admin' || userRole === 'pro') {
                    if (adminPanelLink) adminPanelLink.classList.remove('hidden');
                    if (mobileAdminPanelLink) mobileAdminPanelLink.classList.remove('hidden');
                } else {
                    if (adminPanelLink) adminPanelLink.classList.add('hidden');
                    if (mobileAdminPanelLink) mobileAdminPanelLink.classList.add('hidden');
                }

            } catch (error) {
                console.error("Error fetching user data:", error);
                document.body.classList.add('role-normal'); // Safe fallback
            }

        } else {
            // --- USER IS LOGGED OUT ---
            if (userAuthLinks) userAuthLinks.classList.remove('hidden');
            if (userProfileInfo) userProfileInfo.classList.add('hidden');
            if (mobileAuthLinks) mobileAuthLinks.classList.remove('hidden');
            if (mobileProfileInfo) mobileProfileInfo.classList.add('hidden');

            document.body.classList.remove('role-normal', 'role-plus', 'role-pro', 'role-admin');

            if (notificationListener) {
                notificationListener(); // Stop listening
            }
        }
    });

    // --- MODAL & FORM LOGIC ---
    const showLoginModal = () => loginModal?.classList.remove('hidden');
    const showSignupModal = () => signupModal?.classList.remove('hidden');

    if (loginBtn) loginBtn.addEventListener('click', showLoginModal);
    if (signupBtn) signupBtn.addEventListener('click', showSignupModal);
    if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', showLoginModal);
    if (mobileSignupBtn) mobileSignupBtn.addEventListener('click', showSignupModal);

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-overlay')?.classList.add('hidden');
        });
    });

    document.getElementById('show-signup-link')?.addEventListener('click', (e) => { e.preventDefault(); loginModal?.classList.add('hidden'); signupModal?.classList.remove('hidden'); });
    document.getElementById('show-login-link')?.addEventListener('click', (e) => { e.preventDefault(); signupModal?.classList.add('hidden'); loginModal?.classList.remove('hidden'); });

    // --- Sign Out Logic ---
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
    document.addEventListener('click', (e) => {
        if (profileDropdownMenu && !profileDropdownMenu.classList.contains('hidden')) {
            const isClickInside = profileDropdownMenu.contains(e.target) || profileDropdownBtn?.contains(e.target);
            if (!isClickInside) {
                profileDropdownMenu.classList.add('hidden');
            }
        }
    });

    // --- Login Form Submission ---
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

    // --- Signup Form Submission ---
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
                
                // Create a corresponding user document in Firestore
                await db.collection('users').doc(user.uid).set({
                    displayName: name,
                    email: email,
                    role: 'normal',
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

    // --- MOBILE CATEGORIES TOGGLE & HIDE ON SCROLL ---
    const categoryNavBar = document.getElementById('category-nav-bar');
    if (categoryNavBar) {
        const toggleCategoriesBtn = document.getElementById('toggle-categories-btn');
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            if (window.innerWidth >= 768) { // Only run on mobile
                categoryNavBar.style.transform = ''; // Reset any mobile transforms
                return;
            }
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                categoryNavBar.classList.add('-translate-y-full');
            } else if (currentScrollY < lastScrollY) {
                categoryNavBar.classList.remove('-translate-y-full');
            }
            lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
        });

        if (toggleCategoriesBtn) {
            toggleCategoriesBtn.addEventListener('click', () => {
                categoryNavBar.classList.toggle('-translate-y-full');
            });
        }
    }
});