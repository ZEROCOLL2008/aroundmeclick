document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') {
        console.error("Firebase not initialized. Make sure app.js is loaded first.");
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    let postsOverTimeChartInstance = null;
    let postsByCategoryChartInstance = null;
    let allUsers = []; // Store all users to filter locally

    // --- DOM Elements ---
    const navLinks = document.querySelectorAll('.nav-link');
    const contentViews = document.querySelectorAll('.content-view');
    const postsTableBody = document.getElementById('posts-table-body');
    const usersTableBody = document.getElementById('users-table-body');
    const postModal = document.getElementById('post-modal');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmModalTitle = document.getElementById('confirm-modal-title');
    const confirmModalMessage = document.getElementById('confirm-modal-message');
    const userSearchInput = document.getElementById('user-search-input');
    const userFilterButtons = document.querySelectorAll('.user-filter-btn');

    // --- AUTH GUARD ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().role === 'admin') {
                initializeApp();
            } else {
                console.warn("Access Denied. User is not an admin.");
                window.location.href = 'index.html';
            }
        } else {
            console.log("User not logged in. Redirecting.");
            window.location.href = 'index.html';
        }
    });

    const initializeApp = async () => {
        postsTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-gray-500">Loading all data...</td></tr>`;
        
        const [postsSnapshot, usersSnapshot, pendingCountSnapshot] = await Promise.all([
            db.collection('posts').orderBy('createdAt', 'desc').get(),
            db.collection('users').get(),
            db.collection('posts').where('status', '==', 'pending').get()
        ]);
        
        allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        loadDashboardStats(postsSnapshot, usersSnapshot, pendingCountSnapshot);
        loadPosts(postsSnapshot);
        renderUsersTable(allUsers);
        renderPostsOverTimeChart(postsSnapshot);
        renderPostsByCategoryChart(postsSnapshot);
        
        setupMobileMenu();
        setupNavigation();
        setupModal();
        setupActionListeners();
        setupUserFilters();
    };

    // --- HELPER FUNCTIONS (Modals) ---
    const showConfirmationModal = (title, message) => {
        return new Promise((resolve) => {
            if (!confirmationModal) return resolve(false);
            confirmModalTitle.textContent = title;
            confirmModalMessage.textContent = message;
            confirmationModal.classList.remove('hidden');
            confirmationModal.classList.add('flex');

            const actionButton = document.getElementById('confirm-action-btn');
            const cancelButton = document.getElementById('confirm-cancel-btn');

            const actionListener = () => {
                confirmationModal.classList.add('hidden');
                confirmationModal.classList.remove('flex');
                resolve(true);
            };
            const cancelListener = () => {
                confirmationModal.classList.add('hidden');
                confirmationModal.classList.remove('flex');
                resolve(false);
            };

            actionButton.addEventListener('click', actionListener, { once: true });
            cancelButton.addEventListener('click', cancelListener, { once: true });
        });
    };

    const openPostModal = (post) => {
        if (!postModal) return;
        document.getElementById('modal-title').textContent = post.title;
        document.getElementById('modal-author').textContent = post.authorName;
        document.getElementById('modal-category').textContent = post.category;
        document.getElementById('modal-date').textContent = post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString() : 'N/A';
        document.getElementById('modal-content').innerHTML = post.content;
        
        // === UPDATED LOGIC TO HANDLE VIDEO/IMAGE IN MODAL ===
        const modalMediaContainer = document.getElementById('modal-image-container');
        
        if (post.youtubeVideoId) {
            modalMediaContainer.innerHTML = `<div class="aspect-video w-full"><iframe class="w-full h-full" src="https://www.youtube.com/embed/${post.youtubeVideoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
            modalMediaContainer.classList.remove('hidden');
        } else if (post.imageUrl && post.imageUrl.trim() !== '') {
            modalMediaContainer.innerHTML = `<img id="modal-image" src="${post.imageUrl}" alt="Post Image" class="w-full h-auto max-h-80 object-contain rounded-lg">`;
            modalMediaContainer.classList.remove('hidden');
        } else {
            modalMediaContainer.innerHTML = '<img id="modal-image" src="" alt="Post Image" class="w-full h-auto max-h-80 object-contain rounded-lg">'; // Reset to original state
            modalMediaContainer.classList.add('hidden');
        }
        
        const modalApproveBtn = document.getElementById('modal-approve-btn');
        const modalRejectBtn = document.getElementById('modal-reject-btn');
        modalApproveBtn.dataset.id = post.id;
        modalRejectBtn.dataset.id = post.id;

        postModal.classList.add('flex');
    };

    // --- DATA RENDERING FUNCTIONS ---
    const renderUsersTable = (usersToRender) => {
        usersTableBody.innerHTML = '';
        if (usersToRender.length === 0) {
            usersTableBody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-gray-500">No users found.</td></tr>`;
            return;
        }
        usersToRender.forEach(user => {
            const joinDate = user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A';
            const roleColors = { admin: 'bg-blue-100 text-blue-800', user: 'bg-gray-100 text-gray-800' };
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50';

            let actionButtonHTML = '';
            if (user.id === auth.currentUser.uid) {
                actionButtonHTML = '<span>(You)</span>';
            } else if (user.role === 'admin') {
                actionButtonHTML = `<button class="remove-admin-btn text-amber-600 hover:text-amber-800" data-id="${user.id}">Remove Admin</button>`;
            } else {
                actionButtonHTML = `<button class="make-admin-btn text-blue-600 hover:text-blue-800" data-id="${user.id}">Make Admin</button>`;
            }

            tr.innerHTML = `
                <td class="px-6 py-4"><div class="text-sm font-medium text-gray-900">${user.displayName}</div><div class="text-sm text-gray-500">${user.email}</div></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${joinDate}</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role] || roleColors.user}">${user.role}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">${actionButtonHTML}</td>`;
            usersTableBody.appendChild(tr);
        });
    };
    
    const loadDashboardStats = (postsSnapshot, usersSnapshot, pendingCountSnapshot) => {
        let publishedCount = 0;
        postsSnapshot.forEach(doc => {
            if (doc.data().status === 'approved') publishedCount++;
        });
        const pendingCount = pendingCountSnapshot.size;
        document.getElementById('pending-posts-stat').textContent = pendingCount;
        document.getElementById('pending-count-badge').textContent = pendingCount;
        document.getElementById('published-posts-stat').textContent = publishedCount;
        document.getElementById('total-users-stat').textContent = usersSnapshot.size;
    };

    const loadPosts = (snapshot) => {
        postsTableBody.innerHTML = '';
        if (snapshot.empty) {
            postsTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-gray-500">No posts found.</td></tr>`;
            return;
        }
        snapshot.forEach(doc => {
            const post = { id: doc.id, ...doc.data() };
            const postDate = post.createdAt ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'N/A';
            const statusColors = {
                pending: 'bg-amber-100 text-amber-800',
                approved: 'bg-green-100 text-green-800',
                rejected: 'bg-red-100 text-red-800'
            };
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50';
            tr.innerHTML = `
                <td class="px-6 py-4"><a href="#" class="text-sm font-medium text-blue-600 hover:text-blue-800 view-post" data-id="${post.id}">${post.title}</a><p class="text-sm text-gray-500">by ${post.authorName}</p></td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="text-sm text-gray-900">${post.category}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${postDate}</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[post.status] || 'bg-gray-100 text-gray-800'}">${post.status}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">${generateActionButtonsHTML(post)}</td>`;
            postsTableBody.appendChild(tr);
        });
    };

    // --- UI SETUP & EVENT LISTENERS ---

    const setupUserFilters = () => {
        const applyFilters = () => {
            const searchTerm = userSearchInput.value.toLowerCase();
            const activeFilter = document.querySelector('.user-filter-btn.active').dataset.role;

            let filteredUsers = allUsers;

            if (activeFilter !== 'all') {
                filteredUsers = filteredUsers.filter(user => user.role === activeFilter);
            }

            if (searchTerm) {
                filteredUsers = filteredUsers.filter(user => 
                    (user.displayName && user.displayName.toLowerCase().includes(searchTerm)) || 
                    (user.email && user.email.toLowerCase().includes(searchTerm))
                );
            }
            renderUsersTable(filteredUsers);
        };

        userSearchInput.addEventListener('input', applyFilters);
        userFilterButtons.forEach(button => {
            button.addEventListener('click', () => {
                userFilterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                applyFilters();
            });
        });
    };

    const setupActionListeners = () => {
        document.body.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;

            // Post Actions
            if (e.target.matches('.view-post')) {
                e.preventDefault();
                if(id){
                    const doc = await db.collection('posts').doc(id).get();
                    if (doc.exists) openPostModal({ id: doc.id, ...doc.data() });
                }
            }
            if (e.target.matches('.approve-post-btn, #modal-approve-btn')) {
                if(id) {
                    await db.collection('posts').doc(id).update({ status: 'approved' });
                    await initializeApp();
                    if(postModal) postModal.classList.remove('flex');
                }
            }
            if (e.target.matches('.reject-post-btn, #modal-reject-btn')) {
                 if(id) {
                    await db.collection('posts').doc(id).update({ status: 'rejected' });
                    await initializeApp();
                    if(postModal) postModal.classList.remove('flex');
                }
            }
            if (e.target.matches('.delete-post-btn')) {
                 if(id) {
                    const isConfirmed = await showConfirmationModal('Delete Post', 'This action is permanent and cannot be undone.');
                    if (isConfirmed) {
                        await db.collection('posts').doc(id).delete();
                        await initializeApp();
                    }
                }
            }

            // User Role Update Logic
            const updateUserRole = async (userId, newRole) => {
                await db.collection('users').doc(userId).update({ role: newRole });
                const userIndex = allUsers.findIndex(u => u.id === userId);
                if (userIndex > -1) allUsers[userIndex].role = newRole;
                
                const currentSearchTerm = userSearchInput.value.toLowerCase();
                const currentActiveFilter = document.querySelector('.user-filter-btn.active').dataset.role;
                
                let usersToDisplay = allUsers;
                if (currentActiveFilter !== 'all') {
                    usersToDisplay = usersToDisplay.filter(user => user.role === currentActiveFilter);
                }
                if (currentSearchTerm) {
                    usersToDisplay = usersToDisplay.filter(user =>
                        (user.displayName && user.displayName.toLowerCase().includes(currentSearchTerm)) ||
                        (user.email && user.email.toLowerCase().includes(currentSearchTerm))
                    );
                }
                renderUsersTable(usersToDisplay);
            };

            if (e.target.matches('.make-admin-btn')) {
                if(id) await updateUserRole(id, 'admin');
            }
            if (e.target.matches('.remove-admin-btn')) {
                if(id) await updateUserRole(id, 'user');
            }
        });
    };

    // --- OTHER FUNCTIONS ---
    
    const generateActionButtonsHTML = (post) => {
        let buttonsHTML = '';
        const status = post.status;
        if (status === 'pending') {
            buttonsHTML += `<button class="approve-post-btn px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200">Approve</button>`;
            buttonsHTML += `<button class="reject-post-btn px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200">Reject</button>`;
        } 
        else if (status === 'approved') {
            buttonsHTML += `<button class="reject-post-btn px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200">Unpublish</button>`;
        } 
        else if (status === 'rejected') {
            buttonsHTML += `<button class="approve-post-btn px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200">Approve</button>`;
        }
        buttonsHTML += `<button class="delete-post-btn px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200">Delete</button>`;
        const buttonsWithId = buttonsHTML.replace(/<button/g, `<button data-id="${post.id}"`);
        return `<div class="flex items-center space-x-2">${buttonsWithId}</div>`;
    };

    const renderPostsOverTimeChart = (snapshot) => {
        const postCountsByDate = {};
        snapshot.forEach(doc => {
            const post = doc.data();
            if (post.createdAt) {
                const date = post.createdAt.toDate().toISOString().split('T')[0];
                postCountsByDate[date] = (postCountsByDate[date] || 0) + 1;
            }
        });
        const labels = [];
        const data = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateString = d.toISOString().split('T')[0];
            labels.push(dateString.slice(5));
            data.push(postCountsByDate[dateString] || 0);
        }
        const ctx = document.getElementById('postsOverTimeChart').getContext('2d');
        if (postsOverTimeChartInstance) postsOverTimeChartInstance.destroy();
        postsOverTimeChartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: 'New Posts', data, backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 1)', borderWidth: 2, tension: 0.4, fill: true }] },
            options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    };

    const renderPostsByCategoryChart = (snapshot) => {
        const categoryCounts = {};
        snapshot.forEach(doc => {
            const category = doc.data().category || 'Uncategorized';
            const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
            categoryCounts[capitalizedCategory] = (categoryCounts[capitalizedCategory] || 0) + 1;
        });
        const labels = Object.keys(categoryCounts);
        const data = Object.values(categoryCounts);
        const ctx = document.getElementById('postsByCategoryChart').getContext('2d');
        if (postsByCategoryChartInstance) postsByCategoryChartInstance.destroy();
        postsByCategoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ label: 'Posts', data, backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1', '#EC4899'], hoverOffset: 4 }] }
        });
    };

    const setupMobileMenu = () => {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');

        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('-translate-x-full');
            });
            
            document.querySelectorAll('#sidebar .nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth < 768) {
                        sidebar.classList.add('-translate-x-full');
                    }
                });
            });
        }
    };

    const setupNavigation = () => {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetView = link.dataset.view;
                if (!targetView) return;
                navLinks.forEach(nl => nl.classList.remove('active-nav'));
                link.classList.add('active-nav');
                contentViews.forEach(view => view.classList.add('hidden'));
                document.getElementById(`${targetView}-view`).classList.remove('hidden');
            });
        });
    };

    const setupModal = () => {
        const closeButtons = document.querySelectorAll('#close-modal-btn, #modal-close-btn');
        closeButtons.forEach(btn => btn.addEventListener('click', () => postModal.classList.remove('flex')));
        postModal.addEventListener('click', (e) => {
            if (e.target === postModal) postModal.classList.remove('flex');
        });
    };
});
