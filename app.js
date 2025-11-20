// =================================================================
//    APP.JS - FINAL FULL VERSION (WITH QR LOGIN & ANIMATION)
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
        notificationListener(); // Unsubscribe previous
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
        console.log("Notification sync paused:", error.message);
    });
}

// =================================================
// === QR CODE AUTO LOGIN LOGIC (WITH ANIMATION) ===
// =================================================
function checkQRLogin() {
    const urlParams = new URLSearchParams(window.location.search);
    const isAutoLogin = urlParams.get('autologin');
    const targetUid = urlParams.get('uid');
    const overlay = document.getElementById('qr-login-overlay');

    // URL එකේ autologin=true සහ uid එකක් තියෙනවා නම්
    if (isAutoLogin === 'true' && targetUid) {
        console.log("QR Login Detected. Starting animation...");

        // 1. Animation එක පෙන්වන්න
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }
        
        // දැනටමත් log වී ඇත්නම් නවත්වන්න, නමුත් URL Clean කරන්න
        if (auth.currentUser) {
            window.history.replaceState({}, document.title, "index.html");
            if (overlay) overlay.classList.add('hidden');
            return;
        }

        // 2. තත්පර 2.5 ක Delay එකක් (Animation එක පෙනෙන්න)
        setTimeout(() => {
            db.collection('users').doc(targetUid).get().then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    
                    // --- MANUAL UI UPDATE (To simulate login immediately) ---
                    const userAuthLinks = document.getElementById('user-auth-links');
                    const userProfileInfo = document.getElementById('user-profile-info');
                    
                    if (userAuthLinks) userAuthLinks.classList.add('hidden');
                    if (userProfileInfo) userProfileInfo.classList.remove('hidden');
                    
                    const avatarSrc = userData.photoURL || 'https://via.placeholder.com/40';
                    const displayName = userData.displayName || 'User';
                    
                    // Update Images & Text
                    if (document.getElementById('header-user-avatar')) document.getElementById('header-user-avatar').src = avatarSrc;
                    if (document.getElementById('dropdown-user-avatar')) document.getElementById('dropdown-user-avatar').src = avatarSrc;
                    if (document.getElementById('dropdown-user-name')) document.getElementById('dropdown-user-name').textContent = displayName;
                    
                    // Mobile Menu Update
                    const mobileAuthLinks = document.getElementById('mobile-auth-links');
                    const mobileProfileInfo = document.getElementById('mobile-profile-info');
                    if (mobileAuthLinks) mobileAuthLinks.classList.add('hidden');
                    if (mobileProfileInfo) mobileProfileInfo.classList.remove('hidden');

                    // Update Profile Links
                    const profileLinks = document.querySelectorAll('a[href="profile.html"]');
                    profileLinks.forEach(link => link.href = `profile.html?uid=${targetUid}`);

                    // 3. Animation එක හංගන්න
                    if (overlay) {
                        overlay.classList.add('hidden');
                        overlay.classList.remove('flex');
                    }

                    // Alert User
                    alert(`Success! Linked to ${displayName}`);

                    // URL එක Clean කරන්න
                    window.history.replaceState({}, document.title, "index.html");

                } else {
                    alert("User not found!");
                    if (overlay) overlay.classList.add('hidden');
                }
            }).catch((error) => {
                console.error("Login Error:", error);
                if (overlay) overlay.classList.add('hidden');
            });

        }, 2500); // 2.5 Seconds Delay
    }
}

