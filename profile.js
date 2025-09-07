// =================================================================
//     PROFILE.JS - FINAL, COMPLETE, AND CORRECTED SCRIPT
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

    // Edit Post Modal
    const editPostModal = document.getElementById('edit-post-modal');
    const editPostForm = document.getElementById('edit-post-form');
    const closeEditPostModalBtn = document.getElementById('close-edit-post-modal');
    const updatePostBtn = document.getElementById('update-post-btn');
    
    // Post View Modal
    const postViewModal = document.getElementById('post-view-modal');
    const closeViewModalBtn = document.getElementById('close-view-modal-btn');

    // Plus Application Modal
    const applyToPlusBtn = document.getElementById('apply-to-plus-btn');
    const plusApplicationModal = document.getElementById('plus-application-modal');
    const closeApplicationModalBtn = document.getElementById('close-application-modal-btn');
    const plusApplicationForm = document.getElementById('plus-application-form');

    // Pro Application Modal
    const applyToProBtn = document.getElementById('apply-to-pro-btn');
    const proApplicationModal = document.getElementById('pro-application-modal');
    const closeProApplicationModalBtn = document.getElementById('close-pro-application-modal-btn');
    const proApplicationForm = document.getElementById('pro-application-form');

    let uploadedFiles = [];
    let newAvatarFile = null;
    let newCoverFile = null;

    // =================================================================
    // 3. FUNCTION DEFINITIONS
    // =================================================================

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
        if(profileEmail) profileEmail.textContent = user.email;
        if(profileBio) profileBio.textContent = userData.bio || "This user hasn't written a bio yet.";

        if(document.getElementById('followers-count')) document.getElementById('followers-count').textContent = userData.followersCount || 0;
        if(document.getElementById('following-count')) document.getElementById('following-count').textContent = userData.followingCount || 0;
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
                const mediaHtml = post.youtubeVideoId
                    ? `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${post.youtubeVideoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
                    : `<img src="${post.imageUrl || 'https://picsum.photos/400/300'}" alt="Blog post image" class="w-full h-full object-cover transition-transform duration-300 hover:scale-110">`;

                const article = document.createElement('article');
                article.className = "bg-white rounded-lg shadow-md overflow-hidden flex flex-col";
                
                // *** FIXED POST STRUCTURE FOR CONSISTENT LAYOUT ***
                article.innerHTML = `
                <div class="relative overflow-hidden h-48 bg-slate-900 cursor-pointer view-post-trigger" data-post-id="${post.id}">
                    ${mediaHtml}
                    <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold uppercase ${post.status === 'pending' ? 'bg-amber-500 text-white' : post.status === 'approved' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}">${post.status}</span>
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <h3 class="font-bold text-lg text-slate-800 cursor-pointer view-post-trigger" data-post-id="${post.id}">${post.title}</h3>
                    <div class="mt-auto pt-3 border-t border-gray-200 flex justify-between items-center">
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

    async function openPostViewModal(postId) {
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
                document.getElementById('comment-user-avatar').src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}`;
            }
            loadComments(postId);
            postViewModal.classList.remove('hidden');
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
            loadUserPosts(user.uid); // Reload posts to update comment count on the profile grid
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
            loadUserPosts(user.uid);
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

    // =================================================================
    // 4. EVENT LISTENERS & FORM HANDLERS
    // =================================================================

    // --- Post Grid Actions (View, Edit, Delete) ---
    if (myPostsGrid) {
        myPostsGrid.addEventListener('click', async (e) => {
            const viewTrigger = e.target.closest('.view-post-trigger');
            const editBtn = e.target.closest('.edit-post-btn');
            const deleteBtn = e.target.closest('.delete-post-btn');
            const menuBtn = e.target.closest('.post-menu-button');

            if (menuBtn) {
                const menu = menuBtn.nextElementSibling;
                if(menu) menu.classList.toggle('hidden');
                return; 
            }
            if (viewTrigger) {
                const postId = viewTrigger.dataset.postId;
                if (postId) openPostViewModal(postId);
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

    // --- Header & Dropdown ---
    if(logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());
    if(profileDropdownBtn) profileDropdownBtn.addEventListener('click', () => profileDropdownMenu.classList.toggle('hidden'));
    
    // --- Modal Open/Close Buttons ---
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
    
    if (closeViewModalBtn) closeViewModalBtn.addEventListener('click', () => { if(postViewModal) postViewModal.classList.add('hidden'); });
    if (postViewModal) postViewModal.addEventListener('click', (e) => { if (e.target === postViewModal) postViewModal.classList.add('hidden'); });
    if(closeEditModalBtn) closeEditModalBtn.addEventListener('click', () => { if(editProfileModal) editProfileModal.classList.add('hidden'); });
    if(closeEditPostModalBtn) closeEditPostModalBtn.addEventListener('click', () => { if(editPostModal) editPostModal.classList.add('hidden'); });
    if(closeCreateModalBtn) closeCreateModalBtn.addEventListener('click', () => { if(createPostModal) createPostModal.classList.add('hidden'); });
    
    // --- Comment Form ---
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }

    // --- Edit Profile Form ---
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

                // ** CORRECTED: Update Firebase Auth Profile as well **
                const authUpdates = {};
                if (updatedData.displayName) authUpdates.displayName = updatedData.displayName;
                if (updatedData.photoURL) authUpdates.photoURL = updatedData.photoURL;

                if (Object.keys(authUpdates).length > 0) {
                    await user.updateProfile(authUpdates);
                }
                
                // Update Firestore document
                await db.collection('users').doc(user.uid).update(updatedData);

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
    
    // --- Create Post Image Handling ---
    if(postImageInput) {
        postImageInput.addEventListener('change', (event) => {
            const files = event.target.files;
            for (const file of files) uploadedFiles.push(file);
            renderPreviews();
            postImageInput.value = '';
        });
    }
    if(imagePreviewContainer) {
        imagePreviewContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-img-btn')) {
                const indexToRemove = parseInt(event.target.getAttribute('data-index'), 10);
                uploadedFiles.splice(indexToRemove, 1);
                renderPreviews();
            }
        });
    }
    
    // --- Create Post Form ---
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            publishPostBtn.disabled = true;
            publishPostBtn.textContent = 'Publishing...';
            try {
                const user = auth.currentUser;
                if (!user) throw new Error("You must be logged in.");

                // ** IMPROVED: Fetch user data from Firestore to ensure avatar URL exists **
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
                alert("Blog post published successfully!");
                createPostForm.reset();
                tinymce.get('post-content').setContent('');
                document.getElementById('post-youtube-link').value = '';
                uploadedFiles = [];
                renderPreviews();
                if(createPostModal) createPostModal.classList.add('hidden');
                loadUserPosts(user.uid);
            } catch (error) {
                console.error("Error creating post:", error);
                alert(`Error: ${error.message}`);
            } finally {
                publishPostBtn.disabled = false;
                publishPostBtn.textContent = 'Publish';
            }
        });
    }

    // --- Plus Application Logic ---
    if (applyToPlusBtn) {
        applyToPlusBtn.addEventListener('click', () => {
            if (plusApplicationModal) plusApplicationModal.classList.remove('hidden');
        });
    }
    if (closeApplicationModalBtn) {
        closeApplicationModalBtn.addEventListener('click', () => {
            if (plusApplicationModal) plusApplicationModal.classList.add('hidden');
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
            statusMsg.className = 'text-center text-sm mt-4'; // Reset classes

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
                
                if (applyToPlusBtn) applyToPlusBtn.classList.add('hidden');
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
    
    // --- Pro Application Logic ---
    if (applyToProBtn) applyToProBtn.addEventListener('click', () => proApplicationModal?.classList.remove('hidden'));
    if (closeProApplicationModalBtn) closeProApplicationModalBtn.addEventListener('click', () => proApplicationModal?.classList.add('hidden')); 
    
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
            statusMsg.className = 'text-center text-sm mt-4'; // Reset classes

            try {
                // Check for existing pending "Pro" applications
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

                // Add to the "proApplications" collection
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

    // =================================================================
    // 5. SCRIPT INITIALIZATION
    // =================================================================
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            if (userAuthLinks) userAuthLinks.classList.add('hidden');
            if (userProfileInfo) userProfileInfo.classList.remove('hidden');

            const userDocRef = db.collection('users').doc(user.uid);
            const plusAppQuery = db.collection('plusApplications').where('userId', '==', user.uid).limit(1);
            const proAppQuery = db.collection('proApplications').where('userId', '==', user.uid).limit(1);

            try {
                const [docSnap, plusAppSnap, proAppSnap] = await Promise.all([userDocRef.get(), plusAppQuery.get(), proAppQuery.get()]);

                if (docSnap.exists) {
                    const userData = docSnap.data();
                    displayProfileData(userData, user);
                    loadUserPosts(user.uid);

                    // Hide "Plus" apply button if user has already applied
                    if (applyToPlusBtn) {
                        const hasApplied = !plusAppSnap.empty;
                        if (hasApplied) {
                            applyToPlusBtn.classList.add('hidden');
                        }
                    }

                    // Hide "Pro" apply button if user has already applied
                    if (applyToProBtn) {
                        const hasApplied = !proAppSnap.empty;
                        if (hasApplied) {
                            applyToProBtn.classList.add('hidden');
                        }
                    }

                } else {
                    console.log('User document does not exist. This might be a new user.');
                }
            } catch (error) {
                console.error("Error fetching user data on auth state change:", error);
            }
        } else {
            if (userAuthLinks) userAuthLinks.classList.remove('hidden');
            if (userProfileInfo) userProfileInfo.classList.add('hidden');
            if (window.location.pathname.includes('profile.html')) {
                window.location.href = 'index.html';
            }
        }
    });

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
