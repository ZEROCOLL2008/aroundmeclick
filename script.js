document.addEventListener('DOMContentLoaded', () => {
    console.log("Index Page Script (script.js) Loaded!");

    // --- 1. GLOBAL VARIABLES & SELECTORS ---
    let commentsListener = null;
    let lastVisiblePost = null;
    let actionCode = null; // To store the password reset code

    const blogPostsGrid = document.getElementById('blog-posts-grid');
    const searchInput = document.getElementById('search-input');
    const postModal = document.getElementById('post-modal');
    const commentForm = document.getElementById('comment-form');
    const postModalContainer = document.getElementById('post-modal-container');
    const toggleFullscreenBtn = document.getElementById('toggle-fullscreen-btn');
    const categoriesContainer = document.getElementById('categories-container');
    const scrollLeftBtn = document.getElementById('scroll-left-btn');
    const scrollRightBtn = document.getElementById('scroll-right-btn');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    // Auth Modal Selectors
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal'); // Added for close button logic
    const resetPasswordModal = document.getElementById('reset-password-modal');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const showResetPasswordLink = document.getElementById('show-reset-password-link');
    const backToLoginLink = document.getElementById('back-to-login-link');
    
    // New Password Modal Selectors
    const newPasswordModal = document.getElementById('new-password-modal');
    const newPasswordForm = document.getElementById('new-password-form');

    // FIX: Add a listener for all modal close buttons
    const allCloseButtons = document.querySelectorAll('.close-modal-btn');
    allCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal-overlay');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    });


    // --- Categories Horizontal Scrolling Logic ---
    if (categoriesContainer && scrollLeftBtn && scrollRightBtn) {
        const scrollAmount = 300;
        scrollLeftBtn.addEventListener('click', () => categoriesContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
        scrollRightBtn.addEventListener('click', () => categoriesContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' }));
    }

    // --- 2. HELPER & CORE FUNCTIONS ---

    // ===== NEWSLETTER SUBSCRIPTION LOGIC START =====
    const setupSubscriptionForm = () => {
        const subscribeForm = document.getElementById('subscribe-form');
        // FIX: Check if the element exists before adding a listener
        if (subscribeForm) {
            subscribeForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const emailInput = document.getElementById('subscribe-email');
                const messageEl = document.getElementById('subscribe-message');
                const subscribeBtn = document.getElementById('subscribe-btn');
                const email = emailInput.value.trim();

                if (!email) {
                    messageEl.textContent = "Please enter your email address.";
                    messageEl.className = "text-sm text-center mt-3 text-red-500";
                    return;
                }

                subscribeBtn.disabled = true;
                subscribeBtn.textContent = 'Subscribing...';
                messageEl.textContent = '';

                try {
                    await db.collection('subscribers').add({
                        email: email,
                        subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    messageEl.textContent = "Thank you for subscribing! 🎉";
                    messageEl.className = "text-sm text-center mt-3 text-green-600";
                    emailInput.value = '';
                } catch (error) {
                    console.error("Error subscribing:", error);
                    messageEl.textContent = "Could not subscribe. Check console for errors.";
                    messageEl.className = "text-sm text-center mt-3 text-red-500";
                } finally {
                    setTimeout(() => {
                        subscribeBtn.disabled = false;
                        subscribeBtn.textContent = 'Subscribe';
                    }, 3000);
                }
            });
        }
    };
    // ===== NEWSLETTER SUBSCRIPTION LOGIC END =====
    
    // ===== PASSWORD RESET LOGIC START (UPDATED) =====
   // ### UPDATED FUNCTION with Better Error Logging ###
    const handlePasswordReset = () => {
        if (resetPasswordForm) {
            const actionCodeSettings = {
                url: window.location.origin + window.location.pathname,
                handleCodeInApp: true
            };

            resetPasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const emailInput = document.getElementById('reset-email');
                const messageEl = document.getElementById('reset-message');
                const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
                const email = emailInput.value.trim();

                if (!email) {
                    messageEl.textContent = 'Please enter your email.';
                    messageEl.className = 'text-sm mt-3 text-red-500 text-center';
                    return;
                }
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
                messageEl.textContent = '';
                
                auth.sendPasswordResetEmail(email, actionCodeSettings).then(() => {
                    messageEl.textContent = 'Success! Please check your email for a reset link.';
                    messageEl.className = 'text-sm mt-3 text-green-600 text-center';
                }).catch(error => {
                    // This part is updated to show the real error
                    console.error("Password Reset Error:", error.code, error.message); 
                    
                    if (error.code === 'auth/user-not-found') {
                        messageEl.textContent = 'No account found with that email address.';
                    } else {
                        messageEl.textContent = 'An error occurred. Please try again.';
                    }
                    messageEl.className = 'text-sm mt-3 text-red-500 text-center';
                }).finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send Reset Link';
                });
            });
        }
    };
    // ===== PASSWORD RESET LOGIC END =====

    const handleNewPasswordSubmit = () => {
        // FIX: Check if the element exists before adding a listener
        if (newPasswordForm) {
            newPasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const newPassword = document.getElementById('new-password-input').value;
                const confirmPassword = document.getElementById('confirm-password-input').value;
                const errorEl = document.getElementById('new-password-error');
                const submitBtn = newPasswordForm.querySelector('button[type="submit"]');

                errorEl.textContent = '';

                if (newPassword.length < 6) {
                    errorEl.textContent = 'Password must be at least 6 characters long.';
                    return;
                }
                if (newPassword !== confirmPassword) {
                    errorEl.textContent = 'Passwords do not match.';
                    return;
                }
                if (!actionCode) {
                    errorEl.textContent = 'Invalid or expired link. Please try again.';
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';
                
                auth.confirmPasswordReset(actionCode, newPassword).then(() => {
                    alert('Password has been reset successfully! Please sign in with your new password.');
                    if(newPasswordModal) newPasswordModal.classList.add('hidden');
                    if(loginModal) loginModal.classList.remove('hidden');
                    
                    const url = new URL(window.location);
                    url.searchParams.delete('mode');
                    url.searchParams.delete('oobCode');
                    url.searchParams.delete('apiKey');
                    url.searchParams.delete('lang');
                    window.history.replaceState({}, '', url);

                }).catch(error => {
                    console.error("Confirm Password Reset Error:", error);
                    errorEl.textContent = 'Failed to reset password. The link may have expired.';
                }).finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Save New Password';
                    actionCode = null;
                });
            });
        }
    };
    
 // ### DEBUGGING FUNCTION ###
    const handleActionFromURL = () => {
        console.log("1. handleActionFromURL function CALLED.");

        const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log("2. onAuthStateChanged listener FIRED.");

            const urlParams = new URLSearchParams(window.location.search);
            const mode = urlParams.get('mode');
            const oobCode = urlParams.get('oobCode');

            console.log("3. Checking URL params:", { mode, oobCode });

            if (mode === 'resetPassword' && oobCode) {
                console.log("4. Password reset mode DETECTED. Verifying code...");
                actionCode = oobCode;

                auth.verifyPasswordResetCode(oobCode)
                .then(email => {
                    console.log(`5. SUCCESS: Code verified for email: ${email}. Opening modal...`);
                    document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.add('hidden'));
                    
                    if (newPasswordModal) {
                        newPasswordModal.classList.remove('hidden');
                        console.log("6. New password modal should be VISIBLE now.");
                    } else {
                        console.error("ERROR: newPasswordModal element not found on page!");
                    }
                })
                .catch(error => {
                    console.error("5. FAILED: Could not verify password reset code.", error);
                    alert('The password reset link is invalid or has expired. Please try again.');
                    actionCode = null;

                    const url = new URL(window.location);
                    url.searchParams.delete('mode');
                    url.searchParams.delete('oobCode');
                    window.history.replaceState({}, '', url);
                });
            } else {
                console.log("4. No password reset mode detected in URL.");
            }
            
            unsubscribe();
        });
    };

    const handleFollowClick = async (authorIdToFollow) => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("Please sign in to follow authors.");
            if(loginModal) loginModal.classList.remove('hidden');
            return;
        }
        if (currentUser.uid === authorIdToFollow) {
            alert("You cannot follow yourself.");
            return;
        }
        const currentUserRef = db.collection('users').doc(currentUser.uid);
        const authorRef = db.collection('users').doc(authorIdToFollow);
        try {
            await db.runTransaction(async (transaction) => {
                const currentUserDoc = await transaction.get(currentUserRef);
                const authorDoc = await transaction.get(authorRef);
                if (!currentUserDoc.exists || !authorDoc.exists) throw "User or author not found!";
                
                const currentUserData = currentUserDoc.data();
                const followingList = currentUserData.following || [];
                const isFollowing = followingList.includes(authorIdToFollow);

                if (isFollowing) {
                    transaction.update(currentUserRef, {
                        following: firebase.firestore.FieldValue.arrayRemove(authorIdToFollow),
                        followingCount: firebase.firestore.FieldValue.increment(-1)
                    });
                    transaction.update(authorRef, {
                        followers: firebase.firestore.FieldValue.arrayRemove(currentUser.uid),
                        followersCount: firebase.firestore.FieldValue.increment(-1)
                    });
                } else {
                    transaction.update(currentUserRef, {
                        following: firebase.firestore.FieldValue.arrayUnion(authorIdToFollow),
                        followingCount: firebase.firestore.FieldValue.increment(1)
                    });
                    transaction.update(authorRef, {
                        followers: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
                        followersCount: firebase.firestore.FieldValue.increment(1)
                    });
                    const notificationData = {
                        recipientId: authorIdToFollow,
                        senderId: currentUser.uid,
                        senderName: currentUser.displayName || 'Someone',
                        type: 'follow',
                        isRead: false,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    db.collection('notifications').add(notificationData);
                }
            });
            updateAllFollowButtonsUI(authorIdToFollow);
        } catch (error) {
            console.error("Error handling follow/unfollow:", error);
            alert("Something went wrong. Please try again.");
        }
    };

    const updateAllFollowButtonsUI = async (authorId) => {
        const currentUser = auth.currentUser;
        const buttons = document.querySelectorAll(`.follow-btn[data-author-id="${authorId}"]`);
        if (buttons.length === 0) return;
        let isFollowing = false;
        if (currentUser) {
            try {
                const userDoc = await db.collection('users').doc(currentUser.uid).get();
                if(userDoc.exists) {
                    const followingList = userDoc.data().following || [];
                    isFollowing = followingList.includes(authorId);
                }
            } catch (e) { console.error("Could not check follow status: ", e); }
        }
        buttons.forEach(button => {
            if (isFollowing) {
                button.textContent = 'Following';
                button.classList.remove('bg-pastel-ivory', 'text-ivory-brown');
                button.classList.add('bg-ivory-brown', 'text-white');
            } else {
                button.textContent = 'Follow';
                button.classList.add('bg-pastel-ivory', 'text-ivory-brown');
                button.classList.remove('bg-ivory-brown', 'text-white');
            }
        });
    };

    const handleShareClick = async (postId) => {
        try {
            const doc = await db.collection('posts').doc(postId).get();
            if (!doc.exists) throw new Error("Post not found!");
            const post = doc.data();

            const url = `${window.location.origin}${window.location.pathname}?post=${postId}`;
            const shareText = `Check out this amazing post from Around Me Click: "${post.title}"`;
            const encodedUrl = encodeURIComponent(url);
            const encodedText = encodeURIComponent(shareText);

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile && navigator.share) {
                await navigator.share({
                    title: post.title,
                    text: shareText,
                    url: url,
                });
            } else {
                const shareModal = document.getElementById('share-modal');
                if (shareModal) {
                    const shareLinkInput = document.getElementById('share-link-input');
                    const copyLinkBtn = document.getElementById('copy-link-btn');
                    const closeShareModalBtn = shareModal.querySelector('.close-share-modal');
                    const facebookShareBtn = document.getElementById('facebook-share-btn');
                    const whatsappShareBtn = document.getElementById('whatsapp-share-btn');

                    if(shareLinkInput) shareLinkInput.value = url;
                    if(facebookShareBtn) facebookShareBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                    if(whatsappShareBtn) whatsappShareBtn.href = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
                    
                    shareModal.classList.remove('hidden');
                    
                    if (copyLinkBtn) {
                        copyLinkBtn.textContent = 'Copy';
                        copyLinkBtn.onclick = () => {
                            navigator.clipboard.writeText(url).then(() => {
                                copyLinkBtn.textContent = 'Copied!';
                                setTimeout(() => { copyLinkBtn.textContent = 'Copy'; }, 2000);
                            });
                        };
                    }
                    if(closeShareModalBtn) closeShareModalBtn.onclick = () => shareModal.classList.add('hidden');
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') console.error("Error sharing post:", error);
        }
    };
    
    const checkUrlForPostId = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const postIdFromUrl = urlParams.get('post');
        if (postIdFromUrl) {
            openPostModal(postIdFromUrl);
        }
    };

    const updateLikeButtonUI = (postId, isLiked, newLikesCount) => {
        const allLikeBtns = document.querySelectorAll(`[data-like-id="${postId}"]`);
        allLikeBtns.forEach(btn => {
            const countSpan = btn.querySelector('.like-count, .like-count-modal');
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
            if(loginModal) loginModal.classList.remove('hidden');
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
                if (!isCurrentlyLiked && postData.authorId !== user.uid) {
                    const notificationData = {
                        recipientId: postData.authorId,
                        senderId: user.uid,
                        senderName: user.displayName || 'Someone',
                        type: 'like',
                        postId: postId,
                        postTitle: postData.title,
                        isRead: false,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    db.collection('notifications').add(notificationData);
                }
            });
        } catch (e) {
            console.error("Like transaction failed: ", e);
            alert("Could not update like. Please try again.");
        }
    };

    const loadComments = (postId) => {
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        commentsList.innerHTML = '<p class="text-gray-500 text-sm">Loading comments...</p>';
        if (commentsListener) commentsListener();
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
        if (!user) {
            alert("Please log in to comment.");
            return;
        }
        if (text.trim() === '') {
            alert("Comment cannot be empty.");
            return;
        }
        if (!commentForm) return;
        const submitButton = commentForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Posting...';
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            let authorName = 'Anonymous', authorAvatar = `https://ui-avatars.com/api/?name=A`;
            if (userDoc.exists) {
                const userData = userDoc.data();
                authorName = userData.displayName || user.displayName || 'Anonymous';
                authorAvatar = userData.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}`;
            } else {
                authorName = user.displayName || 'Anonymous';
                authorAvatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}`;
            }
            const commentData = {
                text, authorId: user.uid, authorName, authorAvatar,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            const postRef = db.collection('posts').doc(postId);
            await postRef.collection('comments').add(commentData);
            await db.runTransaction(async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists) throw "Document does not exist!";
                const newCount = (postDoc.data().commentsCount || 0) + 1;
                transaction.update(postRef, { commentsCount: newCount });
                const countModal = document.getElementById('comment-count-modal');
                if (countModal) countModal.textContent = newCount;
            });
            const postDoc = await postRef.get();
            if (postDoc.exists) {
                const postData = postDoc.data();
                if (postData.authorId !== user.uid) {
                    const notificationData = {
                        recipientId: postData.authorId,
                        senderId: user.uid,
                        senderName: authorName,
                        type: 'comment',
                        postId, postTitle: postData.title,
                        isRead: false,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    db.collection('notifications').add(notificationData);
                }
            }
        } catch (error) {
            console.error("Error submitting comment:", error);
            alert("There was an error posting your comment.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Post Comment';
        }
    };

    const openPostModal = async (postId) => {
        if (!postModal) return;

        const loader = document.getElementById('post-modal-loader');
        const contentWrapper = document.getElementById('post-modal-content-wrapper');

        postModal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        if(loader) loader.classList.remove('hidden');
        if(contentWrapper) contentWrapper.classList.add('invisible');

        try {
            const postDoc = await db.collection('posts').doc(postId).get();
            if (!postDoc.exists) {
                alert("Sorry, the post you are looking for could not be found.");
                closeModal();
                return;
            }
            const post = { id: postDoc.id, ...postDoc.data() };
            if(commentForm) commentForm.dataset.postId = post.id;
            
            const modalTitle = document.getElementById('post-modal-title');
            if(modalTitle) modalTitle.textContent = post.title;

            const mediaContainer = document.getElementById('post-modal-media-container');
            if (mediaContainer) {
                if (post.youtubeVideoId) {
                    mediaContainer.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${post.youtubeVideoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                    mediaContainer.classList.remove('hidden');
                } else if (post.imageUrl) {
                    mediaContainer.innerHTML = `<img src="${post.imageUrl}" alt="Post Image" class="w-full h-full object-contain rounded-lg">`;
                    mediaContainer.classList.remove('hidden');
                } else {
                    mediaContainer.innerHTML = '';
                    mediaContainer.classList.add('hidden');
                }
            }
            
            const postModalDescription = document.getElementById('post-modal-description');
            if (postModalDescription) {
                postModalDescription.innerHTML = post.content;
            }
            
            const currentUser = auth.currentUser;
            const likeBtnModal = postModal.querySelector('.like-btn-modal');
            const likeCountModal = postModal.querySelector('.like-count-modal');
            const commentCountModal = document.getElementById('comment-count-modal');
            const shareBtnModal = postModal.querySelector('.share-btn');
            if (likeBtnModal) likeBtnModal.dataset.likeId = post.id;
            if (likeCountModal) likeCountModal.textContent = post.likesCount || 0;
            if (commentCountModal) commentCountModal.textContent = post.commentsCount || 0;
            if (shareBtnModal) shareBtnModal.dataset.postId = post.id;
            const isLiked = currentUser && post.likedBy && post.likedBy.includes(currentUser.uid);
            updateLikeButtonUI(post.id, isLiked, post.likesCount || 0);
            
            const commentFormContainer = document.getElementById('comment-form-container');
            const commentLoginPrompt = document.getElementById('comment-login-prompt');
            const commentUserAvatar = document.getElementById('comment-user-avatar');
            if (currentUser) {
                if (commentFormContainer) commentFormContainer.classList.remove('hidden');
                if (commentLoginPrompt) commentLoginPrompt.classList.add('hidden');
                if (commentUserAvatar) {
                    commentUserAvatar.src = currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'U')}`;
                }
            } else {
                if (commentFormContainer) commentFormContainer.classList.add('hidden');
                if (commentLoginPrompt) commentLoginPrompt.classList.remove('hidden');
            }
            loadComments(post.id);

            if(loader) loader.classList.add('hidden');
            if(contentWrapper) contentWrapper.classList.remove('invisible');
            
            const url = new URL(window.location);
            url.searchParams.set('post', postId);
            window.history.pushState({ postId: postId }, '', url);

        } catch (error) {
            console.error("Error opening post modal:", error);
            alert("An error occurred while trying to load the post.");
            closeModal();
        }
    };


    const fetchAndDisplayPosts = async (searchTerm = '', selectedCategory = 'all', loadMore = false) => {
        if (!blogPostsGrid) return;
        if (!loadMore) {
            blogPostsGrid.innerHTML = '';
            lastVisiblePost = null;
        }
        try {
            let query = db.collection('posts').where('status', '==', 'approved').orderBy('createdAt', 'desc');
            if (selectedCategory !== 'all') query = query.where('category', '==', selectedCategory.toLowerCase());
            if (loadMore && lastVisiblePost) query = query.startAfter(lastVisiblePost);
            query = query.limit(12);
            const snapshot = await query.get();
            if (snapshot.empty) {
                if (!loadMore) blogPostsGrid.innerHTML = '<p class="col-span-full text-center text-slate-500">No posts found.</p>';
                if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
                return;
            }
            lastVisiblePost = snapshot.docs[snapshot.docs.length - 1];
            if (loadMoreBtn) loadMoreBtn.classList.toggle('hidden', snapshot.docs.length < 12);
            
            const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Note: Client-side search is not ideal for large datasets.
            const filteredPosts = searchTerm ? posts.filter(post =>
                (post.title && post.title.toLowerCase().includes(searchTerm)) ||
                (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
                (post.content && post.content.toLowerCase().includes(searchTerm))
            ) : posts;

            if (filteredPosts.length === 0 && !loadMore) {
                 blogPostsGrid.innerHTML = '<p class="col-span-full text-center text-slate-500">No posts match your search.</p>';
            }

            filteredPosts.forEach(post => {
                const postCard = document.createElement('article');
                postCard.className = 'post-card flex flex-col rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-ivory cursor-pointer open-modal-trigger';
                postCard.dataset.postId = post.id;

                const mediaHtml = post.youtubeVideoId ?
                    `<div class="aspect-video bg-black"><iframe class="w-full h-full pointer-events-none" src="https://www.youtube.com/embed/${post.youtubeVideoId}" title="YouTube video player" frameborder="0"></iframe></div>` :
                    `<div class="relative overflow-hidden w-full h-56"><img src="${post.imageUrl || 'https://picsum.photos/400/300'}" alt="${post.title}" class="w-full h-full object-cover transition duration-300 ease-in-out hover:scale-110"></div>`;
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = post.content || '';
                const excerpt = (tempDiv.textContent || '').substring(0, 80) + '...';

                postCard.innerHTML = `
                    ${mediaHtml}
                    <div class="p-5 flex flex-col flex-grow">
                        <h2 class="font-bold font-lora text-lg mb-2 text-ivory-brown">${post.title}</h2>
                        <p class="text-classic-taupe text-sm mb-4 leading-relaxed flex-grow">${excerpt}</p>
                        <div class="mt-auto pt-4 border-t border-ivory-linen">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <img src="${post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName || 'U'}`}" alt="Author" class="w-8 h-8 rounded-full mr-3 object-cover">
                                    <div>
                                        <span class="font-semibold text-sm text-ivory-brown">${post.authorName || 'Anonymous'}</span>
                                        <p class="text-xs text-classic-taupe">${post.createdAt ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-4">
                                    <button class="like-btn flex items-center space-x-1 text-classic-taupe hover:text-red-500 transition-colors z-10 relative" data-like-id="${post.id}">
                                        <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>
                                        <span class="like-count font-medium text-sm pointer-events-none">${post.likesCount || 0}</span>
                                    </button>
                                    <div class="flex items-center space-x-1 text-classic-taupe">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2s10 4.477 10 10z"></path></svg>
                                        <span class="font-medium text-sm">${post.commentsCount || 0}</span>
                                    </div>
                                    <button class="share-btn flex items-center justify-center w-8 h-8 rounded-full text-classic-taupe hover:bg-pastel-ivory hover:text-blue-500 transition-colors z-10 relative" data-post-id="${post.id}">
                                        <span class="text-xl font-bold transform rotate-90 inline-block pointer-events-none">&#10144;</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                blogPostsGrid.appendChild(postCard);
            });
            checkInitialLikeStatus(auth.currentUser);
        } catch (error) {
            console.error("Error fetching posts:", error);
            if(blogPostsGrid) blogPostsGrid.innerHTML = '<p class="col-span-full text-center text-red-500">Could not load posts.</p>';
        }
    };
    
    const closeModalUI = () => {
        document.body.classList.remove('overflow-hidden');
        if (postModal) {
            const mediaContainer = document.getElementById('post-modal-media-container');
            if (mediaContainer) mediaContainer.innerHTML = '';
            postModal.classList.add('hidden');
        }
        if (commentsListener) commentsListener();
        if (postModalContainer && toggleFullscreenBtn) {
            postModalContainer.classList.remove('fullscreen-modal');
            const enterIcon = toggleFullscreenBtn.querySelector('.enter-fullscreen-icon');
            const exitIcon = toggleFullscreenBtn.querySelector('.exit-fullscreen-icon');
            if (enterIcon) enterIcon.classList.remove('hidden');
            if (exitIcon) exitIcon.classList.add('hidden');
        }
    };
    
    const closeModal = () => {
        closeModalUI();
        const url = new URL(window.location);
        url.searchParams.delete('post');
        window.history.pushState({}, '', url);
    };

    const setupListeners = () => {
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const activeCategory = document.querySelector('.category-button.bg-ivory-brown')?.dataset.category || 'all';
                    fetchAndDisplayPosts(e.target.value.toLowerCase(), activeCategory);
                }, 500);
            });
        }
        const categoryButtons = document.querySelectorAll('.category-button');
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                categoryButtons.forEach(btn => {
                    btn.classList.remove('bg-ivory-brown', 'text-off-white');
                    btn.classList.add('bg-pastel-ivory', 'text-ivory-brown');
                });
                button.classList.add('bg-ivory-brown', 'text-off-white');
                button.classList.remove('bg-pastel-ivory', 'text-ivory-brown');
                fetchAndDisplayPosts(searchInput.value.toLowerCase(), button.dataset.category);
            });
        });

        document.body.addEventListener('click', (e) => {
            const likeBtn = e.target.closest('.like-btn, .like-btn-modal');
            const openTrigger = e.target.closest('.open-modal-trigger');
            const followBtn = e.target.closest('.follow-btn');
            const shareBtn = e.target.closest('.share-btn');
            
            if (likeBtn || followBtn || shareBtn) {
                e.stopPropagation(); 
            }

            if (shareBtn) {
                e.preventDefault();
                const postId = shareBtn.dataset.postId;
                if (postId) handleShareClick(postId);
            } else if (likeBtn) {
                const postId = likeBtn.dataset.likeId;
                if (postId) handleLikeClick(postId);
            } else if (openTrigger) {
                const postId = openTrigger.dataset.postId;
                if (postId) openPostModal(postId);
            } else if (followBtn) {
                const authorId = followBtn.dataset.authorId;
                if (authorId) handleFollowClick(authorId);
            }
        });

        if (postModal) {
            const closeModalButton = document.getElementById('close-post-modal');
            if (closeModalButton) closeModalButton.addEventListener('click', closeModal);
            postModal.addEventListener('click', e => {
                if (e.target === postModal) closeModal();
            });
        }

        if (toggleFullscreenBtn && postModalContainer) {
            toggleFullscreenBtn.addEventListener('click', () => {
                postModalContainer.classList.toggle('fullscreen-modal');
                const enterIcon = toggleFullscreenBtn.querySelector('.enter-fullscreen-icon');
                const exitIcon = toggleFullscreenBtn.querySelector('.exit-fullscreen-icon');
                const isFullscreen = postModalContainer.classList.contains('fullscreen-modal');
                if (enterIcon) enterIcon.classList.toggle('hidden', isFullscreen);
                if (exitIcon) exitIcon.classList.toggle('hidden', !isFullscreen);
            });
        }
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const postId = e.currentTarget.dataset.postId;
                const commentTextarea = document.getElementById('comment-textarea');
                if (postId && commentTextarea && commentTextarea.value.trim() !== '') {
                    handleCommentSubmit(postId, commentTextarea.value);
                    commentTextarea.value = '';
                }
            });
        }
        const loginFromCommentBtn = document.getElementById('login-from-comment-btn');
        if (loginFromCommentBtn && loginModal) {
            loginFromCommentBtn.addEventListener('click', () => {
                closeModal();
                loginModal.classList.remove('hidden');
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape" && postModal && !postModal.classList.contains('hidden')) {
                closeModal();
            }
        });

        window.addEventListener('popstate', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('post');
            const isModalOpen = postModal && !postModal.classList.contains('hidden');

            if (postId && !isModalOpen) {
                openPostModal(postId);
            } else if (!postId && isModalOpen) {
                closeModalUI();
            }
        });

        if (showResetPasswordLink && loginModal && resetPasswordModal) {
            showResetPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginModal.classList.add('hidden');
                resetPasswordModal.classList.remove('hidden');
            });
        }
        if (backToLoginLink && loginModal && resetPasswordModal) {
            backToLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                resetPasswordModal.classList.add('hidden');
                loginModal.classList.remove('hidden');
            });
        }
    };

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            const selectedCategory = document.querySelector('.category-button.bg-ivory-brown')?.dataset.category || 'all';
            fetchAndDisplayPosts(searchInput.value.toLowerCase(), selectedCategory, true);
        });
    }


    // --- 4. INITIAL PAGE LOAD ---
    setupSubscriptionForm();
    handlePasswordReset();
    handleNewPasswordSubmit();
    handleActionFromURL();
    setupHeroBackgroundSlider(); 
    setupFeaturedPostsSlider(); 
    fetchAndDisplayPosts();
    setupListeners();
    displayTopAuthorsByLikes();
    checkUrlForPostId();
});