// --- MAIN DOMCONTENTLOADED LISTENER ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("app.js (Core) Script Loaded!");

    // --- ELEMENT SELECTORS ---
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    
    // Desktop
    const userAuthLinks = document.getElementById('user-auth-links');
    const userProfileInfo = document.getElementById('user-profile-info');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileDropdownBtn = document.getElementById('profile-dropdown-btn');
    const profileDropdownMenu = document.getElementById('profile-dropdown-menu');

    // Mobile
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileAuthLinks = document.getElementById('mobile-auth-links');
    const mobileProfileInfo = document.getElementById('mobile-profile-info');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const mobileSignupBtn = document.getElementById('mobile-signup-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    
    // Admin Panel
    const adminPanelLink = document.getElementById('admin-panel-link');
    const mobileAdminPanelLink = document.getElementById('mobile-admin-panel-link');

    // =================================================
    // === DARK MODE LOGIC ===
    // =================================================
    
    const themeToggleBtns = document.querySelectorAll('.theme-toggle-button'); 
    const lightIcons = document.querySelectorAll('.theme-toggle-light-icon');
    const darkIcons = document.querySelectorAll('.theme-toggle-dark-icon');

    function setTheme(isDark) {
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
            lightIcons.forEach(icon => icon.classList.add('hidden'));
            darkIcons.forEach(icon => icon.classList.remove('hidden'));
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
            lightIcons.forEach(icon => icon.classList.remove('hidden'));
            darkIcons.forEach(icon => icon.classList.add('hidden'));
            localStorage.setItem('theme', 'light');
        }
    }

    if (themeToggleBtns.length > 0) {
        themeToggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isCurrentlyDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
                setTheme(!isCurrentlyDark);
            });
        });
    }

    // Initial Theme Check
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        setTheme(true);
    } else {
        setTheme(false);
    }
    // =================================================

    // --- HAMBURGER MENU TOGGLE ---
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- AUTH STATE LISTENER ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // === USER LOGGED IN ===
            if (userAuthLinks) userAuthLinks.classList.add('hidden');
            if (userProfileInfo) userProfileInfo.classList.remove('hidden');
            if (mobileAuthLinks) mobileAuthLinks.classList.add('hidden');
            if (mobileProfileInfo) mobileProfileInfo.classList.remove('hidden');
            
            listenForNotifications(user.uid);

            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                let userData = {};
                let userRole = 'normal';

                if (userDoc.exists) {
                    userData = userDoc.data();
                    userRole = userData.role || 'normal';
                }

                // Role Classes
                document.body.classList.remove('role-normal', 'role-plus', 'role-pro', 'role-admin');
                document.body.classList.add(`role-${userRole}`);
                
                // Update UI
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

                // Admin Panel Visibility
                const isAdminOrPro = (userRole === 'admin' || userRole === 'pro');
                if (adminPanelLink) isAdminOrPro ? adminPanelLink.classList.remove('hidden') : adminPanelLink.classList.add('hidden');
                if (mobileAdminPanelLink) isAdminOrPro ? mobileAdminPanelLink.classList.remove('hidden') : mobileAdminPanelLink.classList.add('hidden');

            } catch (error) {
                console.error("Error fetching user data:", error);
                document.body.classList.add('role-normal'); 
            }

        } else {
            // === USER LOGGED OUT ===
            if (userAuthLinks) userAuthLinks.classList.remove('hidden');
            if (userProfileInfo) userProfileInfo.classList.add('hidden');
            if (mobileAuthLinks) mobileAuthLinks.classList.remove('hidden');
            if (mobileProfileInfo) mobileProfileInfo.classList.add('hidden');

            document.body.classList.remove('role-normal', 'role-plus', 'role-pro', 'role-admin');

            if (notificationListener) notificationListener(); 
        }
    });

    // --- MODAL CONTROLS ---
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

    document.getElementById('show-signup-link')?.addEventListener('click', (e) => { 
        e.preventDefault(); 
        loginModal?.classList.add('hidden'); 
        signupModal?.classList.remove('hidden'); 
    });
    document.getElementById('show-login-link')?.addEventListener('click', (e) => { 
        e.preventDefault(); 
        signupModal?.classList.add('hidden'); 
        loginModal?.classList.remove('hidden'); 
    });

    // --- SIGN OUT ---
    const signOutUser = async () => {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Sign out error", error);
        }
    };

    if (logoutBtn) logoutBtn.addEventListener('click', signOutUser);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', signOutUser);
    
    // --- DROPDOWN ---
    if (profileDropdownBtn && profileDropdownMenu) {
        profileDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdownMenu.classList.toggle('hidden');
        });
    }
    document.addEventListener('click', (e) => {
        if (profileDropdownMenu && !profileDropdownMenu.classList.contains('hidden')) {
            const isClickInside = profileDropdownMenu.contains(e.target) || profileDropdownBtn?.contains(e.target);
            if (!isClickInside) profileDropdownMenu.classList.add('hidden');
        }
    });

    // --- LOGIN FORM ---
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
                if (loginError) loginError.textContent = "Invalid email or password.";
            }
        });
    }

    // --- SIGNUP FORM ---
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
                    displayName: name,
                    email: email,
                    role: 'normal',
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

    // --- MOBILE CATEGORY NAV ---
    const categoryNavBar = document.getElementById('category-nav-bar');
    if (categoryNavBar) {
        const toggleCategoriesBtn = document.getElementById('toggle-categories-btn');
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            if (window.innerWidth >= 768) { 
                categoryNavBar.style.transform = ''; 
                categoryNavBar.classList.remove('-translate-y-full');
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

    // --- INIT QR CHECK ---
    // Run checkQRLogin after a short delay to ensure Firebase is ready
    setTimeout(checkQRLogin, 500);
});