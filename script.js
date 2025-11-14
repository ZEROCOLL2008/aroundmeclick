// 'async' kiyana eka mekata add kala, mokada categories load wenakan inna ona nisa
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Index Page Script (script.js) Loaded!");

    let commentsListener = null;
    let lastVisiblePost = null;
    let actionCode = null; 

    // --- HELPER FUNCTIONS (profile.js වලින් ගත්ත) ---
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
    // --- END HELPER FUNCTIONS ---

    // === MEWA OKKOMA ALUTH HTML EKATA GALAPENNA HADUWA ===
    const blogPostsGrid = document.getElementById('blog-posts-grid');
    // const searchInput = document.getElementById('search-input'); // <-- MEKA AIN KALA. MEKA THAMAI PRASHNE.
    const postModal = document.getElementById('post-modal');
    const commentForm = document.getElementById('comment-form');
    const postModalContainer = document.getElementById('post-modal-container');
    const toggleFullscreenBtn = document.getElementById('toggle-fullscreen-btn');
    const categoriesContainer = document.getElementById('categories-container');
    const scrollLeftBtn = document.getElementById('scroll-left-btn');
    const scrollRightBtn = document.getElementById('scroll-right-btn');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    // Auth Modals (Mewa dan drawers, eth password reset eka thiyenawa)
    const loginModal = document.getElementById('login-modal'); // Old modal
    const resetPasswordModal = document.getElementById('reset-password-modal'); // Old modal
    const resetPasswordForm = document.getElementById('reset-password-form');
    const showResetPasswordLink = document.getElementById('show-reset-password-link');
    const backToLoginLink = document.getElementById('back-to-login-link');
    
    const newPasswordModal = document.getElementById('new-password-modal');
    const newPasswordForm = document.getElementById('new-password-form');
    // === END DOM ELEMENTS ===


    const allCloseButtons = document.querySelectorAll('.close-modal-btn');
    allCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal-overlay');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    });

    if (categoriesContainer && scrollLeftBtn && scrollRightBtn) {
        const scrollAmount = 300;
        scrollLeftBtn.addEventListener('click', () => categoriesContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
        scrollRightBtn.addEventListener('click', () => categoriesContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' }));
    }

    const setupSubscriptionForm = () => {
        const subscribeForm = document.getElementById('subscribe-form');
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
    
    const handlePasswordReset = () => {
        // This function is for the old modal, but we'll keep it.
        // The new logic is in setupAuthDrawerListeners
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

    const handleNewPasswordSubmit = () => {
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
                    
                    // Open the new auth drawer instead
                    const drawerLoginBtn = document.getElementById('drawer-login-btn') || document.getElementById('login-btn');
                    if (drawerLoginBtn) drawerLoginBtn.click();
                    
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

    // ========== ALUTH FUNCTION EKA (CATEGORIES LOAD KARANA) ==========
    const fetchAndDisplayCategories = async () => {
        const container = document.getElementById('categories-container');
        const drawerContainer = document.getElementById('drawer-categories-content');
        if (!container || !drawerContainer) {
            console.error("Category containers not found");
            return;
        }

        // Main Nav Bar ("All Stories" button eka hadanawa)
        let navBarHtml = `
            <button class="category-button flex items-center gap-2 pl-2 pr-4 py-1.5 bg-ivory-brown text-off-white rounded-full whitespace-nowrap font-medium" data-category="all">
                <img src="https://i.ibb.co/P4S83fV/all-stories-icon.png" alt="All" class="w-6 h-6 rounded-full object-cover">
                <span>All Stories</span>
            </button>
        `;
        
        // Drawer Menu ("All Stories" button eka hadanawa)
        let drawerHtml = `
            <div class="flex flex-col space-y-1">
                <button class="category-button flex items-center gap-3 w-full text-left px-4 py-3 rounded-md font-medium text-ivory-brown bg-pastel-ivory" data-category="all">
                    <img src="https://i.ibb.co/P4S83fV/all-stories-icon.png" alt="All" class="w-6 h-6 rounded-full object-cover">
                    <span>All Stories</span>
                </button>
        `;

        try {
            const snapshot = await db.collection('categories').orderBy('name', 'asc').get();
            
            if (snapshot.empty) {
                console.log("No categories found in Firestore.");
            } else {
                snapshot.forEach(doc => {
                    const category = doc.data();
                    
                    // Main Nav Bar button HTML eka
                    navBarHtml += `
                        <button class="category-button flex items-center gap-2 pl-2 pr-4 py-1.5 bg-pastel-ivory text-ivory-brown rounded-full whitespace-nowrap font-medium hover:bg-classic-taupe hover:text-off-white" data-category="${category.name.toLowerCase()}">
                            <img src="${category.iconUrl}" alt="${category.name}" class="w-6 h-6 rounded-full object-cover">
                            <span>${category.name}</span>
                        </button>
                    `;

                    // Drawer Menu button HTML eka
                    drawerHtml += `
                        <button class="category-button flex items-center gap-3 w-full text-left px-4 py-3 rounded-md font-medium text-classic-taupe hover:bg-pastel-ivory" data-category="${category.name.toLowerCase()}">
                            <img src="${category.iconUrl}" alt="${category.name}" class="w-6 h-6 rounded-full object-cover">
                            <span>${category.name}</span>
                        </button>
                    `;
                });
            }
            
            drawerHtml += '</div>'; // Close drawer's flex container
            
            container.innerHTML = navBarHtml; // Main nav bar eka replace karanawa
            drawerContainer.innerHTML = drawerHtml; // Drawer eka replace karanawa

        } catch (error) {
            console.error("Error fetching categories: ", error);
            const errorMsg = '<p class="text-sm text-red-500">Could not load categories.</p>';
            container.innerHTML = errorMsg;
            drawerContainer.innerHTML = errorMsg;
        }
    };
    // ========== END ALUTH FUNCTION EKA ==========

    // ========== ALUTH FUNCTION EKA (AUTH LOGIC) ==========
    const setupAuthDrawerListeners = () => {
        const loginFormDrawer = document.getElementById('login-form-drawer');
        const signupFormDrawer = document.getElementById('signup-form-drawer');
        const resetFormDrawer = document.getElementById('reset-password-form-drawer');
        
        const loginErrorDrawer = document.getElementById('login-error-drawer');
        const signupErrorDrawer = document.getElementById('signup-error-drawer');
        const resetMessageDrawer = document.getElementById('reset-message-drawer');

        // 1. Login Logic
        if (loginFormDrawer) {
            loginFormDrawer.addEventListener('submit', (e) => {
                e.preventDefault();
                if (loginErrorDrawer) loginErrorDrawer.textContent = '';
                const email = loginFormDrawer['login-email'].value;
                const password = loginFormDrawer['login-password'].value;
                
                const submitBtn = loginFormDrawer.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Signing In...';
                }

                auth.signInWithEmailAndPassword(email, password)
                    .then(userCredential => {
                        // UI update eka onAuthStateChanged eken handle wenawa
                        document.body.classList.remove('auth-drawer-open');
                        loginFormDrawer.reset();
                    })
                    .catch(error => {
                        if (loginErrorDrawer) loginErrorDrawer.textContent = error.message;
                    })
                    .finally(() => {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Sign In';
                        }
                    });
            });
        }

        // 2. Signup Logic
        if (signupFormDrawer) {
            signupFormDrawer.addEventListener('submit', (e) => {
                e.preventDefault();
                if (signupErrorDrawer) signupErrorDrawer.textContent = '';
                const name = signupFormDrawer['signup-name'].value;
                const email = signupFormDrawer['signup-email'].value;
                const password = signupFormDrawer['signup-password'].value;

                if (password.length < 6) {
                    if (signupErrorDrawer) signupErrorDrawer.textContent = 'Password must be at least 6 characters.';
                    return;
                }

                const submitBtn = signupFormDrawer.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Joining...';
                }

                auth.createUserWithEmailAndPassword(email, password)
                    .then(userCredential => {
                        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B5E34&color=fff`;
                        return userCredential.user.updateProfile({
                            displayName: name,
                            photoURL: defaultAvatar
                        }).then(() => {
                            // Firestore database eke aluth user kenek create karanawa
                            db.collection('users').doc(userCredential.user.uid).set({
                                displayName: name,
                                email: email,
                                photoURL: defaultAvatar,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                bio: '',
                                role: 'user', // Default role eka
                                followers: [],
                                following: [],
                                followersCount: 0,
                                followingCount: 0
                            }).then(() => {
                                // UI update eka onAuthStateChanged eken handle wenawa
                                document.body.classList.remove('auth-drawer-open');
                                signupFormDrawer.reset();
                            });
                        });
                    })
                    .catch(error => {
                        if (signupErrorDrawer) signupErrorDrawer.textContent = error.message;
                    })
                    .finally(() => {
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Agree & Join';
                        }
                    });
            });
        }

        // 3. Reset Password Logic
        if (resetFormDrawer) {
            resetFormDrawer.addEventListener('submit', (e) => {
                e.preventDefault();
                if (resetMessageDrawer) {
                     resetMessageDrawer.textContent = '';
                     resetMessageDrawer.className = 'text-sm mt-3 min-h-[20px] text-center';
                }
                const email = resetFormDrawer['reset-email'].value;
                
                const submitBtn = resetFormDrawer.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Sending...';
                }
                
                auth.sendPasswordResetEmail(email)
                    .then(() => {
                        if (resetMessageDrawer) {
                            resetMessageDrawer.textContent = 'Check your email for a reset link!';
                            resetMessageDrawer.classList.add('text-green-600');
                        }
                    })
                    .catch(error => {
                        if (resetMessageDrawer) {
                            resetMessageDrawer.textContent = error.message;
                            resetMessageDrawer.classList.add('text-red-500');
                        }
                    })
                    .finally(() => {
                         if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Send Reset Link';
                        }
                    });
            });
        }
    };
    // ========== END AUTH LOGIC FUNCTION ==========


    const handleFollowClick = async (authorIdToFollow) => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("Please sign in to follow authors.");
            // if(loginModal) loginModal.classList.remove('hidden'); // Old modal
            
            // Open new auth drawer
            const drawerLoginBtn = document.getElementById('drawer-login-btn') || document.getElementById('login-btn');
            if (drawerLoginBtn) drawerLoginBtn.click();
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
            // if(loginModal) loginModal.classList.remove('hidden'); // Old modal
            
            // Open new auth drawer
            const drawerLoginBtn = document.getElementById('drawer-login-btn') || document.getElementById('login-btn');
            if (drawerLoginBtn) drawerLoginBtn.click();
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
            
            // *** Search Term Logic eka wenas kala ***
            if (searchTerm) {
                // Me query eka Firestore walata weda karanne naha. 
                // Simple search ekak witharak karamu
                // Eka nisa searchTerm eka me query eken passe filter karamu
            }
            
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
            
            // *** Search Filter eka me thanata gaththa ***
            const filteredPosts = searchTerm ? posts.filter(post =>
                (post.title && post.title.toLowerCase().includes(searchTerm)) ||
                (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
                (post.content && createSnippet(post.content, 1000).toLowerCase().includes(searchTerm)) // Snippet eka search karanna
            ) : posts;

            if (filteredPosts.length === 0 && !loadMore) {
                 blogPostsGrid.innerHTML = '<p class="col-span-full text-center text-slate-500">No posts match your search.</p>';
            }

            filteredPosts.forEach(post => {
                const postCard = document.createElement('article');
                postCard.className = 'post-card flex flex-col rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-ivory cursor-pointer open-modal-trigger';
                postCard.dataset.postId = post.id;

                const snippet = createSnippet(post.content, 80);
                const readTime = calculateReadTime(post.content);
                const category = post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'General';

                const mediaHtml = post.youtubeVideoId ?
                    `<div class="aspect-video bg-black relative">
                        <iframe class="w-full h-full pointer-events-none" src="https://www.youtube.com/embed/${post.youtubeVideoId}" title="YouTube video player" frameborder="0"></iframe>
                        <span class="absolute bottom-3 left-3 px-3 py-1 bg-white/90 text-ivory-brown rounded-full text-xs font-semibold backdrop-blur-sm">${category}</span>
                    </div>` :
                    `<div class="relative overflow-hidden w-full aspect-video">
                        <img src="${post.imageUrl || 'https://picsum.photos/400/300'}" alt="${post.title}" class="w-full h-full object-cover transition duration-300 ease-in-out hover:scale-110">
                        <span class="absolute bottom-3 left-3 px-3 py-1 bg-white/90 text-ivory-brown rounded-full text-xs font-semibold backdrop-blur-sm">${category}</span>
                    </div>`;
                
                postCard.innerHTML = `
                    ${mediaHtml}
                    <div class="p-5 flex flex-col flex-grow">
                        <div class="flex items-center space-x-2 text-sm text-classic-taupe mb-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span>${readTime}</span>
                        </div>
                        <h2 class="font-bold font-lora text-lg mb-2 text-ivory-brown">${post.title}</h2>
                        <p class="text-classic-taupe text-sm mb-4 leading-relaxed flex-grow">${snippet}</p>
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
                                        <svg class="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 4.186m0-4.186c.54.121 1.07.312 1.566.55m-1.566-.55L11.99 3.937m-3.232 8.523c.54-.121 1.07-.312 1.566-.55m-1.566.55l-3.232-8.523m3.232 8.523l3.232 8.523m0 0l3.232-8.523m-3.232 8.523c-.54.121-1.07.312-1.566.55m1.566-.55l3.232-8.523" /></svg>
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
        // === PRASHNAYA THIBBA 'searchInput' EKA ME THANIN AIN KALA ===
        // if (searchInput) { ... }
        
        // --- CATEGORY BUTTONS (Main Nav + Drawer) ---
        // Me listener eka dan body ekata add karanawa, dynamic buttons walata weda karanna
        document.body.addEventListener('click', (e) => {
            const categoryBtn = e.target.closest('.category-button');
            if (categoryBtn) {
                const category = categoryBtn.dataset.category;
                
                // === ALUTH SEARCH INPUT EKE VALUE EKA GANNAWA ===
                const searchDrawerInput = document.getElementById('search-drawer-input');
                const searchTerm = searchDrawerInput ? searchDrawerInput.value.toLowerCase() : '';

                // Main nav bar eke buttons update karanawa
                document.querySelectorAll('#categories-container .category-button').forEach(btn => {
                    if (btn.dataset.category === category) {
                        btn.classList.add('bg-ivory-brown', 'text-off-white');
                        btn.classList.remove('bg-pastel-ivory', 'text-ivory-brown', 'hover:bg-classic-taupe', 'hover:text-off-white');
                    } else {
                        btn.classList.remove('bg-ivory-brown', 'text-off-white');
                        btn.classList.add('bg-pastel-ivory', 'text-ivory-brown', 'hover:bg-classic-taupe', 'hover:text-off-white');
                    }
                });

                // Drawer eke buttons update karanawa
                document.querySelectorAll('#drawer-categories-content .category-button').forEach(btn => {
                     if (btn.dataset.category === category) {
                        btn.classList.add('bg-pastel-ivory', 'text-ivory-brown');
                        btn.classList.remove('text-classic-taupe');
                    } else {
                        btn.classList.remove('bg-pastel-ivory', 'text-ivory-brown');
                        btn.classList.add('text-classic-taupe');
                    }
                });

                // === SEARCH TERM EKA EKKA POSTS LOAD KARANAWA ===
                fetchAndDisplayPosts(searchTerm, category);
                
                // Drawer eka wahanawa (mobile waladi)
                const leftDrawer = document.getElementById('left-drawer');
                if (leftDrawer && document.body.classList.contains('drawer-open')) { // 'open' class eka nemei, body class eka check karanna
                    document.getElementById('left-drawer-backdrop').click();
                }
            }
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
                if (!e.target.closest('.like-btn, .share-btn, .follow-btn')) {
                     const postId = openTrigger.dataset.postId;
                     if (postId) openPostModal(postId);
                }
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
            
            const readMoreBtn = document.getElementById('read-more-btn');
            const postModalContainer = document.getElementById('post-modal-container');
            if (readMoreBtn && postModalContainer) {
                readMoreBtn.addEventListener('click', () => {
                    postModalContainer.classList.add('fullscreen-modal'); 
                    const enterIcon = toggleFullscreenBtn.querySelector('.enter-fullscreen-icon');
                    const exitIcon = toggleFullscreenBtn.querySelector('.exit-fullscreen-icon');
                    if (enterIcon) enterIcon.classList.add('hidden');
                    if (exitIcon) exitIcon.classList.remove('hidden');
                });
            }
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
        if (loginFromCommentBtn) {
            loginFromCommentBtn.addEventListener('click', () => {
                closeModal();
                const drawerLoginBtn = document.getElementById('drawer-login-btn') || document.getElementById('login-btn');
                if (drawerLoginBtn) drawerLoginBtn.click();
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
            // === ALUTH SEARCH INPUT EKEN VALUE EKA GANNAWA ===
            const searchDrawerInput = document.getElementById('search-drawer-input');
            const searchTerm = searchDrawerInput ? searchDrawerInput.value.toLowerCase() : '';
            fetchAndDisplayPosts(searchTerm, selectedCategory, true);
        });
    }

    // === INLINE SCRIPT EKE THIBBA LOGIC EKA MEKE THIYENNA ONE NE, ETH HARIYATAMA HARI IDS USE KARAMU ===
    const mobileHamburgerBtn = document.getElementById('mobile-hamburger-btn');
    const leftDrawer = document.getElementById('left-drawer');
    const leftDrawerBackdrop = document.getElementById('left-drawer-backdrop');

    if (mobileHamburgerBtn && leftDrawer && leftDrawerBackdrop) {
        // This logic is in the inline script, so it's fine
    }
    
    const drawerCategoriesLink = document.getElementById('drawer-categories-link');
    if (drawerCategoriesLink) {
        drawerCategoriesLink.addEventListener('click', () => {
             if(leftDrawer) leftDrawer.classList.remove('open'); // 'open' class eka HTML eke naha
             if(leftDrawerBackdrop) leftDrawerBackdrop.classList.add('hidden'); // 'hidden' class eka HTML eke naha
             
             // Body eken class eka ain karamu (inline script eka anuwa)
             document.body.classList.remove('drawer-open');
        });
    }
    
    const socialContainer = document.getElementById('floating-social-container');
    const extraButtons = document.querySelectorAll('.floating-btn-extra');
    let floatButtonLastScrollY = window.scrollY; 

    if (socialContainer) {
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > floatButtonLastScrollY && currentScrollY > 200) {
                extraButtons.forEach(btn => btn.classList.add('collapsed'));
            } else if (currentScrollY < floatButtonLastScrollY) {
                extraButtons.forEach(btn => btn.classList.remove('collapsed'));
            }
            floatButtonLastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
        });
    }

    const mobileSearchForm = document.getElementById('mobile-search-form');
    if (mobileSearchForm) {
        mobileSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = document.getElementById('search-drawer-input').value;
            console.log("Mobile Search Query:", query);
            
            // === DESKTOP SEARCH INPUT EKAK NATHI NISA, DIRECTLY POSTS LOAD KARANAWA ===
            const activeCategory = document.querySelector('.category-button.bg-ivory-brown')?.dataset.category || 'all';
            fetchAndDisplayPosts(query.toLowerCase(), activeCategory);

            // Close search drawer
            document.body.classList.remove('search-drawer-open');
        });
    }

    // ========== ME THIYENNE ALUTH LOADING ORDER EKA ==========
    setupSubscriptionForm();
    handlePasswordReset(); // Old modal logic
    handleNewPasswordSubmit(); // New password modal logic
    handleActionFromURL(); // URL-based password reset
    setupHeroBackgroundSlider(); 
    setupFeaturedPostsSlider(); 
    
    setupAuthDrawerListeners(); // *** ALUTH AUTH LOGIC EKA ATTACH KALA ***
    
    await fetchAndDisplayCategories(); // *** MULINMA CATEGORIES LOAD KARANAWA ***
    
    fetchAndDisplayPosts(); // <-- Ita passe posts load karanawa
    setupListeners(); // <-- DAN meka call karama aluth category buttons walatath listeners set wei
    displayTopAuthorsByLikes();
    checkUrlForPostId();
});
// ========== END DOMCONTENTLOADED ==========


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
    if (!heroSwiperWrapper) return; // Oyage aluth HTML eke meka nathi nisa, meka run wenne naha. Eka aulak ne.

    const backgroundImages = [
        'https://images.unsplash.com/photo-1755429562521-cb944ea054ab?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%D%D',
        'https://plus.unsplash.com/premium_photo-1755895180436-1acb3275ab96?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%D%D',
    ];

    heroSwiperWrapper.innerHTML = '';

    backgroundImages.forEach(imageUrl => {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'swiper-slide';
        slideDiv.innerHTML = `
            <img src="${imageUrl}" class="absolute inset-0 w-full h-full object-cover" alt="Hero Background">
            <div class="absolute inset-0 bg-black/40"></div>
        `;
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