// Helper functions (unchanged)
async function displayTopAuthorsByLikes() {
    const container = document.getElementById('popular-authors-container');
    if (!container) return;

    try {
        const postsSnapshot = await db.collection('posts').where('status', '==', 'approved').get();

        if (postsSnapshot.empty) {
            container.innerHTML = '<p class="text-sm text-classic-taupe">No posts with likes found.</p>';
            return;
        }

        const authorData = {};
        postsSnapshot.forEach(doc => {
            const post = doc.data();
            const authorId = post.authorId;
            const likes = post.likesCount || 0;

            if (authorId) {
                if (!authorData[authorId]) {
                    authorData[authorId] = {
                        id: authorId,
                        displayName: post.authorName,
                        photoURL: post.authorAvatar,
                        totalLikes: 0
                    };
                }
                authorData[authorId].totalLikes += likes;
            }
        });

        const sortedAuthors = Object.values(authorData).sort((a, b) => b.totalLikes - a.totalLikes);
        const topAuthors = sortedAuthors.slice(0, 5);

        if (topAuthors.length === 0) {
             container.innerHTML = '<p class="text-sm text-classic-taupe">No authors with likes found.</p>';
             return;
        }

        const currentUser = auth.currentUser;
        let currentUserFollowing = [];
        if (currentUser) {
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            if (userDoc.exists) {
                currentUserFollowing = userDoc.data().following || [];
            }
        }

        let authorsHTML = '<div class="space-y-4">';
        topAuthors.forEach(author => {
            const authorAvatar = author.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.displayName || 'U')}`;
            let followButtonHTML = '';

            if (currentUser && currentUser.uid !== author.id) {
                const isFollowing = currentUserFollowing.includes(author.id);
                if (isFollowing) {
                    followButtonHTML = `<button class="follow-btn px-3 py-1 text-xs font-semibold rounded-full bg-ivory-brown text-white transition-colors" data-author-id="${author.id}">Following</button>`;
                } else {
                    followButtonHTML = `<button class="follow-btn px-3 py-1 text-xs font-semibold rounded-full bg-pastel-ivory text-ivory-brown transition-colors" data-author-id="${author.id}">Follow</button>`;
                }
            }

           authorsHTML += `
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 min-w-0">
                        <img src="${authorAvatar}" alt="${author.displayName || 'Author'}" class="w-10 h-10 rounded-full object-cover flex-shrink-0">
                        <div class="min-w-0">
                            <p class="font-semibold text-ivory-brown truncate">${author.displayName || 'Anonymous'}</p>
                            <p class="text-xs text-classic-taupe">❤️ ${author.totalLikes} Likes</p>
                        </div>
                    </div>
                    ${followButtonHTML}
                </div>
            `;
        });
        authorsHTML += '</div>';
        container.innerHTML = authorsHTML;

    } catch (error) {
        console.error("Error fetching top authors by likes:", error);
        container.innerHTML = '<p class="text-sm text-red-500">Could not load authors.</p>';
    }
}

async function setupHeroBackgroundSlider() {
    const heroSwiperWrapper = document.querySelector('#hero-background-swiper .swiper-wrapper');
    if (!heroSwiperWrapper) return;

    const backgroundImages = [
        'https://images.unsplash.com/photo-175542 shinobi.com/photo-1755429562521-cb944ea054ab?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://plus.unsplash.com/premium_photo-1755895180436-1acb3275ab96?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    ];

    heroSwiperWrapper.innerHTML = '';

    backgroundImages.forEach(imageUrl => {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'swiper-slide';
        slideDiv.style.backgroundImage = `url('${imageUrl}')`;
        slideDiv.style.backgroundSize = 'cover';
        slideDiv.style.backgroundPosition = 'center';
        slideDiv.style.filter = 'brightness(0.6)';
        heroSwiperWrapper.appendChild(slideDiv);
    });

    new Swiper('#hero-background-swiper', {
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        speed: 1000,
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        },
    });
}

async function setupFeaturedPostsSlider() {
    const wrapper = document.getElementById('featured-swiper-wrapper');
    if (!wrapper) return;

    try {
        const snapshot = await db.collection('posts')
            .where('status', '==', 'approved')
            .orderBy('likesCount', 'desc')
            .limit(5)
            .get();

        if (snapshot.empty) {
            const featuredSection = document.getElementById('featured-swiper');
            if(featuredSection) featuredSection.parentElement.style.display = 'none';
            return;
        }

        let slidesHTML = '';
        snapshot.forEach(doc => {
            const post = { id: doc.id, ...doc.data() };
            
            slidesHTML += `
               <div class="swiper-slide flex flex-col md:flex-row bg-ivory cursor-pointer open-modal-trigger md:h-80" data-post-id="${post.id}">
                    <div class="md:w-1/2 h-64 md:h-full">
                        <img src="${post.imageUrl || 'https://picsum.photos/800/600'}" alt="${post.title}" class="w-full h-full object-cover">
                    </div>
                    <div class="md:w-1/2 p-6 lg:p-8 flex flex-col">
                        <p class="text-sm font-semibold uppercase tracking-wider text-classic-taupe mb-2">${post.category || 'General'}</p>
                        <h2 class="text-2xl lg:text-3xl font-bold font-lora text-ivory-brown mb-4 flex-grow">${post.title}</h2>
                        <div class="mt-auto flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <img src="${post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName || 'U'}`}" alt="Author" class="w-10 h-10 rounded-full object-cover">
                                <div>
                                    <p class="font-semibold text-ivory-brown">${post.authorName || 'Anonymous'}</p>
                                    <p class="text-xs text-classic-taupe">${post.createdAt ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2 text-classic-taupe font-semibold">
                                <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path></svg>
                                <span>${post.likesCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        wrapper.innerHTML = slidesHTML;

        new Swiper('#featured-swiper', {
            loop: true,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });

    } catch (error) {
        console.error("Error setting up featured posts slider:", error);
        const featuredSection = document.getElementById('featured-swiper');
        if(featuredSection) featuredSection.parentElement.style.display = 'none';
    }
}