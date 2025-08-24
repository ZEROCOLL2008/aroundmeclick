// =================================================================
//     CREATE-POST.JS - WITH MULTI-IMAGE UPLOAD & VALIDATION FIX
// =================================================================
document.addEventListener('DOMContentLoaded', () => {

    if (typeof firebase === 'undefined' || typeof auth === 'undefined' || typeof db === 'undefined' || typeof IMGBB_API_KEY === 'undefined') {
        return console.error("Firebase or API Key not initialized. Make sure app.js runs first.");
    }
    console.log("create-post.js Script Loaded!");

    // --- ELEMENT SELECTORS ---
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
    
    let uploadedFiles = []; // Array to store selected image files

    // --- TINYMCE RICH TEXT EDITOR INITIALIZATION & VALIDATION ---
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

    function validatePostForm() {
        // Enables publish button only if there is content in the editor
        const content = tinymce.get('post-content').getContent({ format: 'text' });
        if (content.trim() !== '') {
            publishPostBtn.disabled = false;
        } else {
            publishPostBtn.disabled = true;
        }
    }

    // --- MULTI-IMAGE PREVIEW LOGIC ---
    postImageInput.addEventListener('change', (event) => {
        const files = event.target.files;
        for (const file of files) {
            uploadedFiles.push(file); // Add new files to our array
        }
        renderPreviews();
        postImageInput.value = ''; // Clear the input so user can select the same file again if needed
    });

    function renderPreviews() {
        imagePreviewContainer.innerHTML = ''; // Clear existing previews
        uploadedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewWrapper = document.createElement('div');
                previewWrapper.className = 'relative w-24 h-24';
                previewWrapper.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-full object-cover rounded-md">
                    <button data-index="${index}" class="remove-img-btn absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold leading-none">&times;</button>
                `;
                imagePreviewContainer.appendChild(previewWrapper);
            }
            reader.readAsDataURL(file);
        });
    }

    imagePreviewContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-img-btn')) {
            const indexToRemove = parseInt(event.target.getAttribute('data-index'), 10);
            uploadedFiles.splice(indexToRemove, 1); // Remove file from array
            renderPreviews(); // Re-render the previews
        }
    });

    // --- FORM SUBMISSION LOGIC (UPDATED FOR MULTIPLE IMAGES) ---
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            publishPostBtn.disabled = true;
            publishPostBtn.textContent = 'Publishing...';
            try {
                const user = auth.currentUser;
                if (!user) throw new Error("You must be logged in.");

                // Upload all selected images to ImgBB in parallel
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

                // Extract title and content from editor
                const contentHTML = tinymce.get('post-content').getContent();
                const domParser = new DOMParser();
                const postDocument = domParser.parseFromString(contentHTML, 'text/html');
                const firstHeading = postDocument.querySelector('h1, h2, h3, h4');
                let title = '';
                if (firstHeading) { title = firstHeading.textContent.trim(); }
                else { const plainText = postDocument.body.textContent || ""; title = plainText.substring(0, 60); }
                if (!title.trim()) throw new Error("Post must have a title or some text.");
                
                // Prepare and save data to Firestore
                const postData = {
                    title, content: contentHTML, 
                    category: document.getElementById('post-category').value.toLowerCase(),
                    imageUrls: imageUrls, // Saving an array of URLs
                    imageUrl: imageUrls[0] || '', // Save the first image as the main cover image
                    authorId: user.uid,
                    authorName: user.displayName || 'Anonymous',
                    authorAvatar: user.photoURL,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    likesCount: 0, commentsCount: 0
                };
                await db.collection("posts").add(postData);
                
                alert("Blog post published successfully!");
                createPostForm.reset();
                tinymce.get('post-content').setContent('');
                uploadedFiles = [];
                renderPreviews();
                createPostModal.classList.add('hidden');

            } catch (error) {
                console.error("Error creating post:", error);
                alert(`Error: ${error.message}`);
            } finally {
                publishPostBtn.disabled = false;
                publishPostBtn.textContent = 'Publish';
            }
        });
    }

     // Add your existing modal open/close logic here
     openModalBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', () => {
            if (createPostModal) createPostModal.classList.remove('hidden');
        });
    });
    if(closeCreateModalBtn) closeCreateModalBtn.addEventListener('click', () => {
        if (createPostModal) createPostModal.classList.add('hidden');
    });
});