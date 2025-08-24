// =================================================================
//     FINAL SCRIPT.JS - INDEX PAGE LOGIC
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Index Page Script (script.js) Loaded!");

    const blogPostsGrid = document.getElementById('blog-posts-grid');
    const searchInput = document.getElementById('search-input');
    const categoryButtons = document.querySelectorAll('.category-button');

    // Firestore එකෙන් posts අරගෙන පෙන්වන ප්‍රධාන function එක
    const fetchAndDisplayPosts = async (searchTerm = '', selectedCategory = 'all') => {
        if (!blogPostsGrid) {
            console.error("Blog posts grid not found!");
            return;
        }

        try {
            blogPostsGrid.innerHTML = '<p class="col-span-full text-center text-slate-500">Loading posts...</p>';

            let query = db.collection('posts').orderBy('createdAt', 'desc');

            if (selectedCategory !== 'all') {
                query = query.where('category', '==', selectedCategory.toLowerCase());
            }

            const snapshot = await query.get();
            
            if (snapshot.empty) {
                blogPostsGrid.innerHTML = '<p class="col-span-full text-center text-slate-500">No matching posts found.</p>';
                return;
            }

            const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const filteredPosts = posts.filter(post => {
                const title = post.title ? post.title.toLowerCase() : '';
                const content = post.content ? post.content.toLowerCase() : '';
                const searchLower = searchTerm.toLowerCase();
                return title.includes(searchLower) || content.includes(searchLower);
            });
            
            blogPostsGrid.innerHTML = '';

            if (filteredPosts.length === 0) {
                blogPostsGrid.innerHTML = '<p class="col-span-full text-center text-slate-500">No matching posts found.</p>';
                return;
            }
            
            filteredPosts.forEach(post => {
                // Corrected: Using <article> instead of <a>
                const postCard = document.createElement('article');
                postCard.className = 'block rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white cursor-pointer';

                // Corrected: Using the full content for the popup, and a simple excerpt for the card
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = post.content || '';
                const postText = tempDiv.textContent || tempDiv.innerText || '';
                const excerpt = postText.substring(0, 150) + '...';
                
                const authorAvatar = post.authorAvatar || 'https://ui-avatars.com/api/?name=User&background=random';
                const authorName = post.authorName || 'Anonymous';
                const postDate = post.createdAt ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'N/A';
                const postImage = post.imageUrl || '';

                // Store full content in a data attribute for the popup
                postCard.dataset.fullContent = post.content;

                postCard.innerHTML = `
                   <div class="relative overflow-hidden w-full">
        <img src="${postImage}" alt="${post.title}" class="w-full object-cover transition duration-300 ease-in-out hover:scale-110">
    </div>
    <div class="p-5">
        <h2 class="font-bold text-lg mb-2 text-slate-800 hover:text-blue-600 transition-colors">
            ${post.title}
        </h2>
        <p class="text-slate-600 text-sm mb-4 font-serif leading-relaxed">
            ${excerpt}
        </p>
        <div class="flex items-center mt-4">
            <img src="${authorAvatar}" alt="Author" class="w-8 h-8 rounded-full mr-3">
            <div>
                <span class="font-semibold text-sm text-slate-700">${authorName}</span>
                <p class="text-xs text-slate-500">
                    ${postDate} 
                    <span class="inline-block text-xs text-slate-400 ml-1">
                        <svg class="w-3 h-3 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </span>
                </p>
            </div>
        </div>
    </div>
`;
                blogPostsGrid.appendChild(postCard);
            });
            
            // Corrected: Call the function to add popup listeners AFTER posts are added to the DOM
            addPopupListeners();

        } catch (error) {
            console.error("Error fetching or filtering posts:", error);
            blogPostsGrid.innerHTML = '<p class="col-span-full text-center text-red-500">Could not load posts. Please try again later.</p>';
        }
    };

    // A dedicated function for popup logic to be called after posts are loaded
    const addPopupListeners = () => {
        const postModal = document.getElementById('post-modal');
        const closePostModalBtn = document.getElementById('close-post-modal');
        const postModalImage = document.getElementById('post-modal-image');
        const postModalTitle = document.getElementById('post-modal-title');
        const postModalDescription = document.getElementById('post-modal-description');
        
        // Get all the articles in the blog posts grid
        const allPosts = document.querySelectorAll('#blog-posts-grid article');
        
        allPosts.forEach(post => {
            post.addEventListener('click', () => {
                const imageSrc = post.querySelector('img').src;
                const postTitle = post.querySelector('h2').textContent.trim();
                const postDescription = post.dataset.fullContent;

                postModalImage.src = imageSrc;
                postModalTitle.textContent = postTitle;
                postModalDescription.innerHTML = postDescription; // Use innerHTML to render full content with formatting

                postModal.classList.remove('hidden');
                postModal.classList.add('flex');
            });
        });

        if(closePostModalBtn){
             closePostModalBtn.addEventListener('click', () => {
                postModal.classList.add('hidden');
                postModal.classList.remove('flex');
            });
        }
       
        window.addEventListener('click', (event) => {
            if (event.target === postModal) {
                postModal.classList.add('hidden');
                postModal.classList.remove('flex');
            }
        });
    }

    // Category Buttons වලට Event Listeners එකතු කිරීම
    categoryButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const selectedCategory = e.target.dataset.category;
            
            categoryButtons.forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
                btn.classList.add('bg-white', 'text-slate-700', 'border-slate-300');
            });
            e.target.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
            e.target.classList.remove('bg-white', 'text-slate-700', 'border-slate-300');

            if (searchInput) {
                searchInput.value = '';
            }

            fetchAndDisplayPosts('', selectedCategory);
        });
    });

    // Search bar එකේ input එක වෙනස් වෙනකොට posts ෆිල්ටර් කිරීම
    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const searchTerm = e.target.value;
                
                categoryButtons.forEach(btn => {
                    btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
                    btn.classList.add('bg-white', 'text-slate-700', 'border-slate-300');
                });
                
                fetchAndDisplayPosts(searchTerm);
            }, 300);
        });
    }

    // Page එක load වූ වහාම posts ටික fetch කිරීම
    fetchAndDisplayPosts();

    // Mobile Categories Modal Logic
    const categoriesModal = document.getElementById('categories-modal');
    const openCategoriesBtn = document.getElementById('open-categories-modal');
    const closeCategoriesBtn = document.getElementById('close-categories-modal');

    if (openCategoriesBtn) {
        openCategoriesBtn.addEventListener('click', () => {
            if (categoriesModal) {
                categoriesModal.classList.remove('hidden');
                categoriesModal.classList.add('flex');
            }
        });
    }

    if (closeCategoriesBtn) {
        closeCategoriesBtn.addEventListener('click', () => {
            if (categoriesModal) {
                categoriesModal.classList.add('hidden');
                categoriesModal.classList.remove('flex');
            }
        });
    }
});