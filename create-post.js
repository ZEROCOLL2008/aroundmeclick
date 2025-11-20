// =================================================================
//     CREATE-POST.JS - FULL CODE (Dynamic Categories + Multi-Image)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    // ඔයාගේ ImgBB API Key එක මෙතන තියෙන්න ඕන
    const IMGBB_API_KEY = 'b7c6e89aa03e53347ef4215d2c615d3d'; 

    if (typeof firebase === 'undefined' || typeof auth === 'undefined' || typeof db === 'undefined') {
        return console.error("Firebase not initialized. Make sure app.js runs first.");
    }
    console.log("create-post.js Script Loaded!");

    // --- 1. DYNAMIC CATEGORY LOADING (New Feature) ---
    const categorySelect = document.getElementById('post-category');
    
    if (categorySelect) {
        // Database එකේ categories collection එකෙන් නම් ටික ගන්නවා
        db.collection('categories').orderBy('name').onSnapshot((snapshot) => {
            // Dropdown එක clear කරලා මුල් option එක දානවා
            categorySelect.innerHTML = '<option value="" disabled selected>Select a Topic</option>';
            
            if (snapshot.empty) {
                console.warn("No categories found in Firestore.");
                return;
            }

            snapshot.forEach((doc) => {
                const cat = doc.data();
                const option = document.createElement('option');
                
                // Value එක simple letters වලින් (database save වෙන්න)
                option.value = cat.name.toLowerCase();
                // Text එක user ට පේන්න (මුල අකුර Capitalize කරලා තිබුණත් කමක් නෑ, කෙලින්ම නම දාමු)
                option.text = cat.name;
                
                categorySelect.appendChild(option);
            });
        }, (error) => {
            console.error("Error loading categories:", error);
            categorySelect.innerHTML = '<option value="" disabled>Error loading categories</option>';
        });
    }

    // --- ELEMENT SELECTORS ---
    const createPostModal = document.getElementById('create-post-modal');
    const createPostForm = document.getElementById('create-post-form');
    const openModalBtns = [
        document.getElementById('open-create-modal-main-btn'),
        document.getElementById('open-create-modal-article-btn'),
        document.getElementById('open-create-modal-media-btn'),
        document.getElementById('header-create-post-btn'),
        document.getElementById('bottom-nav-create-post-link') // Mobile nav link එකත් එකතු කළා
    ];
    const closeCreateModalBtn = document.getElementById('close-create-modal-btn');
    const publishPostBtn = document.getElementById('publish-post-btn');
    const postImageInput = document.getElementById('post-image-input');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    
    let uploadedFiles = []; // Select කරන පින්තූර තියාගන්න Array එකක්

    // --- TINYMCE RICH TEXT EDITOR INITIALIZATION ---
    // (Script එක load වෙලා නම් විතරක් run වෙනවා)
    if (typeof tinymce !== 'undefined') {
        // පරණ editor එකක් තිබුණොත් remove කරනවා (duplicate නොවෙන්න)
        if (tinymce.get('post-content')) {
            tinymce.get('post-content').remove();
        }

        tinymce.init({
            selector: '#post-content',
            plugins: 'autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
            toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | link image | removeformat | help',
            height: 300,
            menubar: false,
            placeholder: 'Write your title using a heading, then start your story...',
            setup: function (editor) {
                editor.on('input', validatePostForm);
                editor.on('change', validatePostForm);
            }
        });
    }

    function validatePostForm() {
        if (typeof tinymce === 'undefined' || !tinymce.get('post-content')) return;
        
        const content = tinymce.get('post-content').getContent({ format: 'text' });
        // Content එකක් තියෙනවා නම් විතරක් Publish button එක active කරනවා
        if (content.trim() !== '') {
            publishPostBtn.disabled = false;
        } else {
            publishPostBtn.disabled = true;
        }
    }

    // --- MULTI-IMAGE PREVIEW LOGIC ---
    if (postImageInput) {
        postImageInput.addEventListener('change', (event) => {
            const files = event.target.files;
            for (const file of files) {
                uploadedFiles.push(file);
            }
            renderPreviews();
            postImageInput.value = ''; // Input එක reset කරනවා
        });
    }

    function renderPreviews() {
        if (!imagePreviewContainer) return;
        imagePreviewContainer.innerHTML = ''; 
        uploadedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewWrapper = document.createElement('div');
                previewWrapper.className = 'relative w-24 h-24';
                previewWrapper.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-full object-cover rounded-md border border-gray-200">
                    <button type="button" data-index="${index}" class="remove-img-btn absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold leading-none hover:bg-red-700 shadow-sm">&times;</button>
                `;
                imagePreviewContainer.appendChild(previewWrapper);
            }
            reader.readAsDataURL(file);
        });
    }

    if (imagePreviewContainer) {
        imagePreviewContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-img-btn')) {
                const indexToRemove = parseInt(event.target.getAttribute('data-index'), 10);
                uploadedFiles.splice(indexToRemove, 1);
                renderPreviews();
            }
        });
    }

    // --- FORM SUBMISSION LOGIC ---
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Category එක select කරලාද බලන්න
            const categorySelectEl = document.getElementById('post-category');
            const selectedCategory = categorySelectEl ? categorySelectEl.value : '';
            
            if (!selectedCategory) {
                alert("Please select a category.");
                return;
            }

            publishPostBtn.disabled = true;
            publishPostBtn.textContent = 'Publishing...';
            
            try {
                const user = auth.currentUser;
                if (!user) throw new Error("You must be logged in.");

                // 1. Images Upload කරනවා (ImgBB)
                const uploadPromises = uploadedFiles.map(file => {
                    const formData = new FormData();
                    formData.append('image', file);
                    return fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData })
                        .then(response => response.json());
                });
                
                const uploadResults = await Promise.all(uploadPromises);
                const imageUrls = uploadResults.map(result => {
                    if (result.success) return result.data.url;
                    return null;
                }).filter(url => url !== null);

                // 2. TinyMCE එකෙන් Content ගන්නවා
                let contentHTML = '';
                if (typeof tinymce !== 'undefined' && tinymce.get('post-content')) {
                    contentHTML = tinymce.get('post-content').getContent();
                } else {
                     contentHTML = document.getElementById('post-content').value;
                }

                // 3. Title එක Auto-Generate කරනවා (Content එකෙන්)
                const domParser = new DOMParser();
                const postDocument = domParser.parseFromString(contentHTML, 'text/html');
                const firstHeading = postDocument.querySelector('h1, h2, h3, h4');
                let title = '';
                if (firstHeading) { 
                    title = firstHeading.textContent.trim(); 
                } else { 
                    const plainText = postDocument.body.textContent || ""; 
                    title = plainText.substring(0, 60) + (plainText.length > 60 ? "..." : ""); 
                }
                
                if (!title.trim()) throw new Error("Please write something in the content area.");
                
               // 4. Firestore එකට Data Save කරනවා
                const postData = {
                    title: title,
                    content: contentHTML,
                    category: selectedCategory, 
                    imageUrls: imageUrls, 
                    imageUrl: imageUrls[0] || '', // Cover Image එක විදියට පලමු පින්තූරය
                    authorId: user.uid,
                    authorName: user.displayName || 'Anonymous',
                    authorAvatar: user.photoURL || null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'pending', // Admin Approve කරනකන් Pending
                    likesCount: 0,
                    likedBy: [],
                    commentsCount: 0
                };
                
                await db.collection("posts").add(postData);
                
                alert("Blog post submitted successfully! It will be visible after admin approval.");
                
                // Form එක Reset කරනවා
                createPostForm.reset();
                if (typeof tinymce !== 'undefined' && tinymce.get('post-content')) {
                    tinymce.get('post-content').setContent('');
                }
                uploadedFiles = [];
                renderPreviews();
                
                if(createPostModal) createPostModal.classList.add('hidden');

            } catch (error) {
                console.error("Error creating post:", error);
                alert(`Error: ${error.message}`);
            } finally {
                publishPostBtn.disabled = false;
                publishPostBtn.textContent = 'Publish';
            }
        });
    }

    // --- MODAL OPEN/CLOSE LOGIC ---
    openModalBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', (e) => {
            e.preventDefault(); // Link click වුනොත් redirect වෙන එක නවත්තන්න
            if (createPostModal) {
                createPostModal.classList.remove('hidden');
                // Modal එක අරිනකොට category එක reset කරනවා
                if (categorySelect) categorySelect.value = "";
            }
        });
    });
    
    if(closeCreateModalBtn) closeCreateModalBtn.addEventListener('click', () => {
        if (createPostModal) createPostModal.classList.add('hidden');
    });
    
    // Modal එකේ එලිය click කලොත් close වෙන්න
    if (createPostModal) {
        createPostModal.addEventListener('click', (e) => {
            if (e.target === createPostModal) {
                createPostModal.classList.add('hidden');
            }
        });
    }
});