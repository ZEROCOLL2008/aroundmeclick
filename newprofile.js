// =================================================================
//     PROFILE.JS - CORRECTED & RESTRUCTURED SCRIPT
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    let commentsListener = null;

    // 1. FIREBASE CONFIG & INIT
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
    const IMGBB_API_KEY = '8fb17a65d31f9a5e7b81c80861f9075f';
    console.log("Profile Page Script Initialized with Firebase Config!");

    // 2. ELEMENT SELECTORS
    const userAuthLinks = document.getElementById('user-auth-links');
    const userProfileInfo = document.getElementById('user-profile-info');
    const logoutBtn = document.getElementById('logout-btn');
    const profileDropdownBtn = document.getElementById('profile-dropdown-btn');
    const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
    
    // Profile Page Content
    const profileBanner = document.getElementById('profile-banner');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileDisplayName = document.getElementById('profile-display-name');
    const profileEmail = document.getElementById('profile-email');
    const profileBio = document.getElementById('profile-bio');
    const myPostsGrid = document.getElementById('my-posts-grid');
    
    // Edit Profile Modal
    const editProfileModal = document.getElementById('edit-profile-modal');
    const openEditModalBtn = document.getElementById('open-edit-modal-btn');
    const editProfileForm = document.getElementById('edit-profile-form');
    const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
    const coverPhotoInput = document.getElementById('cover-photo-input');
    const avatarPhotoInput = document.getElementById('avatar-photo-input');
    const coverPreview = document.getElementById('cover-preview');
    const avatarPreview = document.getElementById('avatar-preview');
    
    // Create Post Modal Elements
    const createPostModal = document.getElementById('create-post-modal');
    const createPostForm = document.getElementById('create-post-form');
    const openModalBtns = [
        document.getElementById('open-create-modal-main-btn'),
        document.getElementById('open-create-modal-article-btn'),
        document.getElementById('open-create-modal-media-btn'),
        document.getElementById('header-create-post-btn')
    ];
    const closeCreateModalBtn = document.getElementById('close-create-modal-btn');
    const publishPostBtn = document.getElementById('publish-post-btn');
    const postImageInput = document.getElementById('post-image-input');
    const imagePreviewContainer = document.getElementById('image-preview-container');

    let uploadedFiles = [];
    let newAvatarFile = null;
    let newCoverFile = null;

    // Edit Post Modal
    const editPostModal = document.getElementById('edit-post-modal');
    const editPostForm = document.getElementById('edit-post-form');
    const closeEditPostModalBtn = document.getElementById('close-edit-post-modal');
    const updatePostBtn = document.getElementById('update-post-btn');
    
    // Post View Modal
    const postViewModal = document.getElementById('post-view-modal');
    const closeViewModalBtn = document.getElementById('close-view-modal-btn');

    // =================================================================
    // 3. FUNCTION DEFINITIONS
    // =================================================================

    function displayProfileData(userData, user) {
        const avatarUrl = userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'U')}&background=random`;
        if(profileBanner) profileBanner.src = userData.coverPhotoURL || 'https://picsum.photos/1200/400';
        if(profileAvatar) profileAvatar.src = avatarUrl;
        if(profileDisplayName) profileDisplayName.textContent = userData.displayName || 'No Name Set';
        if(profileEmail) profileEmail.textContent = user.email;
        if(profileBio) profileBio.textContent = userData.bio || "This user hasn't written a bio yet.";
    }

    async function loadUserPosts(userId) {
        if (!myPostsGrid) return;
        myPostsGrid.innerHTML = '<p class="text-slate-500 col-span-full">Loading your posts...</p>';
        try {
            const snapshot = await db.collection('posts').where('authorId', '==', userId).orderBy('createdAt', 'desc').get();
            myPostsGrid.innerHTML = '';
            if (snapshot.empty) {
                myPostsGrid.innerHTML = '<p class="text-slate-500 col-span-full">You have not written any posts yet.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const post = { id: doc.id, ...doc.data() };
                const article = document.createElement('article');
                article.className = "bg-white rounded-lg shadow-md overflow-hidden flex flex-col";
                article.innerHTML = `
                <div class="relative overflow-hidden h-48 bg-slate-200 cursor-pointer view-post-trigger" data-post-id="${post.id}">
                    <img src="${post.imageUrl || 'https://picsum.photos/400/300'}" alt="Blog post image" class="w-full h-full object-cover transition-transform duration-300 hover:scale-110">
                    <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold uppercase ${post.status === 'pending' ? 'bg-amber-500 text-white' : post.status === 'approved' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}">${post.status}</span>
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <h3 class="font-bold text-lg text-slate-800 truncate flex-grow cursor-pointer view-post-trigger" data-post-id="${post.id}">${post.title}</h3>
                    <div class="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                        <div class="flex space-x-4 text-sm text-gray-500">
                            <span title="Likes">❤️ ${post.likesCount || 0}</span>
                            <span title="Comments">💬 ${post.commentsCount || 0}</span>
                        </div>
                        <div class="relative">
                            <button class="post-menu-button p-1 rounded-full hover:bg-gray-200">
                                <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                            </button>
                            <div class="post-menu hidden absolute right-0 bottom-full mb-2 w-32 bg-white rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5">
                                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 edit-post-btn" data-id="${post.id}">Edit</a>
                                <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 delete-post-btn" data-id="${post.id}">Delete</a>
                            </div>
                        </div>
                    </div>
                </div>`;
                myPostsGrid.appendChild(article);
            });
        } catch (error) {
            console.error("Error loading user posts:", error);
            myPostsGrid.innerHTML = '<p class="text-red-500 col-span-full">Could not load posts. Please try again.</p>';
        }
    }

    const openPostViewModal = async (postId) => {
        const commentForm = document.getElementById('comment-form');
        if (!postViewModal || !commentForm) return;
        const postDoc = await db.collection('posts').doc(postId).get();
        if (!postDoc.exists) return;
        const post = postDoc.data();
        const user = auth.currentUser;
        commentForm.dataset.postId = postId;
        document.getElementById('view-modal-title').textContent = post.title;
        const modalImageContainer = document.getElementById('view-modal-image-container');
        const modalImage = document.getElementById('view-modal-image');
        if (post.imageUrl) {
            modalImage.src = post.imageUrl;
            modalImageContainer.classList.remove('hidden');
        } else {
            modalImageContainer.classList.add('hidden');
        }
        document.getElementById('view-modal-description').innerHTML = post.content;
        if (user) {
            document.getElementById('comment-user-avatar').src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}`;
        }
        loadComments(postId);
        postViewModal.classList.remove('hidden');
    };

    const loadComments = (postId) => {
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        commentsList.innerHTML = '<p class="text-sm text-gray-500">Loading comments...</p>';
        if (commentsListener) commentsListener();
        commentsListener = db.collection('posts').doc(postId).collection('comments').orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                commentsList.innerHTML = snapshot.empty ? '<p class="text-sm text-gray-500">No comments yet.</p>' : '';
                snapshot.forEach(doc => {
                    const comment = doc.data();
                    const commentDiv = document.createElement('div');
                    commentDiv.className = 'flex items-start space-x-3';
                    commentDiv.innerHTML = `
                        <img src="${comment.authorAvatar || 'https://ui-avatars.com/api/?name=User'}" alt="Author Avatar" class="w-10 h-10 rounded-full">
                        <div class="flex-1 bg-gray-100 rounded-lg p-3">
                            <p class="font-semibold text-sm text-gray-800">${comment.authorName}</p>
                            <p class="text-sm text-gray-700 mt-1 whitespace-pre-wrap">${comment.text}</p>
                        </div>`;
                    commentsList.appendChild(commentDiv);
                });
            });
    };
    
    // ... (Your other functions like deletePost, openEditModal, etc. would go here)
    // For brevity, I'll skip re-pasting them, assuming they are correct. Place your existing
    // deletePost, openEditModal, and form submission functions here.
    
    // =================================================================
    // 4. EVENT LISTENERS
    // =================================================================
    
    // Single delegated event listener for all actions on the posts grid
    if (myPostsGrid) {
        myPostsGrid.addEventListener('click', async (e) => {
            const viewTrigger = e.target.closest('.view-post-trigger');
            const editBtn = e.target.closest('.edit-post-btn');
            const deleteBtn = e.target.closest('.delete-post-btn');
            const menuBtn = e.target.closest('.post-menu-button');

            if (menuBtn) {
                 const menu = menuBtn.nextElementSibling;
                 if(menu) menu.classList.toggle('hidden');
            }
            if (viewTrigger) {
                const postId = viewTrigger.dataset.postId;
                if (postId) openPostViewModal(postId);
            }
            if (editBtn) {
                e.preventDefault();
                const postId = editBtn.dataset.id;
                // if (postId) openEditModal(postId); // Assuming you have openEditModal function
            }
            if (deleteBtn) {
                e.preventDefault();
                const postId = deleteBtn.dataset.id;
                if (postId && confirm("Are you sure you want to delete this post?")) {
                    // await deletePost(postId); // Assuming you have deletePost function
                }
            }
        });
    }

    // Modal closing listeners
    if (closeViewModalBtn) {
        closeViewModalBtn.addEventListener('click', () => {
            if(postViewModal) postViewModal.classList.add('hidden');
        });
    }
    if (postViewModal) {
        postViewModal.addEventListener('click', (e) => {
            if (e.target === postViewModal) postViewModal.classList.add('hidden');
        });
    }

    // ... (Your other event listeners for profile edit, post creation modals etc. go here)
    // For brevity, skipping re-pasting them.
    
    // =================================================================
    // 5. SCRIPT INITIALIZATION (RUNS ON PAGE LOAD)
    // =================================================================
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            if(userAuthLinks) userAuthLinks.classList.add('hidden');
            if(userProfileInfo) userProfileInfo.classList.remove('hidden');
            const userDocRef = db.collection('users').doc(user.uid);
            const docSnap = await userDocRef.get();
            if (docSnap.exists) {
                const userData = docSnap.data();
                displayProfileData(userData, user);
                loadUserPosts(user.uid);
                
                const avatarUrl = userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'U')}&background=random`;
                const displayName = userData.displayName || 'Anonymous';

                if(document.getElementById('header-user-avatar')) document.getElementById('header-user-avatar').src = avatarUrl;
                if(document.getElementById('widget-user-avatar')) document.getElementById('widget-user-avatar').src = avatarUrl;
                if(document.getElementById('modal-user-avatar')) document.getElementById('modal-user-avatar').src = avatarUrl;
                if(document.getElementById('modal-user-name')) document.getElementById('modal-user-name').textContent = displayName;
            } else {
                console.log("No user document in Firestore. Showing default info from auth.");
                if(profileDisplayName) profileDisplayName.textContent = user.displayName || 'New User';
                if(profileEmail) profileEmail.textContent = user.email;
                loadUserPosts(user.uid);
            }
        } else {
            window.location.href = 'index.html';
        }
    });
});