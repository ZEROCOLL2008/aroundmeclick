document.addEventListener('DOMContentLoaded', () => {
    // This check is important. It ensures the config file has loaded.
    if (typeof firebase === 'undefined' || typeof auth === 'undefined' || typeof db === 'undefined') {
        console.error("Firebase not initialized. Make sure app.js is loaded before admin.js.");
        return;
    }

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
    const applicationsTableBody = document.getElementById('applications-table-body');
    const pendingAppsBadge = document.getElementById('pending-apps-badge');
    const appFilterButtons = document.querySelectorAll('.app-filter-btn'); // ** NEW **

    // --- AUTH GUARD ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.role === 'admin' || userData.role === 'pro') {
                    initializeApp(userData.role);
                } else {
                    console.warn("Access Denied. User is not an admin or pro user.");
                    window.location.href = 'index.html';
                }
            } else {
                console.warn("User document not found.");
                window.location.href = 'index.html';
            }
        } else {
            console.log("User not logged in. Redirecting.");
            window.location.href = 'index.html';
        }
    });

    // --- INITIALIZE APP ---
    const initializeApp = async (userRole) => {
        if (postsTableBody) {
            postsTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-gray-500">Loading all data...</td></tr>`;
        }
        
        const [postsSnapshot, usersSnapshot, pendingPostsSnapshot] = await Promise.all([
            db.collection('posts').orderBy('createdAt', 'desc').get(),
            db.collection('users').orderBy('createdAt', 'desc').get(),
            db.collection('posts').where('status', '==', 'pending').get()
        ]);
        
        allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const appLink = document.querySelector('.nav-link[data-view="applications"]');
        if (userRole === 'pro') {
            document.querySelector('.nav-link[data-view="dashboard"]').parentElement.style.display = 'none';
            document.querySelector('.nav-link[data-view="users"]').parentElement.style.display = 'none';
            document.querySelector('.nav-link[data-view="newsletter"]').parentElement.style.display = 'none';
            if (appLink) appLink.parentElement.style.display = 'none';

            contentViews.forEach(view => view.classList.add('hidden'));
            document.getElementById('posts-view').classList.remove('hidden');
            navLinks.forEach(nl => nl.classList.remove('active-nav'));
            document.querySelector('.nav-link[data-view="posts"]').classList.add('active-nav');
        } else if (userRole === 'admin') {
            loadDashboardStats(postsSnapshot, usersSnapshot, pendingPostsSnapshot);
            renderPostsOverTimeChart(postsSnapshot);
            renderPostsByCategoryChart(postsSnapshot);
            loadApplications('plusApplications'); // Load default application tab
        }
        
        loadPosts(postsSnapshot);
        renderUsersTable(allUsers);
        
        setupMobileMenu();
        setupNavigation();
        setupModal();
        setupActionListeners();
        setupUserFilters();
        setupApplicationFilters(); // ** NEW **
        setupNewsletterForm();
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

            const resolvePromise = (value) => {
                confirmationModal.classList.add('hidden');
                confirmationModal.classList.remove('flex');
                actionButton.removeEventListener('click', actionHandler);
                cancelButton.removeEventListener('click', cancelHandler);
                resolve(value);
            };

            const actionHandler = () => resolvePromise(true);
            const cancelHandler = () => resolvePromise(false);
            
            actionButton.addEventListener('click', actionHandler, { once: true });
            cancelButton.addEventListener('click', cancelHandler, { once: true });
        });
    };

    const openPostModal = (post) => {
        if (!postModal) return;
        document.getElementById('modal-title').textContent = post.title;
        document.getElementById('modal-author').textContent = post.authorName;
        document.getElementById('modal-category').textContent = post.category;
        document.getElementById('modal-date').textContent = post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString() : 'N/A';
        document.getElementById('modal-content').innerHTML = post.content;
        
        const modalMediaContainer = document.getElementById('modal-image-container');
        if (post.youtubeVideoId) {
            modalMediaContainer.innerHTML = `<div class="aspect-video w-full"><iframe class="w-full h-full" src="https://www.youtube.com/embed/${post.youtubeVideoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
            modalMediaContainer.classList.remove('hidden');
        } else if (post.imageUrl && post.imageUrl.trim() !== '') {
            modalMediaContainer.innerHTML = `<img id="modal-image" src="${post.imageUrl}" alt="Post Image" class="w-full h-auto max-h-80 object-contain rounded-lg">`;
            modalMediaContainer.classList.remove('hidden');
        } else {
            modalMediaContainer.innerHTML = '';
            modalMediaContainer.classList.add('hidden');
        }
        
        const modalApproveBtn = document.getElementById('modal-approve-btn');
        const modalRejectBtn = document.getElementById('modal-reject-btn');
        modalApproveBtn.dataset.id = post.id;
        modalRejectBtn.dataset.id = post.id;

        postModal.classList.remove('hidden');
        postModal.classList.add('flex');
    };

    // --- DATA RENDERING FUNCTIONS ---
    const renderUsersTable = (usersToRender) => {
        if (!usersTableBody) return;
        usersTableBody.innerHTML = '';
        if (usersToRender.length === 0) {
            usersTableBody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-gray-500">No users found.</td></tr>`;
            return;
        }
        usersToRender.forEach(user => {
            const joinDate = user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A';
            const roleColors = {
                admin: 'bg-blue-100 text-blue-800',
                pro: 'bg-purple-100 text-purple-800',
                plus: 'bg-sky-100 text-sky-800',
                normal: 'bg-gray-100 text-gray-800'
            };
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50';

            let actionControlHTML = '';
            const roles = ['normal', 'plus', 'pro', 'admin'];

            if (user.id === auth.currentUser.uid) {
                actionControlHTML = '<span>(You)</span>';
            } else {
                const options = roles.map(role => 
                    `<option value="${role}" ${user.role === role ? 'selected' : ''}>
                        ${role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>`
                ).join('');
                actionControlHTML = `<select class="role-select border border-gray-300 rounded-md p-1 text-sm focus:ring-blue-500 focus:border-blue-500" data-id="${user.id}">${options}</select>`;
            }

            tr.innerHTML = `
                <td class="px-6 py-4"><div class="text-sm font-medium text-gray-900">${user.displayName}</div><div class="text-sm text-gray-500">${user.email}</div></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${joinDate}</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role] || roleColors.normal}">${user.role}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">${actionControlHTML}</td>`;
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
        if (!postsTableBody) return;
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

    // ** UPDATED FUNCTION to handle different application types **
    const loadApplications = async (applicationType = 'plusApplications') => {
        if (!applicationsTableBody) return;
        applicationsTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-gray-500">Loading applications...</td></tr>`;
        
        try {
            const snapshot = await db.collection(applicationType).orderBy('submittedAt', 'desc').get();
            
            // Fetch total pending count for the badge
            const [plusPending, proPending] = await Promise.all([
                db.collection('plusApplications').where('status', '==', 'pending').get(),
                db.collection('proApplications').where('status', '==', 'pending').get()
            ]);
            const totalPendingCount = plusPending.size + proPending.size;
            if (pendingAppsBadge) pendingAppsBadge.textContent = totalPendingCount;

            applicationsTableBody.innerHTML = '';
            if (snapshot.empty) {
                const typeName = applicationType === 'plusApplications' ? 'Plus' : 'Pro';
                applicationsTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-gray-500">No ${typeName} applications found.</td></tr>`;
            } else {
                snapshot.forEach(doc => {
                    const app = { id: doc.id, ...doc.data() };
                    const appDate = app.submittedAt ? new Date(app.submittedAt.toDate()).toLocaleDateString() : 'N/A';
                    const statusColors = {
                        pending: 'bg-amber-100 text-amber-800',
                        approved: 'bg-green-100 text-green-800',
                        rejected: 'bg-red-100 text-red-800'
                    };

                    let actionButtons = 'No actions available';
                    if (app.status === 'pending') {
                        actionButtons = `
                            <button class="approve-app-btn px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200" data-app-id="${app.id}" data-user-id="${app.userId}" data-type="${applicationType}">Approve</button>
                            <button class="reject-app-btn px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200" data-app-id="${app.id}" data-type="${applicationType}">Reject</button>
                        `;
                    }

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="px-6 py-4">
                            <div class="text-sm font-medium text-gray-900">${app.displayName}</div>
                            <div class="text-sm text-gray-500">${app.email}</div>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600 max-w-sm truncate" title="${app.reason}">${app.reason}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${appDate}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[app.status]}">${app.status}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">${actionButtons}</td>
                    `;
                    applicationsTableBody.appendChild(tr);
                });
            }
        } catch (error) {
            console.error(`Error loading applications from ${applicationType}:`, error);
            applicationsTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-6 text-red-500">Error loading applications.</td></tr>`;
        }
    };

    // --- UI SETUP & EVENT LISTENERS ---
    
    // ** NEW FUNCTION to handle application tab clicks **
    const setupApplicationFilters = () => {
        appFilterButtons.forEach(button => {
            button.addEventListener('click', () => {
                appFilterButtons.forEach(btn => btn.classList.remove('is-active'));
                button.classList.add('is-active');
                const applicationType = button.dataset.type;
                loadApplications(applicationType);
            });
        });
    };

    const setupUserFilters = () => {
        if (!userSearchInput) return;
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
            const target = e.target;
            
            // Post Actions
            if (target.matches('.view-post, .approve-post-btn, .reject-post-btn, .delete-post-btn, #modal-approve-btn, #modal-reject-btn')) {
                const id = target.dataset.id;
                if (!id) return;
                
                if (target.matches('.view-post')) {
                    e.preventDefault();
                    const doc = await db.collection('posts').doc(id).get();
                    if (doc.exists) openPostModal({ id: doc.id, ...doc.data() });
                }
                if (target.matches('.approve-post-btn, #modal-approve-btn')) {
                    await db.collection('posts').doc(id).update({ status: 'approved' });
                    initializeApp( (await db.collection('users').doc(auth.currentUser.uid).get()).data().role );
                }
                if (target.matches('.reject-post-btn, #modal-reject-btn')) {
                    await db.collection('posts').doc(id).update({ status: 'rejected' });
                    initializeApp( (await db.collection('users').doc(auth.currentUser.uid).get()).data().role );
                }
                if (target.matches('.delete-post-btn')) {
                    if (await showConfirmationModal('Delete Post?', 'This action is permanent and cannot be undone.')) {
                        await db.collection('posts').doc(id).delete();
                        initializeApp( (await db.collection('users').doc(auth.currentUser.uid).get()).data().role );
                    }
                }
            }

            // ** UPDATED Application Actions to be dynamic **
            if (target.matches('.approve-app-btn') || target.matches('.reject-app-btn')) {
                const appId = target.dataset.appId;
                const userId = target.dataset.userId;
                const appType = target.dataset.type;

                if (!appId || !appType) return;
                
                const activeTab = document.querySelector('.app-filter-btn.is-active').dataset.type;

                if (target.matches('.approve-app-btn')) {
                    if (!userId) return;
                    const newRole = appType === 'proApplications' ? 'pro' : 'plus';
                    const confirmMessage = `This will change the user's role to "${newRole.charAt(0).toUpperCase() + newRole.slice(1)}".`;

                    if (await showConfirmationModal('Approve Application?', confirmMessage)) {
                        const userRef = db.collection('users').doc(userId);
                        const appRef = db.collection(appType).doc(appId);
                        try {
                            const batch = db.batch();
                            batch.update(userRef, { role: newRole });
                            batch.update(appRef, { status: 'approved' });
                            await batch.commit();
                            alert('User approved successfully!');
                            loadApplications(activeTab); // Refresh current tab
                            // Refresh all users data
                            const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
                            allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                            renderUsersTable(allUsers); // Re-render users table with updated role
                        } catch (error) {
                            console.error("Error approving user:", error);
                            alert('Could not approve the user.');
                        }
                    }
                }

                if (target.matches('.reject-app-btn')) {
                     if (await showConfirmationModal('Reject Application?', 'This will mark the application as rejected.')) {
                        try {
                            await db.collection(appType).doc(appId).update({ status: 'rejected' });
                            alert('Application rejected.');
                            loadApplications(activeTab); // Refresh current tab
                        } catch (error) {
                            console.error("Error rejecting application:", error);
                            alert('Could not reject the application.');
                        }
                    }
                }
            }
        });

        document.body.addEventListener('change', async (e) => {
            if (e.target.matches('.role-select')) {
                const userId = e.target.dataset.id;
                const newRole = e.target.value;
                if (userId && newRole) {
                    try {
                        await db.collection('users').doc(userId).update({ role: newRole });
                        const userIndex = allUsers.findIndex(u => u.id === userId);
                        if(userIndex > -1) allUsers[userIndex].role = newRole;
                        renderUsersTable(allUsers);
                    } catch (error) {
                        console.error("Error updating user role:", error);
                        alert("Failed to update user role.");
                    }
                }
            }
        });
    };
    
    // ===== NEWSLETTER LOGIC =====
    const setupNewsletterForm = () => {
        if (typeof tinymce !== 'undefined') {
            tinymce.init({
                selector: '#newsletter-content',
                plugins: 'autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
                toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | link image | removeformat | help',
                height: 300,
                menubar: false,
                placeholder: 'Write your greeting message here...',
            }).catch(err => console.error("TinyMCE Init Error:", err));
        }
        const newsletterForm = document.getElementById('newsletter-form');
        if (!newsletterForm) return;
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const subjectInput = document.getElementById('newsletter-subject');
            const content = tinymce.get('newsletter-content').getContent();
            const statusEl = document.getElementById('newsletter-status');
            const sendBtn = document.getElementById('send-newsletter-btn');
            if (!subjectInput.value.trim() || !content.trim()) {
                alert('Please fill in both the subject and the message.');
                return;
            }
            sendBtn.disabled = true;
            sendBtn.textContent = 'Scheduling...';
            statusEl.textContent = '';
            statusEl.className = 'text-sm text-gray-600 font-medium';
            try {
                await db.collection('emailCampaigns').add({
                    subject: subjectInput.value,
                    htmlContent: content,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                statusEl.textContent = '✅ Campaign scheduled!';
                statusEl.className = 'text-sm text-green-600 font-medium';
                newsletterForm.reset();
                tinymce.get('newsletter-content').setContent('');
            } catch (error) {
                console.error("Error scheduling campaign:", error);
                statusEl.textContent = '❌ Error! Could not schedule.';
                statusEl.className = 'text-sm text-red-600 font-medium';
            } finally {
                setTimeout(() => {
                    sendBtn.disabled = false;
                    sendBtn.textContent = 'Send to All Subscribers';
                    statusEl.textContent = '';
                }, 5000);
            }
        });
    };
    
    // --- OTHER FUNCTIONS ---
    const generateActionButtonsHTML = (post) => {
        let buttonsHTML = '';
        const status = post.status;
        if (status === 'pending') {
            buttonsHTML += `<button class="approve-post-btn px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200" data-id="${post.id}">Approve</button>`;
            buttonsHTML += `<button class="reject-post-btn px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200" data-id="${post.id}">Reject</button>`;
        } 
        else if (status === 'approved') {
            buttonsHTML += `<button class="reject-post-btn px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200" data-id="${post.id}">Unpublish</button>`;
        } 
        else if (status === 'rejected') {
            buttonsHTML += `<button class="approve-post-btn px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200" data-id="${post.id}">Approve</button>`;
        }
        buttonsHTML += `<button class="delete-post-btn px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200" data-id="${post.id}">Delete</button>`;
        return `<div class="flex items-center space-x-2 justify-end">${buttonsHTML}</div>`;
    };

    const renderPostsOverTimeChart = (snapshot) => {
        const ctx = document.getElementById('postsOverTimeChart');
        if (!ctx) return;
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
        if (postsOverTimeChartInstance) postsOverTimeChartInstance.destroy();
        postsOverTimeChartInstance = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: { labels, datasets: [{ label: 'New Posts', data, backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 1)', borderWidth: 2, tension: 0.4, fill: true }] },
            options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    };

    const renderPostsByCategoryChart = (snapshot) => {
        const ctx = document.getElementById('postsByCategoryChart');
        if (!ctx) return;
        const categoryCounts = {};
        snapshot.forEach(doc => {
            const category = doc.data().category || 'Uncategorized';
            const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
            categoryCounts[capitalizedCategory] = (categoryCounts[capitalizedCategory] || 0) + 1;
        });
        const labels = Object.keys(categoryCounts);
        const data = Object.values(categoryCounts);
        if (postsByCategoryChartInstance) postsByCategoryChartInstance.destroy();
        postsByCategoryChartInstance = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: { labels, datasets: [{ label: 'Posts', data, backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1', '#EC4899'], hoverOffset: 4 }] }
        });
    };

    const setupMobileMenu = () => {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('-translate-x-full'));
            document.querySelectorAll('#sidebar .nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth < 768) sidebar.classList.add('-translate-x-full');
                });
            });
        }
    };

    const setupNavigation = () => {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetViewId = link.dataset.view;
                const targetView = document.getElementById(`${targetViewId}-view`);
                if (!targetView) return;
                navLinks.forEach(nl => nl.classList.remove('active-nav'));
                link.classList.add('active-nav');
                contentViews.forEach(view => view.classList.add('hidden'));
                targetView.classList.remove('hidden');
            });
        });
    };

    const setupModal = () => {
        const closeButtons = document.querySelectorAll('#close-modal-btn, #modal-close-btn');
        if (!postModal) return;
        closeButtons.forEach(btn => btn.addEventListener('click', () => {
            postModal.classList.remove('flex');
            postModal.classList.add('hidden');
        }));
        postModal.addEventListener('click', (e) => {
            if (e.target === postModal) {
                postModal.classList.remove('flex');
                postModal.classList.add('hidden');
            }
        });
    };
});