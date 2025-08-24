// =================================================================
//     APP.JS - CORE/GLOBAL LOGIC
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


// This part runs after the HTML document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("app.js (Core) Script Loaded!");

    // ELEMENT SELECTORS for global items like login/signup modals and header
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const userAuthLinks = document.getElementById('user-auth-links');
    const userProfileInfo = document.getElementById('user-profile-info');
    
    // AUTH STATE LISTENER (Controls the header)
    auth.onAuthStateChanged(user => {
        if (user) {
            userAuthLinks.classList.add('hidden');
            userProfileInfo.classList.remove('hidden');
            
            // User avatar and name update
            const userAvatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=random`;
            const userName = user.displayName || 'User';
            const userEmail = user.email || '';

            document.getElementById('header-user-avatar').src = userAvatar;
            document.getElementById('dropdown-user-avatar').src = userAvatar;
            document.getElementById('dropdown-user-name').textContent = userName;
            document.getElementById('dropdown-user-email').textContent = userEmail;

        } else {
            userAuthLinks.classList.remove('hidden');
            userProfileInfo.classList.add('hidden');
        }
    });

    // ===============================================================
    //           MODAL LOGIC AND EVENT LISTENERS
    // ===============================================================
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const loginModalCloseBtn = loginModal.querySelector('.close-modal-btn');
    const signupModalCloseBtn = signupModal.querySelector('.close-modal-btn');
    const showSignupLink = document.getElementById('show-signup-link');
    const showLoginLink = document.getElementById('show-login-link');

    // Open/Close Modals
    if (loginBtn) loginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
    if (signupBtn) signupBtn.addEventListener('click', () => signupModal.classList.remove('hidden'));
    if (loginModalCloseBtn) loginModalCloseBtn.addEventListener('click', () => loginModal.classList.add('hidden'));
    if (signupModalCloseBtn) signupModalCloseBtn.addEventListener('click', () => signupModal.classList.add('hidden'));
    
    // Switch between modals
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.add('hidden');
            signupModal.classList.remove('hidden');
        });
    }
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupModal.classList.add('hidden');
            loginModal.classList.remove('hidden');
        });
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.classList.add('hidden');
        if (e.target === signupModal) signupModal.classList.add('hidden');
    });

    // ===============================================================
    //               AUTHENTICATION FUNCTIONS
    // ===============================================================
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const signupForm = document.getElementById('signup-form');
    const signupError = document.getElementById('signup-error');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Login User
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;
            loginError.textContent = '';
            try {
                await auth.signInWithEmailAndPassword(email, password);
                loginModal.classList.add('hidden');
            } catch (err) {
                loginError.textContent = err.message;
            }
        });
    }

    // Signup User
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = signupForm['signup-name'].value;
            const email = signupForm['signup-email'].value;
            const password = signupForm['signup-password'].value;
            signupError.textContent = '';
            try {
                const res = await auth.createUserWithEmailAndPassword(email, password);
                const user = res.user;

                // Update user profile with display name
                await user.updateProfile({
                    displayName: name,
                });
                
                signupModal.classList.add('hidden');
            } catch (err) {
                signupError.textContent = err.message;
            }
        });
    }
    
    // Logout User
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await auth.signOut();
            } catch (err) {
                console.error("Logout Error:", err);
            }
        });
    }

  // ===============================================================
//            PROFILE DROPDOWN LOGIC
// ===============================================================
const profileDropdownBtn = document.getElementById('profile-dropdown-btn');
const profileDropdownMenu = document.getElementById('profile-dropdown-menu');

if (profileDropdownBtn && profileDropdownMenu) {
    profileDropdownBtn.addEventListener('click', () => {
        // Dropdown menu එක hidden class එක toggle කරනවා.
        profileDropdownMenu.classList.toggle('hidden');
    });
    
    // dropdown එකෙන් පිටත click කළ විට එය වසනවා.
    document.addEventListener('click', (e) => {
        // e.target එක profileDropdownBtn හෝ profileDropdownMenu එකේ කොටසක් නොවේ නම් dropdown එක වසන්න.
        if (!profileDropdownBtn.contains(e.target) && !profileDropdownMenu.contains(e.target)) {
            profileDropdownMenu.classList.add('hidden');
        }
    });
}

    // ===============================================================
    //     FIX FOR TINYMCE IN MODAL (CAN'T TYPE ISSUE)
    // ===============================================================
    // This prevents the modal from trapping focus and allows you to type in the TinyMCE editor.
    document.addEventListener('focusin', (e) => {
        if (e.target.closest(".tox-tinymce-aux, .moxman-window, .tam-assetmanager-root") !== null) {
            e.stopImmediatePropagation();
        }
    });
});