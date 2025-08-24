// =================================================================
//     PROFILE.JS - FINAL & COMPLETE SCRIPT (WITH IMAGE UPLOADS)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {

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
        try {
            const postsQuery = db.collection('posts').where('authorId', '==', userId).orderBy('createdAt', 'desc');
            const snapshot = await postsQuery.get();
            myPostsGrid.innerHTML = '';

            if (snapshot.empty) {
                myPostsGrid.innerHTML = '<p class="text-slate-500 col-span-full">You have not written any posts yet.</p>';
                return;
            } 
            
            snapshot.forEach(doc => {
                const post = doc.data();
                const postDate = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';
                const article = document.createElement('article');
                article.className = "bg-white rounded-lg shadow-md overflow-hidden transition duration-300 ease-in-out hover:shadow-xl";
                
                // Updated HTML with Edit and Delete buttons
                article.innerHTML = `
                    <div class="relative overflow-hidden h-48 bg-slate-200">
                        <img src="${post.imageUrl || 'https://picsum.photos/400/300'}" alt="Blog post image" class="w-full h-full object-cover transition duration-300 ease-in-out hover:scale-110">
                    </div>
                    <div class="p-5 flex justify-between items-center">
                        <div>
                            <h3 class="font-bold text-lg mb-2 text-slate-800 truncate">${post.title}</h3>
                            <p class="text-slate-500 text-sm">${postDate}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button class="edit-post-btn text-blue-500 hover:text-blue-700 transition" data-id="${doc.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L15.232 5.232z" />
                                </svg>
                            </button>
                            <button class="delete-post-btn text-red-500 hover:text-red-700 transition" data-id="${doc.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.013 21H7.987a2 2 0 01-1.92-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
                myPostsGrid.appendChild(article);
            });

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

        } catch (error) {
            console.error("Error loading user posts:", error);
            myPostsGrid.innerHTML = '<p class="text-red-500 col-span-full">Could not load posts. Please try again.</p>';
        }
    }

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
                
                const postData = {
                    title, 
                    content: contentHTML, 
                    category: document.getElementById('post-category').value.toLowerCase(),
                    imageUrls: imageUrls,
                    imageUrl: imageUrls[0] || '',
                    authorId: user.uid,
                    authorName: user.displayName || 'Anonymous',
                    authorAvatar: user.photoURL,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
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