// =================================================================
//     PROFILE.JS - FINAL & COMPLETE SCRIPT (WITH IMAGE UPLOADS)
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

    // New element selectors for Edit Post Modal
    const editPostModal = document.getElementById('edit-post-modal');
    const editPostForm = document.getElementById('edit-post-form');
    const closeEditPostModalBtn = document.getElementById('close-edit-post-modal');
    const updatePostBtn = document.getElementById('update-post-btn');

    // 3. CORE AUTH STATE LISTENER
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
                setupEventListeners(user);
                
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

    // 4. DATA DISPLAY FUNCTIONS
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
            
            // This is the new, correct UI for each post card
            article.innerHTML = `
                <div class="relative overflow-hidden h-48 bg-slate-200 cursor-pointer view-post-trigger" data-post-id="${post.id}">
                    <img src="${post.imageUrl || 'https://picsum.photos/400/300'}" alt="Blog post image" class="w-full h-full object-cover transition-transform duration-300 hover:scale-110">
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
    const postViewModal = document.getElementById('post-view-modal');
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
    postViewModal.classList.add('flex');
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
                const commentDate = comment.createdAt ? new Date(comment.createdAt.toDate()).toLocaleString() : '';
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

const handleCommentSubmit = async (postId, text) => {
    const user = auth.currentUser;
    if (!user || !text.trim()) return;

    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists) return;
    const userData = userDoc.data();
    
    const commentData = {
        text: text,
        authorId: user.uid,
        authorName: userData.displayName || 'Anonymous',
        authorAvatar: userData.photoURL || `https://ui-avatars.com/api/?name=${userData.displayName || 'U'}`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const postRef = db.collection('posts').doc(postId);
    await postRef.collection('comments').add(commentData);
    await postRef.update({ commentsCount: firebase.firestore.FieldValue.increment(1) });
    
    loadUserPosts(user.uid);
};

            // Attach event listeners for edit and delete buttons
            const editButtons = myPostsGrid.querySelectorAll('.edit-post-btn');
            const deleteButtons = myPostsGrid.querySelectorAll('.delete-post-btn');

            editButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const postId = e.currentTarget.dataset.id;
                    openEditModal(postId);
                });
            });

            deleteButtons.forEach(button => {
                button.addEventListener('click', async (e) => {
                    const postId = e.currentTarget.dataset.id;
                    if (confirm("Are you sure you want to delete this post?")) {
                        await deletePost(postId);
                    }
                });
            });

    
    // =================================================================
    //     DELETE POST FUNCTION
    // =================================================================
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

    // =================================================================
    //     EDIT POST FUNCTIONS
    // =================================================================
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
                editor.mode.set('design');
            } else {
                console.error("TinyMCE editor for 'edit-post-content' not found.");
            }

            editPostModal.classList.remove('hidden');
            editPostModal.classList.add('flex');

        } catch (error) {
            console.error("Error fetching post data for edit:", error);
            alert(`Error: ${error.message}`);
        }
    }

    // 5. EVENT LISTENERS
    if(logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());
    if(profileDropdownBtn) profileDropdownBtn.addEventListener('click', () => profileDropdownMenu.classList.toggle('hidden'));
    
    // --- IMAGE PREVIEW LOGIC ---
    if (avatarPhotoInput) {
        avatarPhotoInput.addEventListener('change', (event) => {
            if (event.target.files && event.target.files[0]) {
                newAvatarFile = event.target.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    avatarPreview.src = e.target.result;
                }
                reader.readAsDataURL(newAvatarFile);
            }
        });
    }

    if (coverPhotoInput) {
        coverPhotoInput.addEventListener('change', (event) => {
            if (event.target.files && event.target.files[0]) {
                newCoverFile = event.target.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    coverPreview.src = e.target.result;
                }
                reader.readAsDataURL(newCoverFile);
            }
        });
    }

    // --- MODAL OPEN/CLOSE & FORM SUBMISSION LOGIC ---
    if (openEditModalBtn) {
        openEditModalBtn.addEventListener('click', () => {
            document.getElementById('display-name-input').value = profileDisplayName.textContent;
            document.getElementById('bio-input').value = profileBio.textContent;
            avatarPreview.src = profileAvatar.src;
            coverPreview.src = profileBanner.src;
            newAvatarFile = null;
            newCoverFile = null;
            editProfileModal.classList.remove('hidden');
        });
    }

    if(closeEditModalBtn) closeEditModalBtn.addEventListener('click', () => editProfileModal.classList.add('hidden'));

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
                    if (result.success) {
                        updatedData.photoURL = result.data.url;
                    } else {
                        throw new Error('Avatar image upload failed.');
                    }
                }

                if (newCoverFile) {
                    const formData = new FormData();
                    formData.append('image', newCoverFile);
                    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
                    const result = await response.json();
                    if (result.success) {
                        updatedData.coverPhotoURL = result.data.url;
                    } else {
                        throw new Error('Cover image upload failed.');
                    }
                }

                const userDocRef = db.collection('users').doc(user.uid);
                await userDocRef.update(updatedData);

                alert('Profile updated successfully!');
                editProfileModal.classList.add('hidden');
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

    // ===============================================================
    //     CREATE POST MODAL LOGIC
    // ===============================================================
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
                
                // Edit button එක සඳහාද disable/enable logic එක එකතු කරන්න
                const updatePostBtn = document.getElementById('update-post-btn');
                if(updatePostBtn) updatePostBtn.disabled = content.trim() === '';
            });
        }
    });

    if(postImageInput) {
        postImageInput.addEventListener('change', (event) => {
            const files = event.target.files;
            for (const file of files) uploadedFiles.push(file);
            renderPreviews();
            postImageInput.value = '';
        });
    }

    function renderPreviews() {
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
    
    if(imagePreviewContainer) {
        imagePreviewContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-img-btn')) {
                const indexToRemove = parseInt(event.target.getAttribute('data-index'), 10);
                uploadedFiles.splice(indexToRemove, 1);
                renderPreviews();
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
                if (!user) throw new Error("You must be logged in to create a post.");
                
                const uploadPromises = uploadedFiles.map(file => {
                    const formData = new FormData();
                    formData.append('image', file);
                    return fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData })
                        .then(response => response.json());
                });

                const uploadResults = await Promise.all(uploadPromises);
                const imageUrls = uploadResults.map(result => result.success ? result.data.url : null).filter(Boolean);
                
                const contentHTML = tinymce.get('post-content').getContent();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = contentHTML;
                const firstHeading = tempDiv.querySelector('h1, h2, h3, h4, h5, h6');
                let title = firstHeading ? firstHeading.textContent.trim() : (tempDiv.textContent.trim().substring(0, 60) || "Untitled Post");
               // profile.js -> createPostForm event listener

                                   const postData = {
                        title,
                        content: contentHTML,
                        category: document.getElementById('post-category').value.toLowerCase(),
                        imageUrls: imageUrls, // Saving an array of URLs
                        imageUrl: imageUrls[0] || '', // Save the first image as the main cover image
                        authorId: user.uid,
                        authorName: user.displayName || 'Anonymous',
                        authorAvatar: user.photoURL,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'pending',
                        
                        // --- Likes සහ Comments වලට අදාල අලුත් fields ---
                        likesCount: 0,
                        likedBy: [], // Like කරපු අයගේ ID ටික තියාගන්න හිස් Array එකක්
                        commentsCount: 0
                    };
                await db.collection("posts").add(postData);
                
                alert("Blog post published successfully!");
                createPostForm.reset();
                tinymce.get('post-content').setContent('');
                uploadedFiles = [];
                renderPreviews();
                createPostModal.classList.add('hidden');
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

    openModalBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (createPostModal) createPostModal.classList.remove('hidden');
        });
    });

    if(closeCreateModalBtn) closeCreateModalBtn.addEventListener('click', () => {
        if (createPostModal) createPostModal.classList.add('hidden');
    });

    if(closeEditPostModalBtn){
        closeEditPostModalBtn.addEventListener('click', () => {
            editPostModal.classList.add('hidden');
            editPostModal.classList.remove('flex');
        });
    }

    if(editPostForm){
        editPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updateBtn = document.getElementById('update-post-btn');
            updateBtn.disabled = true;
            updateBtn.textContent = 'Updating...';

            try {
                const user = auth.currentUser;
                if (!user) throw new Error("You must be logged in to edit a post.");
                
                const postId = document.getElementById('edit-post-id').value;
                const updatedTitle = document.getElementById('edit-post-title').value;
                const updatedCategory = document.getElementById('edit-post-category').value;
                const updatedContent = tinymce.get('edit-post-content').getContent();

                const postRef = db.collection('posts').doc(postId);
                await postRef.update({
                    title: updatedTitle,
                    category: updatedCategory,
                    content: updatedContent
                });

                alert('Post updated successfully!');
                editPostModal.classList.add('hidden');
                loadUserPosts(user.uid);

            } catch (error) {
                console.error("Error updating post:", error);
                alert(`Error: ${error.message}`);
            } finally {
                updateBtn.disabled = false;
                updateBtn.textContent = 'Update Post';
            }
        });
    }

});