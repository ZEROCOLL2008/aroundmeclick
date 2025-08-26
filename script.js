document.addEventListener('DOMContentLoaded', () => {
    console.log("Index Page Script (script.js) Loaded!");

    // --- 1. GLOBAL VARIABLES & SELECTORS ---
    let commentsListener = null; // Real-time listener for comments
    const blogPostsGrid = document.getElementById('blog-posts-grid');
    const searchInput = document.getElementById('search-input');
    const categoryButtons = document.querySelectorAll('.category-button');
    const postModal = document.getElementById('post-modal');
    const commentForm = document.getElementById('comment-form');

    // --- 2. HELPER & CORE FUNCTIONS ---

    const updateLikeButtonUI = (postId, isLiked, newLikesCount) => {
        const allLikeBtns = document.querySelectorAll(`[data-like-id="${postId}"]`);
        allLikeBtns.forEach(btn => {
            const countSpan = btn.querySelector('.like-count');
            const svgIcon = btn.querySelector('svg');
            if (countSpan) countSpan.textContent = newLikesCount;
            if (svgIcon) {
                if (isLiked) {
                    svgIcon.classList.add('text-red-500');
                    svgIcon.setAttribute('fill', 'currentColor');
                } else {
                    svgIcon.classList.remove('text-red-500');
                    svgIcon.setAttribute('fill', 'none');
                }
            }
        });
    };

    const checkInitialLikeStatus = (user) => {
        if (!user || !document.querySelector('.like-btn')) return;
        document.querySelectorAll('.like-btn').forEach(async (btn) => {
            const postId = btn.dataset.likeId;
            if (!postId) return;
            const postRef = db.collection('posts').doc(postId);
            try {
                const doc = await postRef.get();
                if (doc.exists) {
                    const likedBy = doc.data().likedBy || [];
                    if (likedBy.includes(user.uid)) {
                        const svgIcon = btn.querySelector('svg');
                        if (svgIcon) {
                           svgIcon.classList.add('text-red-500');
                           svgIcon.setAttribute('fill', 'currentColor');
                        }
                    }
                }
            } catch (error) {
                console.error("Error checking initial like status for post:", postId, error);
            }
        });
    };

    const handleLikeClick = async (postId) => {
        const user = auth.currentUser;
        if (!user) {
            alert("Please log in to like a post.");
            document.getElementById('login-modal')?.classList.remove('hidden');
            return;
        }
        const postRef = db.collection('posts').doc(postId);
        try {
            await db.runTransaction(async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists) throw "Document does not exist!";
                const postData = postDoc.data();
                const likedBy = postData.likedBy || [];
                const isCurrentlyLiked = likedBy.includes(user.uid);
                
                transaction.update(postRef, {
                    likedBy: isCurrentlyLiked ? firebase.firestore.FieldValue.arrayRemove(user.uid) : firebase.firestore.FieldValue.arrayUnion(user.uid),
                    likesCount: firebase.firestore.FieldValue.increment(isCurrentlyLiked ? -1 : 1)
                });
                const newLikesCount = (postData.likesCount || 0) + (isCurrentlyLiked ? -1 : 1);
                updateLikeButtonUI(postId, !isCurrentlyLiked, newLikesCount);
            });
        } catch (e) {
            console.error("Like transaction failed: ", e);
        }
    };
    
    const loadComments = (postId) => {
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        commentsList.innerHTML = '<p class="text-gray-500 text-sm">Loading comments...</p>';
        if (commentsListener) commentsListener(); // Unsubscribe from previous listener
        
        commentsListener = db.collection('posts').doc(postId).collection('comments').orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                if (snapshot.empty) {
                    commentsList.innerHTML = '<p class="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>';
                    return;
                }
                commentsList.innerHTML = '';
                snapshot.forEach(doc => {
                    const comment = doc.data();
                    const commentDate = comment.createdAt ? new Date(comment.createdAt.toDate()).toLocaleString() : '';
                    const commentDiv = document.createElement('div');
                    commentDiv.className = 'flex items-start space-x-3';
                    commentDiv.innerHTML = `
                        <img src="${comment.authorAvatar || 'https://ui-avatars.com/api/?name=User'}" alt="Author Avatar" class="w-10 h-10 rounded-full">
                        <div class="flex-1 bg-gray-100 rounded-lg p-3">
                            <div class="flex items-baseline space-x-2">
                                <p class="font-semibold text-sm text-gray-800">${comment.authorName}</p>
                                <p class="text-xs text-gray-500">${commentDate}</p>
                            </div>
                            <p class="text-sm text-gray-700 mt-1 whitespace-pre-wrap">${comment.text}</p>
                        </div>`;
                    commentsList.appendChild(commentDiv);
                });
            }, error => {
                console.error("Error listening for comments: ", error);
                commentsList.innerHTML = '<p class="text-red-500 text-sm">Could not load comments.</p>';
            });
    };

    const handleCommentSubmit = async (postId, text) => {
        const user = auth.currentUser;
        if (!user) { alert("Please log in to comment."); return; }
        if (text.trim() === '') { alert("Comment cannot be empty."); return; }
        
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
        
        const countModal = document.getElementById('comment-count-modal');
        if(countModal) countModal.textContent = parseInt(countModal.textContent || '0') + 1;
    };

    const openPostModal = async (postId) => {
        if (!postModal || !commentForm) return;
        const postDoc = await db.collection('posts').doc(postId).get();
        if (!postDoc.exists) { console.error("Post not found!"); return; }
        const post = { id: postDoc.id, ...postDoc.data() };
        const currentUser = auth.currentUser;

        commentForm.dataset.postId = post.id;
        document.getElementById('post-modal-title').textContent = post.title;
        document.getElementById('post-modal-image').src = post.imageUrl || '';
        document.getElementById('post-modal-description').innerHTML = post.content;
        
        const likeBtnModal = postModal.querySelector('.like-btn-modal');
        const likeCountModal = postModal.querySelector('.like-count-modal');
        const commentCountModal = document.getElementById('comment-count-modal');
        
        likeBtnModal.dataset.likeId = post.id;
        likeCountModal.textContent = post.likesCount || 0;
        if (commentCountModal) commentCountModal.textContent = post.commentsCount || 0;

        const isLiked = currentUser && post.likedBy && post.likedBy.includes(currentUser.uid);
        updateLikeButtonUI(post.id, isLiked, post.likesCount || 0);

        const commentUserAvatar = document.getElementById('comment-user-avatar');
        if (currentUser && commentUserAvatar) {
             commentUserAvatar.src = currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'U'}`;
        }
        
        loadComments(post.id);
        postModal.classList.remove('hidden');
        postModal.classList.add('flex');
    };

    const fetchAndDisplayPosts = async (searchTerm = '', selectedCategory = 'all') => {
        if (!blogPostsGrid) return;
        blogPostsGrid.innerHTML = '<p class="col-span-full text-center text-slate-500">Loading posts...</p>';
        try {
            let query = db.collection('posts').where('status', '==', 'approved').orderBy('createdAt', 'desc');
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
                const title = (post.title || '').toLowerCase();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = post.content || '';
                const content = (tempDiv.textContent || '').toLowerCase();
                return title.includes(searchTerm.toLowerCase()) || content.includes(searchTerm.toLowerCase());
            });

            blogPostsGrid.innerHTML = '';
            filteredPosts.forEach(post => {
                const postCard = document.createElement('article');
                postCard.className = 'post-card flex flex-col rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white';
                postCard.dataset.postId = post.id;
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = post.content || '';
                const excerpt = (tempDiv.textContent || '').substring(0, 100) + '...';
                
                postCard.innerHTML = `
                    <div class="relative overflow-hidden w-full h-56 cursor-pointer open-modal-trigger">
                        <img src="${post.imageUrl || 'https://picsum.photos/400/300'}" alt="${post.title}" class="w-full h-full object-cover transition duration-300 ease-in-out hover:scale-110">
                    </div>
                    <div class="p-5 flex flex-col flex-grow">
                        <h2 class="font-bold text-lg mb-2 text-slate-800 cursor-pointer open-modal-trigger">${post.title}</h2>
                        <p class="text-slate-600 text-sm mb-4 font-serif leading-relaxed flex-grow cursor-pointer open-modal-trigger">${excerpt}</p>
                        <div class="flex items-center mt-4">
                            <img src="${post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName || 'User'}`}" alt="Author" class="w-8 h-8 rounded-full mr-3">
                            <div>
                                <span class="font-semibold text-sm text-slate-700">${post.authorName || 'Anonymous'}</span>
                                <p class="text-xs text-slate-500">${post.createdAt ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                        <div class="mt-4 pt-4 border-t border-slate-200 flex items-center space-x-6">
                            <button class="like-btn flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors" data-like-id="${post.id}">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>
                                <span class="like-count font-semibold">${post.likesCount || 0}</span>
                            </button>
                            <div class="flex items-center space-x-2 text-gray-500 cursor-pointer open-modal-trigger">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2s10 4.477 10 10z"></path></svg>
                                <span class="font-semibold">${post.commentsCount || 0}</span>
                            </div>
                        </div>
                    </div>`;
                blogPostsGrid.appendChild(postCard);
            });
            
            checkInitialLikeStatus(auth.currentUser);
        } catch (error) {
            console.error("Error fetching posts:", error);
            blogPostsGrid.innerHTML = '<p class="col-span-full text-center text-red-500">Could not load posts.</p>';
        }
    };
    
    // --- 3. EVENT LISTENERS SETUP ---
    
    const setupListeners = () => {
        // Category Buttons
        categoryButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const selectedCategory = e.currentTarget.dataset.category;
                searchInput.value = '';
                categoryButtons.forEach(btn => {
                    btn.classList.remove('bg-blue-600', 'text-white');
                    btn.classList.add('bg-white', 'text-slate-700');
                });
                e.currentTarget.classList.add('bg-blue-600', 'text-white');
                e.currentTarget.classList.remove('bg-white', 'text-slate-700');
                fetchAndDisplayPosts('', selectedCategory);
            });
        });

        // Search Input
        if (searchInput) {
            let timeoutId;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    fetchAndDisplayPosts(e.target.value, 'all');
                }, 300);
            });
        }

        // Clicks on the main grid (Handles Likes and Modal Opening)
        if (blogPostsGrid) {
            blogPostsGrid.addEventListener('click', (e) => {
                const likeBtn = e.target.closest('.like-btn');
                const openTrigger = e.target.closest('.open-modal-trigger');

                if (likeBtn) {
                    handleLikeClick(likeBtn.dataset.likeId);
                } else if (openTrigger) {
                    const postId = e.target.closest('.post-card').dataset.postId;
                    openPostModal(postId);
                }
            });
        }
        
        // Clicks and closing logic for the post modal
        if (postModal) {
            const closeModalButton = document.getElementById('close-post-modal');
            if (closeModalButton) {
                closeModalButton.addEventListener('click', () => {
                    postModal.classList.remove('flex');
                    postModal.classList.add('hidden');
                    if (commentsListener) commentsListener(); // Unsubscribe
                });
            }

            postModal.addEventListener('click', e => {
                if (e.target === postModal) {
                    postModal.classList.remove('flex');
                    postModal.classList.add('hidden');
                    if (commentsListener) commentsListener(); // Unsubscribe
                }
                const likeBtn = e.target.closest('.like-btn-modal');
                if (likeBtn) handleLikeClick(likeBtn.dataset.likeId);
            });
        }

        // Comment Form Submission
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const postId = e.currentTarget.dataset.postId;
                const commentTextarea = document.getElementById('comment-textarea');
                if (postId && commentTextarea.value.trim() !== '') {
                    handleCommentSubmit(postId, commentTextarea.value);
                    commentTextarea.value = '';
                }
            });
        }

        // Close Modal with Escape Key
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape" && postModal && !postModal.classList.contains('hidden')) {
                postModal.classList.remove('flex');
                postModal.classList.add('hidden');
                if (commentsListener) commentsListener(); // Unsubscribe
            }
        });
    };

    // --- 4. INITIAL PAGE LOAD ---
    fetchAndDisplayPosts();
    setupListeners();
});