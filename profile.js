document.addEventListener('DOMContentLoaded', () => {
    let commentsListener = null;

    // --- 1. FIREBASE CONFIG ---
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

    // --- 2. ELEMENT SELECTORS (ALL) ---

    // Header/Auth Links
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
    
    // Profile Content Sections
    const creatorPostsSection = document.getElementById('creator-posts-section');
    const normalUserApplySection = document.getElementById('normal-user-apply-section');
    const myPostsGrid = document.getElementById('my-posts-grid');
    
    // Profile Tabs
    const myPostsTab = document.getElementById('my-posts-tab');
    const likedPostsTab = document.getElementById('liked-posts-tab');

    // Edit Profile Modal
    const editProfileModal = document.getElementById('edit-profile-modal');
    const openEditModalBtn = document.getElementById('open-edit-modal-btn');
    const editProfileForm = document.getElementById('edit-profile-form');
    const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const coverPhotoInput = document.getElementById('cover-photo-input');
    const avatarPhotoInput = document.getElementById('avatar-photo-input');
    const coverPreview = document.getElementById('cover-preview');
    const avatarPreview = document.getElementById('avatar-preview');
    
    // Create Post Modal
    const createPostModal = document.getElementById('create-post-modal');
    const createPostForm = document.getElementById('create-post-form');
    const openModalBtns = [
        document.getElementById('open-create-modal-main-btn'),
        document.getElementById('open-create-modal-article-btn'),
        document.getElementById('open-create-modal-media-btn'),
        document.getElementById('header-create-post-btn'),
        document.getElementById('open-create-modal-bottom-nav') // Bottom nav create button
    ];
    const closeCreateModalBtn = document.getElementById('close-create-modal-btn');
    const publishPostBtn = document.getElementById('publish-post-btn');
    const postImageInput = document.getElementById('post-image-input');
    const imagePreviewContainer = document.getElementById('image-preview-container');

    // Edit Post Modal
    const editPostModal = document.getElementById('edit-post-modal');
    const editPostForm = document.getElementById('edit-post-form');
    const closeEditPostModalBtn = document.getElementById('close-edit-post-modal');
    const updatePostBtn = document.getElementById('update-post-btn');
    
    // View Post Modal
    const postViewModal = document.getElementById('post-view-modal');
    const closeViewModalBtn = document.getElementById('close-view-modal-btn');

    // Application Modals
    const applyToPlusBtn = document.getElementById('apply-to-plus-btn');
    const applyToPlusBtnMain = document.getElementById('apply-to-plus-btn-main');
    const plusApplicationModal = document.getElementById('plus-application-modal');
    const closeApplicationModalBtn = document.getElementById('close-application-modal-btn');
    const plusApplicationForm = document.getElementById('plus-application-form');
    const applyToProBtn = document.getElementById('apply-to-pro-btn');
    const proApplicationModal = document.getElementById('pro-application-modal');
    const closeProApplicationModalBtn = document.getElementById('close-pro-application-modal-btn');
    const proApplicationForm = document.getElementById('pro-application-form');

    // --- Share Modal Selectors ---
    const shareProfileBtn = document.getElementById('share-profile-btn');
    const shareProfileModal = document.getElementById('share-profile-modal');
    const closeShareProfileModalBtn = shareProfileModal ? shareProfileModal.querySelector('.close-share-modal') : null;
    const shareProfileLinkInput = document.getElementById('share-profile-link-input');
    const copyProfileLinkBtn = document.getElementById('copy-profile-link-btn');
    const facebookProfileShareBtn = document.getElementById('facebook-profile-share-btn');
    const whatsappProfileShareBtn = document.getElementById('whatsapp-profile-share-btn');

    // --- Drawer / Common UI Selectors ---
    const hamburgerBtn = document.getElementById('mobile-hamburger-btn');
    const leftDrawerBackdrop = document.getElementById('left-drawer-backdrop');
    const leftDrawer = document.getElementById('left-drawer');
    const closeLeftDrawerBtn = document.getElementById('close-drawer-btn');
    const mobileSearchBtn = document.getElementById('mobile-search-btn');
    const desktopSearchBtn = document.getElementById('desktop-search-btn');
    const searchDrawer = document.getElementById('search-drawer');
    const searchDrawerBackdrop = document.getElementById('search-drawer-backdrop');
    const closeSearchDrawerBtn = document.getElementById('close-search-drawer-btn');
    const searchDrawerInput = document.getElementById('search-drawer-input');
    const searchSuggestionsContainer = document.getElementById('search-suggestions-container');
    const mobileSearchForm = document.getElementById('mobile-search-form');
    const bottomNavLoginBtn = document.getElementById('bottom-nav-login-btn');
    const bottomNavProfileLink = document.getElementById('bottom-nav-profile-link');
    const bottomNavAvatar = document.getElementById('bottom-nav-avatar');
    const drawerLoginBtn = document.getElementById('drawer-login-btn');
    const drawerLogoutBtn = document.getElementById('drawer-logout-btn');
    const drawerProfileInfo = document.getElementById('drawer-profile-info');
    const drawerAuthLinks = document.getElementById('drawer-auth-links');
    const notificationBellBtn = document.getElementById('notification-bell-btn');
    const notificationDrawer = document.getElementById('notification-drawer');
    const notificationDrawerBackdrop = document.getElementById('notification-drawer-backdrop');
    const closeNotificationDrawerBtn = document.getElementById('close-notification-drawer-btn');
    const authDrawer = document.getElementById('auth-drawer');
    const authDrawerBackdrop = document.getElementById('auth-drawer-backdrop');
    const closeAuthDrawerBtn = document.getElementById('close-auth-drawer-btn');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const authLoginView = document.getElementById('auth-drawer-login-view');
    const authSignupView = document.getElementById('auth-drawer-signup-view');
    const authResetView = document.getElementById('auth-drawer-reset-view');
    const authShowSignupLinks = document.querySelectorAll('#auth-show-signup-link');
    const authShowLoginLinks = document.querySelectorAll('#auth-show-login-link');
    const authShowResetLinks = document.querySelectorAll('#auth-show-reset-link');
    const authBackToLoginLinks = document.querySelectorAll('#auth-back-to-login-link');
    const themeToggleButtons = document.querySelectorAll('.theme-toggle-button');
    const lightIcon = document.querySelectorAll('.theme-toggle-light-icon');
    const darkIcon = document.querySelectorAll('.theme-toggle-dark-icon');

    let uploadedFiles = [];
    let newAvatarFile = null;
    let newCoverFile = null;
    let currentProfileUid = null; // Profile eka view karana userge ID eka

    // --- 3. HELPER FUNCTIONS ---

    function createSnippet(html, length = 100) {
        if (!html) return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }

    function calculateReadTime(html) {
        if (!html) return '1 min read';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        const wordsPerMinute = 200;
        const wordCount = text.trim().split(/\s+/).length;
        const readTime = Math.ceil(wordCount / wordsPerMinute);
        if (readTime < 1) return '1 min read';
        return `${readTime} min read`;
    }

    function getYouTubeVideoId(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    function displayProfileData(userData, user) {
        const avatarUrl = userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'U')}&background=random`;
        if(profileBanner) profileBanner.src = userData.coverPhotoURL || 'https://picsum.photos/1200/400';
        if(profileAvatar) profileAvatar.src = avatarUrl;
        if(profileDisplayName) profileDisplayName.textContent = userData.displayName || 'No Name Set';
        if(profileEmail) profileEmail.textContent = user.email || (userData.email || '...');
        if(profileBio) profileBio.textContent = userData.bio || "This user hasn't written a bio yet.";

        if(document.getElementById('followers-count')) document.getElementById('followers-count').textContent = userData.followersCount || 0;
        if(document.getElementById('following-count')) document.getElementById('following-count').textContent = userData.followingCount || 0;
    }

    // --- 4. DATA LOADING FUNCTIONS ---

    async function loadUserPosts(userId, isOwner) {
        if (!myPostsGrid) return;
        myPostsGrid.innerHTML = `<div class="loader col-span-full mx-auto"></div>`;
        try {
            const snapshot = await db.collection('posts').where('authorId', '==', userId).orderBy('createdAt', 'desc').get();
            myPostsGrid.innerHTML = '';
            if (snapshot.empty) {
                myPostsGrid.innerHTML = `<p class="text-classic-taupe col-span-full text-center">This user hasn't written any posts yet.</p>`;
                return;
            }
            snapshot.forEach(doc => {
                const post = { id: doc.id, ...doc.data() };
                // Public view ekedi status eka 'approved' nattam pennanna epa
                if (isOwner || post.status === 'approved') {
                    const postCard = createPostCard(post, isOwner); // Owner ta witharai menu eka pennanne
                    myPostsGrid.appendChild(postCard);
                }
            });
        } catch (error) {
            console.error("Error loading user posts:", error);
            myPostsGrid.innerHTML = '<p class="text-red-500 col-span-full text-center">Could not load posts. Please try again.</p>';
        }
    }

    async function loadLikedPosts(userId) {
        if (!myPostsGrid) return;
        myPostsGrid.innerHTML = `<div class="loader col-span-full mx-auto"></div>`;
        try {
            const snapshot = await db.collection('posts')
                .where('likedBy', 'array-contains', userId)
                .where('status', '==', 'approved') // Liked posts pennuwath approved ewa witharak pennanna
                .orderBy('createdAt', 'desc')
                .get();
                
            myPostsGrid.innerHTML = '';
            if (snapshot.empty) {
                myPostsGrid.innerHTML = '<p class="text-classic-taupe col-span-full text-center">You have not liked any posts yet.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const post = { id: doc.id, ...doc.data() };
                const postCard = createPostCard(post, false); // Liked posts waladi menu pennanna epa
                myPostsGrid.appendChild(postCard);
            });
        } catch (error) {
            console.error("Error loading liked posts:", error);
            myPostsGrid.innerHTML = '<p class="text-red-500 col-span-full text-center">Could not load liked posts.</p>';
        }
    }

    // --- 5. UI CREATION FUNCTIONS ---

    function createPostCard(post, showMenu) {
        const mediaHtml = post.youtubeVideoId
            ? `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${post.youtubeVideoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
            : `<img src="${post.imageUrl || 'https://picsum.photos/400/300'}" alt="Blog post image" class="w-full h-full object-cover">`;

        const snippet = createSnippet(post.content, 80);
        const readTime = calculateReadTime(post.content);
        const category = post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'General';
        
        const statusColors = {
            pending: 'bg-amber-500 text-white',
            approved: 'bg-green-500 text-white',
            rejected: 'bg-red-500 text-white'
        };
        const statusClass = statusColors[post.status] || 'bg-gray-500 text-white';

        const menuButtonHtml = `
            <div class="relative">
                <button class="post-menu-button p-1 rounded-full hover:bg-gray-200">
                    <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                </button>
                <div class="post-menu hidden absolute right-0 bottom-full mb-2 w-32 bg-white rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5">
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 edit-post-btn" data-id="${post.id}">Edit</a>
                    <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 delete-post-btn" data-id="${post.id}">Delete</a>
                </div>
            </div>
        `;

        const article = document.createElement('article');
        article.className = "bg-white rounded-xl shadow-lg overflow-hidden flex flex-col";
        
        article.innerHTML = `
        <div class="relative h-48 bg-slate-900 cursor-pointer view-post-trigger" data-post-id="${post.id}">
            ${mediaHtml}
            <span class="absolute bottom-3 left-3 px-3 py-1 bg-white/90 text-ivory-brown rounded-full text-xs font-semibold backdrop-blur-sm">${category}</span>
            ${showMenu ? `<span class="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusClass}">${post.status}</span>` : ''}
        </div>
        
        <div class="p-5 flex flex-col flex-grow">
            <div class="flex items-center space-x-2 text-sm text-classic-taupe mb-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>${readTime}</span>
            </div>
            
            <h3 class="text-lg font-bold text-ivory-brown cursor-pointer view-post-trigger" data-post-id="${post.id}">${post.title}</h3>
            
            <p class="text-classic-taupe text-sm mt-2 mb-4 flex-grow">
                ${snippet}
            </p>
            
            <div class="mt-auto pt-4 border-t border-ivory-linen flex justify-between items-center">
                <div class="flex space-x-4 text-sm text-classic-taupe">
                    <span title="Likes" class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>
                        ${post.likesCount || 0}
                    </span>
                    <button title="Comments" class="flex items-center gap-1 open-comments-trigger" data-post-id="${post.id}">
                        <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2s10 4.477 10 10z"></path></svg>
                        <span class="pointer-events-none">${post.commentsCount || 0}</span>
                    </button>
                </div>
                
                ${showMenu ? menuButtonHtml : ''}
            </div>
        </div>`;
        return article;
    }

    // --- 6. MODAL & POST FUNCTIONS ---

    async function openPostViewModal(postId, scrollToComments = false) {
        const commentForm = document.getElementById('comment-form');
        if (!postViewModal || !commentForm) {
            console.error("Post view modal or comment form not found in HTML!");
            return;
        }
        try {
            const postDoc = await db.collection('posts').doc(postId).get();
            if (!postDoc.exists) return;
            const post = postDoc.data();
            const user = auth.currentUser;
            commentForm.dataset.postId = postId;
            document.getElementById('view-modal-title').textContent = post.title;

            const modalMediaContainer = document.getElementById('view-modal-media-container');
            if (post.youtubeVideoId) {
                modalMediaContainer.innerHTML = `<iframe class="w-full h-full rounded-lg" src="https://www.youtube.com/embed/${post.youtubeVideoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                modalMediaContainer.classList.remove('hidden');
            } else if (post.imageUrl) {
                modalMediaContainer.innerHTML = `<img src="${post.imageUrl}" alt="Post Image" class="w-full h-auto max-h-96 object-contain rounded-lg">`;
                modalMediaContainer.classList.remove('hidden');
            } else {
                modalMediaContainer.innerHTML = '';
                modalMediaContainer.classList.add('hidden');
            }

            document.getElementById('view-modal-description').innerHTML = post.content;
            if (user) {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if(userDoc.exists) {
                    const userData = userDoc.data();
                    document.getElementById('comment-user-avatar').src = userData.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}`;
                } else {
                     document.getElementById('comment-user-avatar').src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}`;
                }
            }
            loadComments(postId);
            postViewModal.classList.remove('hidden');

            // === ALUTH LOGIC EKA: COMMENT WALATA SCROLL KARANNA ===
            if (scrollToComments) {
                const commentsList = document.getElementById('comments-list');
                if (commentsList) {
                    // Modal eka open wenna podi welak deela scroll karanna
                    setTimeout(() => {
                        commentsList.parentElement.scrollTop = commentsList.offsetTop - 50; // 50px padding
                    }, 300); // 300ms animation eka nisa
                }
            }

        } catch (error) {
            console.error("Error opening post view modal:", error);
            alert("Could not load post details. Please try again.");
        }
    }

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
            }, error => {
                console.error("Error loading comments:", error);
                commentsList.innerHTML = '<p class="text-sm text-red-500">Could not load comments.</p>';
            });
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        const postId = e.currentTarget.dataset.postId;
        const commentTextarea = document.getElementById('comment-textarea');
        const text = commentTextarea.value.trim();
        const user = auth.currentUser;

        if (!user || !text || !postId) return;

        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) throw new Error("User data not found.");
            
            const userData = userDoc.data();
            const commentData = {
                text: text,
                authorId: user.uid,
                authorName: userData.displayName || 'Anonymous',
                authorAvatar: userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'U')}`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const postRef = db.collection('posts').doc(postId);
            await postRef.collection('comments').add(commentData);
            await postRef.update({ commentsCount: firebase.firestore.FieldValue.increment(1) });
            
            commentTextarea.value = '';
        } catch (error) {
            console.error("Error submitting comment:", error);
            alert("Failed to post comment. Please try again.");
        }
    };

    async function deletePost(postId) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("You must be logged in to delete a post.");
            const postRef = db.collection('posts').doc(postId);
            const doc = await postRef.get();
            if (!doc.exists) throw new Error("Post not found.");
            if (doc.data().authorId !== user.uid) throw new Error("You do not have permission to delete this post.");
            
            await postRef.delete();
            alert('Post deleted successfully!');
            loadUserPosts(user.uid, true); // Refresh the grid
        } catch (error) {
            console.error("Error deleting post:", error);
            alert(`Error: ${error.message}`);
        }
    }

    async function openEditModal(postId) {
        try {
            const postRef = db.collection('posts').doc(postId);
            const doc = await postRef.get();
            if (!doc.exists) throw new Error("Post not found.");
            const post = doc.data();
            
            document.getElementById('edit-post-id').value = postId;
            document.getElementById('edit-post-title').value = post.title;
            document.getElementById('edit-post-category').value = post.category;
            
            const editor = tinymce.get('edit-post-content');
            if (editor) {
                editor.setContent(post.content || '');
            } else {
                console.error("TinyMCE editor for 'edit-post-content' not found.");
            }
            
            if(editPostModal) editPostModal.classList.remove('hidden');
        } catch (error) {
            console.error("Error fetching post data for edit:", error);
            alert(`Error: ${error.message}`);
        }
    }

    function renderPreviews() {
        if (!imagePreviewContainer) return;
        const addMoreButton = imagePreviewContainer.querySelector('label[for="post-image-input"]');
        imagePreviewContainer.innerHTML = '';
        uploadedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewWrapper = document.createElement('div');
                previewWrapper.className = 'relative w-full h-24';
                previewWrapper.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-full object-cover rounded-md">
                    <button type="button" data-index="${index}" class="remove-img-btn absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold leading-none cursor-pointer">&times;</button>
                `;
                imagePreviewContainer.appendChild(previewWrapper);
            }
            reader.readAsDataURL(file);
        });
        if (addMoreButton) {
            imagePreviewContainer.appendChild(addMoreButton);
        }
    }

    // --- 7. HELPER FUNCTIONS (Common UI) ---

    const closeLeftDrawer = () => {
        if (leftDrawer) {
            leftDrawer.classList.add('vibrate-anim');
            setTimeout(() => {
                document.body.classList.remove('drawer-open');
                leftDrawer.classList.remove('vibrate-anim');
            }, 300);
        }
    };

    const openSearchDrawer = (e) => {
        if(e) e.preventDefault();
        document.body.classList.add('search-drawer-open');
        setTimeout(() => {
            if(searchDrawerInput) searchDrawerInput.focus();
        }, 300);
    };

    const closeSearchDrawer = () => {
        document.body.classList.remove('search-drawer-open');
    };

    const openNotificationDrawer = () => {
        document.body.classList.add('notification-drawer-open');
    };
    
    const closeNotificationDrawer = () => {
        document.body.classList.remove('notification-drawer-open');
    };

    const openAuthDrawer = (view = 'login') => {
        if (!authLoginView || !authSignupView || !authResetView) return;
        
        authLoginView.classList.add('hidden');
        authSignupView.classList.add('hidden');
        authResetView.classList.add('hidden');
        
        if (view === 'signup') {
            authSignupView.classList.remove('hidden');
        } else if (view === 'reset') {
            authResetView.classList.remove('hidden');
        } else {
            authLoginView.classList.remove('hidden');
        }
        
        document.body.classList.add('auth-drawer-open');
        closeLeftDrawer();
    };
    
    const closeAuthDrawer = () => {
        document.body.classList.remove('auth-drawer-open');
    };

    // === ALUTH SHARE FUNCTION EKA ===
    const setupShareButton = (profileUid, displayName) => {
        if (!shareProfileBtn) return;
        
        const url = `${window.location.origin}${window.location.pathname}?uid=${profileUid}`;
        const shareText = `Check out ${displayName}'s profile on AroundMe.Click!`;
        const encodedUrl = encodeURIComponent(url);
        const encodedText = encodeURIComponent(shareText);

        shareProfileBtn.addEventListener('click', async () => {
            if (navigator.share) {
                // Mobile Native Share
                try {
                    await navigator.share({
                        title: `${displayName}'s Profile`,
                        text: shareText,
                        url: url,
                    });
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('Error with native share:', error);
                    }
                }
            } else {
                // Desktop Modal Share
                if (shareProfileModal) {
                    if(shareProfileLinkInput) shareProfileLinkInput.value = url;
                    if(facebookProfileShareBtn) facebookProfileShareBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                    if(whatsappProfileShareBtn) whatsappProfileShareBtn.href = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
                    
                    shareProfileModal.classList.remove('hidden');
                }
            }
        });
    };

    // --- 8. EVENT LISTENERS ---

    if (myPostsGrid) {
        myPostsGrid.addEventListener('click', async (e) => {
            const viewTrigger = e.target.closest('.view-post-trigger');
            const editBtn = e.target.closest('.edit-post-btn');
            const deleteBtn = e.target.closest('.delete-post-btn');
            const menuBtn = e.target.closest('.post-menu-button');
            const commentsTrigger = e.target.closest('.open-comments-trigger'); // ALUTH

            if (menuBtn) {
                const menu = menuBtn.nextElementSibling;
                if(menu) menu.classList.toggle('hidden');
                return; 
            }
            if (viewTrigger) {
                const postId = viewTrigger.dataset.postId;
                if (postId) openPostViewModal(postId, false); // false = don't scroll
            }
            // === ALUTH: COMMENT CLICK ===
            if (commentsTrigger) {
                e.preventDefault();
                const postId = commentsTrigger.dataset.postId;
                if (postId) openPostViewModal(postId, true); // true = scroll to comments
            }
            if (editBtn) {
                e.preventDefault();
                const postId = editBtn.dataset.id;
                if (postId) openEditModal(postId);
            }
            if (deleteBtn) {
                e.preventDefault();
                const postId = deleteBtn.dataset.id;
                if (postId && confirm("Are you sure you want to delete this post?")) {
                    await deletePost(postId);
                }
            }
        });
    }

    if (myPostsTab && likedPostsTab) {
        myPostsTab.addEventListener('click', () => {
            myPostsTab.classList.add('active');
            likedPostsTab.classList.remove('active');
            if (currentProfileUid) loadUserPosts(currentProfileUid, true); // Assume owner
        });

        likedPostsTab.addEventListener('click', () => {
            likedPostsTab.classList.add('active');
            myPostsTab.classList.remove('active');
            if (currentProfileUid) loadLikedPosts(currentProfileUid);
        });
    }

    if (applyToPlusBtnMain) {
        applyToPlusBtnMain.addEventListener('click', () => {
            if (plusApplicationModal) plusApplicationModal.classList.remove('hidden');
        });
    }
    if (applyToPlusBtn) {
        applyToPlusBtn.addEventListener('click', () => {
            if (plusApplicationModal) plusApplicationModal.classList.remove('hidden');
        });
    }
    
    if(logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());
    if(profileDropdownBtn) profileDropdownBtn.addEventListener('click', () => {
        profileDropdownMenu.classList.toggle('hidden');
    });
    
    openModalBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (createPostModal) createPostModal.classList.remove('hidden');
        });
    });

    if (openEditModalBtn) {
        openEditModalBtn.addEventListener('click', () => {
            if(profileDisplayName) document.getElementById('display-name-input').value = profileDisplayName.textContent;
            if(profileBio) document.getElementById('bio-input').value = profileBio.textContent;
            if(profileAvatar) avatarPreview.src = profileAvatar.src;
            if(profileBanner) coverPreview.src = profileBanner.src;
            newAvatarFile = null;
            newCoverFile = null;
            if(editProfileModal) editProfileModal.classList.remove('hidden');
        });
    }
    
    // Modal Close Listeners
    if (closeViewModalBtn) closeViewModalBtn.addEventListener('click', () => { if(postViewModal) postViewModal.classList.add('hidden'); });
    if (postViewModal) postViewModal.addEventListener('click', (e) => { if (e.target === postViewModal) postViewModal.classList.add('hidden'); });
    if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', () => { if(editProfileModal) editProfileModal.classList.add('hidden'); });
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => { if(editProfileModal) editProfileModal.classList.add('hidden'); });
    if (closeEditPostModalBtn) closeEditPostModalBtn.addEventListener('click', () => { if(editPostModal) editPostModal.classList.add('hidden'); });
    if (closeCreateModalBtn) closeCreateModalBtn.addEventListener('click', () => { if(createPostModal) createPostModal.classList.add('hidden'); });
    
    // ALUTH: Share Modal Close Listeners
    if (closeShareProfileModalBtn) {
        closeShareProfileModalBtn.addEventListener('click', () => {
            if (shareProfileModal) shareProfileModal.classList.add('hidden');
        });
    }
    if (shareProfileModal) {
        shareProfileModal.addEventListener('click', (e) => {
            if (e.target === shareProfileModal) shareProfileModal.classList.add('hidden');
        });
    }
    if (copyProfileLinkBtn && shareProfileLinkInput) {
        copyProfileLinkBtn.addEventListener('click', () => {
            shareProfileLinkInput.select();
            document.execCommand('copy');
            copyProfileLinkBtn.textContent = 'Copied!';
            setTimeout(() => { copyProfileLinkBtn.textContent = 'Copy'; }, 2000);
        });
    }

    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }

    // --- 9. EVENT LISTENERS (Common UI) ---

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            document.body.classList.add('drawer-open');
        });
    }
    if (leftDrawerBackdrop) leftDrawerBackdrop.addEventListener('click', closeLeftDrawer);
    if (closeLeftDrawerBtn) closeLeftDrawerBtn.addEventListener('click', closeLeftDrawer);
    
    const tabMenu = document.getElementById('drawer-tab-menu');
    const tabCategories = document.getElementById('drawer-tab-categories');
    const contentMenu = document.getElementById('drawer-menu-content');
    const contentCategories = document.getElementById('drawer-categories-content');

    if (tabMenu && tabCategories && contentMenu && contentCategories) {
        tabMenu.addEventListener('click', () => {
            contentMenu.classList.remove('hidden');
            contentCategories.classList.add('hidden');
            tabMenu.classList.add('text-ivory-brown', 'border-yellow-400');
            tabMenu.classList.remove('text-classic-taupe', 'border-transparent');
            tabCategories.classList.add('text-classic-taupe', 'border-transparent');
            tabCategories.classList.remove('text-ivory-brown', 'border-yellow-400');
        });
        tabCategories.addEventListener('click', () => {
            contentMenu.classList.add('hidden');
            contentCategories.classList.remove('hidden');
            tabCategories.classList.add('text-ivory-brown', 'border-yellow-400');
            tabCategories.classList.remove('text-classic-taupe', 'border-transparent');
            tabMenu.classList.add('text-classic-taupe', 'border-transparent');
            tabMenu.classList.remove('text-ivory-brown', 'border-yellow-400');
        });
    }

    if (leftDrawer) {
        leftDrawer.querySelectorAll('nav a, .theme-toggle-button').forEach(link => {
            link.addEventListener('click', () => {
                if (link.id === 'drawer-tab-menu' || link.id === 'drawer-tab-categories' || link.classList.contains('theme-toggle-button')) {
                   return;
                }
                closeLeftDrawer();
            });
        });
    }

    if (mobileSearchBtn) mobileSearchBtn.addEventListener('click', openSearchDrawer);
    if (desktopSearchBtn) desktopSearchBtn.addEventListener('click', openSearchDrawer);
    if (searchDrawerBackdrop) searchDrawerBackdrop.addEventListener('click', closeSearchDrawer);
    if (closeSearchDrawerBtn) closeSearchDrawerBtn.addEventListener('click', closeSearchDrawer);
    
    if (mobileSearchForm) {
        mobileSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchDrawerInput.value;
            window.location.href = `index.html?search=${encodeURIComponent(query)}`;
            closeSearchDrawer();
        });
    }

    if (notificationBellBtn) notificationBellBtn.addEventListener('click', openNotificationDrawer);
    if (notificationDrawerBackdrop) notificationDrawerBackdrop.addEventListener('click', closeNotificationDrawer);
    if (closeNotificationDrawerBtn) closeNotificationDrawerBtn.addEventListener('click', closeNotificationDrawer);

    if (loginBtn) loginBtn.addEventListener('click', () => openAuthDrawer('login'));
    if (signupBtn) signupBtn.addEventListener('click', () => openAuthDrawer('signup'));
    if (bottomNavLoginBtn) bottomNavLoginBtn.addEventListener('click', () => openAuthDrawer('login'));
    if (drawerLoginBtn) drawerLoginBtn.addEventListener('click', () => openAuthDrawer('login'));
    
    authShowSignupLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); openAuthDrawer('signup'); }));
    authShowLoginLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); openAuthDrawer('login'); }));
    authShowResetLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); openAuthDrawer('reset'); }));
    authBackToLoginLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); openAuthDrawer('login'); }));

    if (authDrawerBackdrop) authDrawerBackdrop.addEventListener('click', closeAuthDrawer);
    if (closeAuthDrawerBtn) closeAuthDrawerBtn.addEventListener('click', closeAuthDrawer);

    if (drawerLogoutBtn) {
        drawerLogoutBtn.addEventListener('click', () => {
            if (logoutBtn) {
                logoutBtn.click();
            } else {
                auth.signOut();
            }
        });
    }

    // Theme Toggle Logic
    const setTheme = (isDark) => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            lightIcon.forEach(icon => icon.classList.add('hidden'));
            darkIcon.forEach(icon => icon.classList.remove('hidden'));
        } else {
            document.documentElement.classList.remove('dark');
            lightIcon.forEach(icon => icon.classList.remove('hidden'));
            darkIcon.forEach(icon => icon.classList.add('hidden'));
        }
    };
    setTheme(localStorage.getItem('theme') === 'dark');
    themeToggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            setTheme(isDark);
        });
    });

    // --- 10. FORM SUBMISSIONS ---

    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('save-profile-btn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            try {
                const user = auth.currentUser;
                if (!user) throw new Error("You must be logged in.");

                const updatedData = {
                    displayName: document.getElementById('display-name-input').value,
                    bio: document.getElementById('bio-input').value
                };

                if (newAvatarFile) {
                    const formData = new FormData();
                    formData.append('image', newAvatarFile);
                    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
                    const result = await response.json();
                    if (result.success) updatedData.photoURL = result.data.url;
                    else throw new Error('Avatar image upload failed.');
                }
                if (newCoverFile) {
                    const formData = new FormData();
                    formData.append('image', newCoverFile);
                    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
                    const result = await response.json();
                    if (result.success) updatedData.coverPhotoURL = result.data.url;
                    else throw new Error('Cover image upload failed.');
                }

                const authUpdates = {};
                if (updatedData.displayName) authUpdates.displayName = updatedData.displayName;
                if (updatedData.photoURL) authUpdates.photoURL = updatedData.photoURL;

                if (Object.keys(authUpdates).length > 0) {
                    await user.updateProfile(authUpdates);
                }
                
                await db.collection('users').doc(user.uid).set(updatedData, { merge: true });

                alert('Profile updated successfully!');
                if(editProfileModal) editProfileModal.classList.add('hidden');
                location.reload(); 
            } catch (error) {
                console.error("Error updating profile:", error);
                alert(`Error: ${error.message}`);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }
        });
    }

    if (editPostForm) {
        editPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            updatePostBtn.disabled = true;
            updatePostBtn.textContent = 'Updating...';
            try {
                const user = auth.currentUser;
                if (!user) throw new Error("You must be logged in.");

                const postId = document.getElementById('edit-post-id').value;
                const postRef = db.collection('posts').doc(postId);

                const postData = {
                    title: document.getElementById('edit-post-title').value,
                    category: document.getElementById('edit-post-category').value.toLowerCase(),
                    content: tinymce.get('edit-post-content').getContent(),
                    status: 'pending' // Resubmit for approval
                };

                await postRef.update(postData);

                alert('Post updated successfully! It has been resubmitted for review.');
                if(editPostModal) editPostModal.classList.add('hidden');
                loadUserPosts(user.uid, true);

            } catch (error) {
                console.error("Error updating post:", error);
                alert(`Error: ${error.message}`);
            } finally {
                updatePostBtn.disabled = false;
                updatePostBtn.textContent = 'Update Post';
            }
        });
    }
    
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            publishPostBtn.disabled = true;
            publishPostBtn.textContent = 'Publishing...';
            try {
                const user = auth.currentUser;
                if (!user) throw new Error("You must be logged in.");

                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) throw new Error("User data not found.");
                const userData = userDoc.data();

                const youtubeUrl = document.getElementById('post-youtube-link').value;
                const youtubeVideoId = getYouTubeVideoId(youtubeUrl);
                let imageUrls = [];

                if (!youtubeVideoId && uploadedFiles.length > 0) {
                    const uploadPromises = uploadedFiles.map(file => {
                        const formData = new FormData();
                        formData.append('image', file);
                        return fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData })
                            .then(response => response.json());
                    });
                    const uploadResults = await Promise.all(uploadPromises);
                    imageUrls = uploadResults.map(result => result.success ? result.data.url : null).filter(Boolean);
                }

                const contentHTML = tinymce.get('post-content').getContent();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = contentHTML;
                const firstHeading = tempDiv.querySelector('h1, h2, h3, h4, h5, h6');
                let title = firstHeading ? firstHeading.textContent.trim() : (tempDiv.textContent.trim().substring(0, 60) || "Untitled Post");
                
                const postData = {
                    title,
                    content: contentHTML,
                    category: document.getElementById('post-category').value.toLowerCase(),
                    imageUrls: imageUrls,
                    imageUrl: imageUrls[0] || '',
                    youtubeVideoId: youtubeVideoId || null,
                    authorId: user.uid,
                    authorName: userData.displayName || 'Anonymous',
                    authorAvatar: userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'U')}`,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'pending',
                    likesCount: 0,
                    likedBy: [],
                    commentsCount: 0
                };

                await db.collection("posts").add(postData);
                alert("Blog post published successfully! It is pending review.");
                createPostForm.reset();
                tinymce.get('post-content').setContent('');
                document.getElementById('post-youtube-link').value = '';
                uploadedFiles = [];
                renderPreviews();
                if(createPostModal) createPostModal.classList.add('hidden');
                loadUserPosts(user.uid, true);
            } catch (error) {
                console.error("Error creating post:", error);
                alert(`Error: ${error.message}`);
            } finally {
                publishPostBtn.disabled = false;
                publishPostBtn.textContent = 'Publish';
            }
        });
    }

    if (plusApplicationForm) {
        plusApplicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-application-btn');
            const statusMsg = document.getElementById('application-status-message');
            const reason = document.getElementById('application-reason').value;
            const user = auth.currentUser;

            if (!user) {
                alert('You must be logged in to apply.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            statusMsg.textContent = '';
            statusMsg.className = 'text-center text-sm mt-4';

            try {
                const existingAppQuery = await db.collection('plusApplications').where('userId', '==', user.uid).where('status', '==', 'pending').get();
                if (!existingAppQuery.empty) {
                    throw new Error("You already have a pending application.");
                }

                const applicationData = {
                    userId: user.uid,
                    displayName: user.displayName || 'N/A',
                    email: user.email,
                    reason: reason,
                    submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'pending'
                };

                await db.collection('plusApplications').add(applicationData);
                
                statusMsg.textContent = '✅ Application submitted successfully! We will review it soon.';
                statusMsg.classList.add('text-green-600');
                
                if (normalUserApplySection) { 
                    normalUserApplySection.innerHTML = '<p class="text-center text-classic-taupe mt-8">Your "Plus" application is pending review.</p>';
                }
                if (applyToPlusBtn) applyToPlusBtn.classList.add('hidden');
                if (applyToPlusBtnMain) applyToPlusBtnMain.classList.add('hidden');
                
                setTimeout(() => {
                    if (plusApplicationModal) plusApplicationModal.classList.add('hidden');
                }, 3000);

            } catch (error) {
                console.error("Error submitting application:", error);
                statusMsg.textContent = `❌ ${error.message || 'An error occurred. Please try again.'}`;
                statusMsg.classList.add('text-red-600');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Application';
            }
        });
    }
    
    if (proApplicationForm) {
        proApplicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-pro-application-btn');
            const statusMsg = document.getElementById('pro-application-status-message');
            const reason = document.getElementById('pro-application-reason').value;
            const user = auth.currentUser;

            if (!user) {
                alert('You must be logged in to apply for Pro.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            statusMsg.textContent = '';
            statusMsg.className = 'text-center text-sm mt-4';

            try {
                const existingAppQuery = await db.collection('proApplications').where('userId', '==', user.uid).where('status', '==', 'pending').get();
                if (!existingAppQuery.empty) {
                    throw new Error("You already have a pending Pro application.");
                }

                const applicationData = {
                    userId: user.uid,
                    displayName: user.displayName || 'N/A',
                    email: user.email,
                    reason: reason,
                    submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'pending'
                };

                await db.collection('proApplications').add(applicationData);
                
                statusMsg.textContent = '✅ Pro application submitted successfully! We will review it soon.';
                statusMsg.classList.add('text-green-600');
                
                if (applyToProBtn) applyToProBtn.classList.add('hidden');
                
                setTimeout(() => {
                    if (proApplicationModal) proApplicationModal.classList.add('hidden');
                }, 3000);

            } catch (error) {
                console.error("Error submitting Pro application:", error);
                statusMsg.textContent = `❌ ${error.message || 'An error occurred. Please try again.'}`;
                statusMsg.classList.add('text-red-600');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Application';
            }
        });
    }

    // --- 11. AUTH LOGIC (MAIN) ---

    // Auth Drawer Form Listeners
    const loginFormDrawer = document.getElementById('login-form-drawer');
    const signupFormDrawer = document.getElementById('signup-form-drawer');
    const resetPasswordFormDrawer = document.getElementById('reset-password-form-drawer');

    if(loginFormDrawer){
        loginFormDrawer.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginFormDrawer['login-email'].value;
            const password = loginFormDrawer['login-password'].value;
            const errorEl = document.getElementById('login-error-drawer');
            errorEl.textContent = '';
            auth.signInWithEmailAndPassword(email, password)
                .catch((error) => { errorEl.textContent = error.message; });
        });
    }

    if(signupFormDrawer){
        signupFormDrawer.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = signupFormDrawer['signup-name'].value;
            const email = signupFormDrawer['signup-email'].value;
            const password = signupFormDrawer['signup-password'].value;
            const errorEl = document.getElementById('signup-error-drawer');
            errorEl.textContent = '';

            if (password.length < 6) {
                errorEl.textContent = 'Password must be at least 6 characters.';
                return;
            }
            
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B5E34&color=fff`;
                    return user.updateProfile({
                        displayName: name,
                        photoURL: defaultAvatar
                    }).then(() => {
                        return db.collection('users').doc(user.uid).set({
                            displayName: name,
                            email: email,
                            role: 'normal',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            photoURL: defaultAvatar, bio: '', coverPhotoURL: '',
                            followers: [], following: [],
                            followersCount: 0, followingCount: 0
                        });
                    });
                })
                .catch((error) => { errorEl.textContent = error.message; });
        });
    }

    if(resetPasswordFormDrawer) {
        resetPasswordFormDrawer.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = resetPasswordFormDrawer['reset-email'].value;
            const messageEl = document.getElementById('reset-message-drawer');
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    messageEl.textContent = "Check your email for a reset link!";
                    messageEl.className = "text-sm mt-3 min-h-[20px] text-center text-green-600";
                })
                .catch((error) => {
                    messageEl.textContent = error.message;
                    messageEl.className = "text-sm mt-3 min-h-[20px] text-center text-red-500";
                });
        });
    }

    // Comprehensive UI Sync Function (Header/Drawers/Nav)
    const syncUI = (user, userData = null) => {
        if (user) {
            const avatarSrc = (userData && userData.photoURL) || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=8B5E34&color=fff`;
            const displayName = (userData && userData.displayName) || user.displayName || 'Anonymous';
            const email = user.email;
            
            // Header
            if (userAuthLinks) userAuthLinks.classList.add('hidden');
            if (userProfileInfo) userProfileInfo.classList.remove('hidden');
            if (document.getElementById('header-user-avatar')) document.getElementById('header-user-avatar').src = avatarSrc;
            if (document.getElementById('dropdown-user-avatar')) document.getElementById('dropdown-user-avatar').src = avatarSrc;
            if (document.getElementById('dropdown-user-name')) document.getElementById('dropdown-user-name').textContent = displayName;
            if (document.getElementById('dropdown-user-email')) document.getElementById('dropdown-user-email').textContent = email;
            if(document.getElementById('admin-panel-link') && userData && (userData.role === 'admin' || userData.role === 'pro')) {
                document.getElementById('admin-panel-link').classList.remove('hidden');
            }

            // Bottom Nav
            if (bottomNavLoginBtn) bottomNavLoginBtn.style.display = 'none';
            if (bottomNavProfileLink) bottomNavProfileLink.style.display = 'flex';
            if (bottomNavAvatar) bottomNavAvatar.src = avatarSrc;
            
            // Left Drawer
            if (drawerAuthLinks) drawerAuthLinks.style.display = 'none';
            if (drawerProfileInfo) drawerProfileInfo.style.display = 'block';
            
            closeAuthDrawer();
        } else {
            // Header
            if (userAuthLinks) userAuthLinks.classList.remove('hidden');
            if (userProfileInfo) userProfileInfo.classList.add('hidden');
            
            // Bottom Nav
            if (bottomNavLoginBtn) bottomNavLoginBtn.style.display = 'flex';
            if (bottomNavProfileLink) bottomNavProfileLink.style.display = 'none';
            
            // Left Drawer
            if (drawerAuthLinks) drawerAuthLinks.style.display = 'block';
            if (drawerProfileInfo) drawerProfileInfo.style.display = 'none';
        }
    };

    // --- Main Auth State Change Listener ---
    auth.onAuthStateChanged(async (loggedInUser) => {
        const urlParams = new URLSearchParams(window.location.search);
        const profileUidFromUrl = urlParams.get('uid');
        let isViewingOwnProfile = false;

        // Step 1: Determine which profile to load
        if (profileUidFromUrl) {
            // A. PUBLIC VIEW: Viewing a profile from a link
            currentProfileUid = profileUidFromUrl;
            if (loggedInUser && loggedInUser.uid === currentProfileUid) {
                isViewingOwnProfile = true;
            }
        } else if (loggedInUser) {
            // B. MY PROFILE VIEW: Logged in, no UID in URL
            currentProfileUid = loggedInUser.uid;
            isViewingOwnProfile = true;
        } else {
            // C. NO PROFILE, NOT LOGGED IN: Redirect
            console.log("No user specified and not logged in. Redirecting.");
            window.location.href = 'index.html';
            return;
        }

        // --- PART 1: Handle LOGGED IN User UI (Header, Drawers) ---
        let loggedInUserData = null;
        if (loggedInUser) {
            try {
                const loggedInDoc = await db.collection('users').doc(loggedInUser.uid).get();
                if (loggedInDoc.exists) {
                    loggedInUserData = loggedInDoc.data();
                }
            } catch (e) { console.error("Error fetching logged-in user data for UI sync", e); }
        }
        syncUI(loggedInUser, loggedInUserData); // Syncs header/navs with the *viewer's* info.

        // --- PART 2: Load PROFILE User Data (Main Content) ---
        try {
            const userDocRef = db.collection('users').doc(currentProfileUid);
            const docSnap = await userDocRef.get();

            if (!docSnap.exists) {
                console.error("Profile user document does not exist.");
                alert("This profile does not exist.");
                window.location.href = 'index.html';
                return;
            }

            const profileUserData = docSnap.data();
            const userRole = profileUserData.role || 'normal';
            
            displayProfileData(profileUserData, { email: profileUserData.email });

            // Set Body Class for CSS rules
            document.body.className = ''; 
            document.body.classList.add(`role-${userRole}`);
            if (localStorage.getItem('theme') === 'dark') {
                document.documentElement.classList.add('dark');
            }

            // Show/Hide Edit/Apply buttons based on who is viewing
            if (isViewingOwnProfile) {
                if (openEditModalBtn) openEditModalBtn.classList.remove('hidden');
                if (shareProfileBtn) shareProfileBtn.classList.remove('hidden');
                
                // Check for applications
                const plusAppQuery = db.collection('plusApplications').where('userId', '==', currentProfileUid).where('status', '==', 'pending').limit(1);
                const proAppQuery = db.collection('proApplications').where('userId', '==', currentProfileUid).where('status', '==', 'pending').limit(1);
                const [plusAppSnap, proAppSnap] = await Promise.all([plusAppQuery.get(), proAppQuery.get()]);
                const hasPlusApplied = !plusAppSnap.empty;
                const hasProApplied = !proAppSnap.empty;

                if (applyToPlusBtn) applyToPlusBtn.classList.add('hidden');
                if (applyToProBtn) applyToProBtn.classList.add('hidden');

                if (userRole === 'normal') {
                    if (hasPlusApplied) {
                        if (normalUserApplySection) normalUserApplySection.innerHTML = '<p class="text-center text-classic-taupe mt-8">Your "Plus" application is pending review.</p>';
                    } else {
                        if (applyToPlusBtn) applyToPlusBtn.classList.remove('hidden');
                    }
                } else if (userRole === 'plus') {
                    if (hasProApplied) {
                        if (applyToProBtn) applyToProBtn.classList.add('hidden');
                    } else {
                        if (applyToProBtn) applyToProBtn.classList.remove('hidden');
                    }
                }

            } else {
                // Not viewing own profile
                if (openEditModalBtn) openEditModalBtn.classList.add('hidden');
                if (applyToPlusBtn) applyToPlusBtn.classList.add('hidden');
                if (applyToProBtn) applyToProBtn.classList.add('hidden');
                if (shareProfileBtn) shareProfileBtn.classList.remove('hidden'); // Anith ayata share karanna puluwan
            }

            // Load posts for creators
            if (userRole !== 'normal') {
                loadUserPosts(currentProfileUid, isViewingOwnProfile);
            }
            
            // Setup share button
            setupShareButton(currentProfileUid, profileUserData.displayName);

        } catch (error) {
            console.error("Error fetching profile user data:", error);
        }
    });

    // --- 12. INITIALIZE TinyMCE ---

    tinymce.init({
        selector: '#post-content, #edit-post-content',
        plugins: 'autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
        toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | link image | removeformat | help',
        height: 250,
        menubar: false,
        placeholder: 'Write your title using a heading (e.g., Heading 1), then start your story...',
        setup: function (editor) {
            editor.on('input change', () => {
                const content = editor.getContent({ format: 'text' });
                if(publishPostBtn) publishPostBtn.disabled = content.trim() === '';
                if(updatePostBtn) updatePostBtn.disabled = content.trim() === '';
            });
        }
    });
});