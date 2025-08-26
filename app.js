// =================================================================
//     APP.JS - CORE/GLOBAL LOGIC (FINAL & CORRECTED)
// =================================================================

// Initialize Firebase and create global variables for other scripts to use
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

// --- YOUR IMGBB API KEY IS DEFINED HERE ---
const IMGBB_API_KEY = '8fb17a65d31f9a5e7b81c80861f9075f';


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

    // --- SINGLE AUTH STATE LISTENER ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is logged in
            if (userAuthLinks) userAuthLinks.classList.add('hidden');
            if (userProfileInfo) userProfileInfo.classList.remove('hidden');

              if (typeof checkInitialLikeStatus === 'function') {
        checkInitialLikeStatus(user);
    }

            const userDoc = await db.collection('users').doc(user.uid).get();
            let userData = {};
            if (userDoc.exists) {
                userData = userDoc.data();
            }

            const userAvatar = userData.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || user.displayName || 'U')}&background=random`;
            const userName = userData.displayName || user.displayName || 'User';
            const userEmail = user.email || '';

            // Update header elements only if they exist on the current page
            const headerAvatar = document.getElementById('header-user-avatar');
            const dropdownAvatar = document.getElementById('dropdown-user-avatar');
            const dropdownName = document.getElementById('dropdown-user-name');
            const dropdownEmail = document.getElementById('dropdown-user-email');
            const adminPanelLink = document.getElementById('admin-panel-link');

            if (headerAvatar) headerAvatar.src = userAvatar;
            if (dropdownAvatar) dropdownAvatar.src = userAvatar;
            if (dropdownName) dropdownName.textContent = userName;
            if (dropdownEmail) dropdownEmail.textContent = userEmail;

            // Check for admin role and show/hide the admin link
            if (adminPanelLink) {
                if (userData.role === 'admin') {
                    adminPanelLink.classList.remove('hidden');
                    console.log("DEBUG: User is an admin. Showing link.");
                } else {
                    adminPanelLink.classList.add('hidden');
                    console.log("DEBUG: User is not an admin. Hiding link.");
                }
            }

        } else {
            // User is logged out
            if (userAuthLinks) userAuthLinks.classList.remove('hidden');
            if (userProfileInfo) userProfileInfo.classList.add('hidden');
        }
    });

    // --- MODAL & FORM LOGIC (Only runs if elements exist) ---

    if (loginModal && signupModal) {
        const loginBtn = document.getElementById('login-btn');
        const signupBtn = document.getElementById('signup-btn');
        const loginModalCloseBtn = loginModal.querySelector('.close-modal-btn');
        const signupModalCloseBtn = signupModal.querySelector('.close-modal-btn');
        const showSignupLink = document.getElementById('show-signup-link');
        const showLoginLink = document.getElementById('show-login-link');

        if (loginBtn) loginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
        if (signupBtn) signupBtn.addEventListener('click', () => signupModal.classList.remove('hidden'));
        if (loginModalCloseBtn) loginModalCloseBtn.addEventListener('click', () => loginModal.classList.add('hidden'));
        if (signupModalCloseBtn) signupModalCloseBtn.addEventListener('click', () => signupModal.classList.add('hidden'));
        if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); loginModal.classList.add('hidden'); signupModal.classList.remove('hidden'); });
        if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); signupModal.classList.add('hidden'); loginModal.classList.remove('hidden'); });

        window.addEventListener('click', (e) => {
            if (e.target === loginModal) loginModal.classList.add('hidden');
            if (e.target === signupModal) signupModal.classList.add('hidden');
        });
    }

    if (loginForm) {
        const loginError = document.getElementById('login-error');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;
            if(loginError) loginError.textContent = '';
            try {
                await auth.signInWithEmailAndPassword(email, password);
                if(loginModal) loginModal.classList.add('hidden');
            } catch (err) {
                if(loginError) loginError.textContent = err.message;
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
            if(signupError) signupError.textContent = '';
            try {
                const res = await auth.createUserWithEmailAndPassword(email, password);
                const user = res.user;

                await user.updateProfile({ displayName: name });
                
                // Create user document in Firestore with 'user' role
                await db.collection('users').doc(user.uid).set({
                    displayName: name,
                    email: email,
                    role: 'user', // Default role for new users
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                if(signupModal) signupModal.classList.add('hidden');
            } catch (err) {
                if(signupError) signupError.textContent = err.message;
            }
        });
    }

    // --- OTHER LISTENERS ---

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.signOut());
    }

    if (profileDropdownBtn && profileDropdownMenu) {
        profileDropdownBtn.addEventListener('click', () => {
            profileDropdownMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!profileDropdownBtn.contains(e.target) && !profileDropdownMenu.contains(e.target)) {
                profileDropdownMenu.classList.add('hidden');
            }
        });
    }
    
    // TinyMCE focus fix
    document.addEventListener('focusin', (e) => {
        if (e.target.closest(".tox-tinymce-aux, .moxman-window, .tam-assetmanager-root") !== null) {
            e.stopImmediatePropagation();
        }
    });
});