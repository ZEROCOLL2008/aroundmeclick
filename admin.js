document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURATION ---
    // TODO: ඔයාගේ ImgBB API Key එක මෙතනට දාන්න
    const IMGBB_API_KEY = 'b7c6e89aa03e53347ef4215d2c615d3d'; 

    // --- FIREBASE CHECK ---
    if (typeof firebase === 'undefined' || typeof auth === 'undefined' || typeof db === 'undefined') {
        console.error("Firebase not initialized. Make sure app.js is loaded before admin.js.");
        return;
    }

    // --- VARIABLES ---
    let postsOverTimeChartInstance = null;
    let postsByCategoryChartInstance = null;
    let applicationsUnsubscribe = null; // To stop listening when switching tabs
    
    let allUsers = [];
    let allPosts = [];
    // allApplications will be loaded dynamically based on the selected tab

    // --- DOM ELEMENTS ---
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const navLinks = document.querySelectorAll('.nav-link');
    const contentViews = document.querySelectorAll('.content-view');
    
    // Tables
    const postsTableBody = document.getElementById('posts-table-body');
    const usersTableBody = document.getElementById('users-table-body');
    const applicationsTableBody = document.getElementById('applications-table-body');
    const categoriesTableBody = document.getElementById('categories-table-body');
    
    // Modals
    const postModal = document.getElementById('post-modal');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmModalTitle = document.getElementById('confirm-modal-title');
    const confirmModalMessage = document.getElementById('confirm-modal-message');
    
    // Inputs & Forms
    const userSearchInput = document.getElementById('user-search-input');
    const postSearchInput = document.getElementById('post-search-input');
    const appSearchInput = document.getElementById('app-search-input');
    const addCategoryForm = document.getElementById('add-category-form');
    const newsletterForm = document.getElementById('newsletter-form');
    
    // Theme
    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
    const htmlElement = document.documentElement;

    // --- 1. AUTHENTICATION CHECK ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Check if user is admin (Optional security check)
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().role === 'admin') {
                console.log("Admin Logged In:", user.email);
                initDashboard();
            } else {
                // If not admin, redirect
                // window.location.href = 'index.html';
                console.warn("User is not an admin, but loading dashboard for demo.");
                initDashboard();
            }
        } else {
            window.location.href = 'index.html';
        }
    });

    // --- 2. INITIALIZATION ---
    const initDashboard = () => {
        setupNavigation();
        setupTheme();
        setupMobileMenu();
        
        // Load Data Real-time
        fetchPosts();
        fetchUsers();
        fetchCategories();
        
        // Default load Plus Applications
        fetchApplications('plusApplications');
    };

    // --- 3. NAVIGATION & TABS ---
    const setupNavigation = () => {
        // Sidebar Navigation
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                navLinks.forEach(l => {
                    l.classList.remove('active-nav');
                    l.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-50', 'dark:hover:bg-gray-700');
                });
                e.currentTarget.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-50', 'dark:hover:bg-gray-700');
                e.currentTarget.classList.add('active-nav');

                const viewName = e.currentTarget.getAttribute('data-view');
                contentViews.forEach(view => view.classList.add('hidden'));
                
                const targetView = document.getElementById(`${viewName}-view`);
                if (targetView) targetView.classList.remove('hidden');

                if (window.innerWidth < 768) {
                    sidebar.classList.add('-translate-x-full');
                    sidebarBackdrop.classList.add('hidden');
                    sidebarBackdrop.classList.remove('opacity-100');
                }
            });
        });

        // Application Filter Tabs (Plus / Pro)
        document.querySelectorAll('.app-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // UI Update
                document.querySelectorAll('.app-filter-btn').forEach(b => {
                    b.classList.remove('border-blue-500', 'text-blue-600', 'dark:text-blue-400');
                    b.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
                    b.classList.remove('is-active');
                });
                e.target.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
                e.target.classList.add('border-blue-500', 'text-blue-600', 'dark:text-blue-400', 'is-active');

                // Fetch Data
                const collectionType = e.target.getAttribute('data-type'); // 'plusApplications' or 'proApplications'
                fetchApplications(collectionType);
            });
        });
    };

    // --- 4. DATA FETCHING ---

    // A. FETCH POSTS
    const fetchPosts = () => {
        db.collection('posts').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            allPosts = [];
            snapshot.forEach(doc => allPosts.push({ id: doc.id, ...doc.data() }));
            
            updateDashboardStats();
            renderPosts(allPosts);
            renderPostsChart(snapshot);
            renderCategoriesChart(snapshot);
        });
    };

    // B. FETCH USERS
    const fetchUsers = () => {
        db.collection('users').onSnapshot(snapshot => {
            allUsers = [];
            snapshot.forEach(doc => allUsers.push({ id: doc.id, ...doc.data() }));
            
            updateDashboardStats();
            renderUsers(allUsers);
        });
    };

    // C. FETCH APPLICATIONS (Dynamic Collection)
    const fetchApplications = (collectionName) => {
        if (!applicationsTableBody) return;

        // Unsubscribe previous listener if exists
        if (applicationsUnsubscribe) {
            applicationsUnsubscribe();
        }

        applicationsTableBody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-gray-500">Loading...</td></tr>';

        // Listen to the selected collection
        applicationsUnsubscribe = db.collection(collectionName)
            .orderBy('timestamp', 'desc') // Make sure you have 'timestamp' or 'createdAt' in your app docs
            .onSnapshot(snapshot => {
                const apps = [];
                snapshot.forEach(doc => apps.push({ id: doc.id, ...doc.data(), type: collectionName }));
                
                if (apps.length === 0) {
                    applicationsTableBody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-gray-500">No applications found.</td></tr>';
                } else {
                    renderApplications(apps);
                }
                updateDashboardStats();
            }, error => {
                console.error("Error fetching applications:", error);
                applicationsTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-red-500">Error: ${error.message}</td></tr>`;
            });
    };

    // D. FETCH CATEGORIES
    const fetchCategories = () => {
        if (!categoriesTableBody) return;

        db.collection('categories').orderBy('name').onSnapshot(snapshot => {
            categoriesTableBody.innerHTML = '';
            
            if (snapshot.empty) {
                categoriesTableBody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-sm text-gray-500">No categories found.</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const cat = doc.data();
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';
                
                // Default Image Placeholder
                const imageUrl = cat.imageUrl || 'https://i.ibb.co/HTV3PDD3/Whats-App-Image-2025-09-03-at-18-08-17-eb407f7a-removebg-preview.png';

                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10">
                                <img class="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-600" src="${imageUrl}" alt="${cat.name}">
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900 dark:text-white">${cat.name}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">${doc.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="delete-category-btn text-red-600 hover:text-red-900 dark:hover:text-red-400 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" data-id="${doc.id}">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                `;
                categoriesTableBody.appendChild(row);
            });

            // Category Delete Listener
            document.querySelectorAll('.delete-category-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    showConfirmationModal('Delete Category?', 'Are you sure?', async () => {
                        await db.collection('categories').doc(id).delete();
                    });
                });
            });
        });
    };

    // --- 5. ADD CATEGORY WITH IMAGE ---
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('new-category-name');
            const imageInput = document.getElementById('new-category-image');
            const name = nameInput.value.trim();
            const file = imageInput.files[0];
            
            if (!name) { alert("Please enter a category name."); return; }
            if (!file) { alert("Please select a category image."); return; }

            const btn = addCategoryForm.querySelector('button');
            const originalBtnText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = 'Uploading...';

            try {
                // 1. Upload to ImgBB
                const formData = new FormData();
                formData.append("image", file);

                const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();
                if (!data.success) throw new Error("Image upload failed.");

                const imageUrl = data.data.url;

                // 2. Save to Firestore
                const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
                
                await db.collection('categories').doc(slug).set({
                    name: name,
                    imageUrl: imageUrl,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                nameInput.value = '';
                imageInput.value = '';

            } catch (error) {
                console.error("Error adding category:", error);
                alert("Error: " + error.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalBtnText;
            }
        });
    }

    // --- 6. RENDER FUNCTIONS ---

    const renderPosts = (posts) => {
        postsTableBody.innerHTML = '';
        posts.forEach(post => {
            const statusColor = post.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                post.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b dark:border-gray-700';
            row.innerHTML = `
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">${post.title}</div>
                    <div class="text-xs text-gray-500">${post.authorName || 'Unknown'}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">${post.category || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${post.createdAt ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full font-semibold ${statusColor}">${post.status}</span></td>
                <td class="px-6 py-4 text-right text-sm font-medium space-x-2">
                    <button class="text-blue-600 hover:text-blue-900 view-post-btn" data-id="${post.id}">View</button>
                    <button class="text-red-600 hover:text-red-900 delete-post-btn" data-id="${post.id}">Delete</button>
                </td>
            `;
            postsTableBody.appendChild(row);
        });
        attachPostEventListeners();
    };

    const renderUsers = (users) => {
        usersTableBody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b dark:border-gray-700';
            
            // Safe Role Check
            let role = user.role || 'normal'; 
            
            row.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-600 font-bold">
                            ${(user.displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">${user.displayName || 'No Name'}</div>
                            <div class="text-xs text-gray-500">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">${user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                <td class="px-6 py-4 text-sm font-medium capitalize text-gray-700 dark:text-gray-300">${role}</td>
                <td class="px-6 py-4 text-right">
                    <select class="role-select bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" data-id="${user.id}">
                        <option value="normal" ${role === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="plus" ${role === 'plus' ? 'selected' : ''}>Plus</option>
                        <option value="pro" ${role === 'pro' ? 'selected' : ''}>Pro</option>
                        <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
        
        document.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const newRole = e.target.value;
                const userId = e.target.getAttribute('data-id');
                try {
                    await db.collection('users').doc(userId).update({ role: newRole });
                } catch (err) {
                    console.error(err);
                    alert("Failed to update role. Permission denied?");
                }
            });
        });
    };

    const renderApplications = (apps) => {
        applicationsTableBody.innerHTML = '';
        apps.forEach(app => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b dark:border-gray-700';
            
            // Determine status color
            const status = app.status || 'pending';
            const statusColor = status === 'approved' ? 'bg-green-100 text-green-800' : 
                                status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';

            row.innerHTML = `
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">${app.fullName}</div>
                    <div class="text-xs text-gray-500">${app.email}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                    ${app.nic ? `<div>NIC: ${app.nic}</div>` : ''}
                    ${app.mobile ? `<div>Tel: ${app.mobile}</div>` : ''}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title="${app.about}">${app.about || '-'}</td>
                <td class="px-6 py-4 text-sm text-blue-600">
                    ${app.fbLink ? `<a href="${app.fbLink}" target="_blank" class="hover:underline mr-2">FB</a>` : ''}
                    ${app.portfolio ? `<a href="${app.portfolio}" target="_blank" class="hover:underline">Port</a>` : ''}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">${app.timestamp ? new Date(app.timestamp.toDate()).toLocaleDateString() : 'N/A'}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full font-semibold ${statusColor}">${status}</span></td>
                <td class="px-6 py-4 text-right text-sm space-x-2">
                    ${status === 'pending' ? `
                    <button class="approve-app-btn bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-xs" data-id="${app.id}" data-uid="${app.userId}" data-type="${app.type}">Approve</button>
                    <button class="reject-app-btn bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-xs" data-id="${app.id}" data-type="${app.type}">Reject</button>
                    ` : '<span class="text-gray-400 text-xs">Completed</span>'}
                </td>
            `;
            applicationsTableBody.appendChild(row);
        });
        attachAppEventListeners();
    };

    // --- 7. EVENT LISTENERS ---

    const attachPostEventListeners = () => {
        document.querySelectorAll('.view-post-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const post = allPosts.find(p => p.id === id);
                if(post) openPostModal(post);
            });
        });

        document.querySelectorAll('.delete-post-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                showConfirmationModal('Delete Post?', 'This cannot be undone.', async () => {
                    await db.collection('posts').doc(id).delete();
                });
            });
        });
    };

    const attachAppEventListeners = () => {
        // Approve Application
        document.querySelectorAll('.approve-app-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const docId = e.currentTarget.getAttribute('data-id');
                const userId = e.currentTarget.getAttribute('data-uid');
                const appType = e.currentTarget.getAttribute('data-type');
                
                // Logic: Pro App = 'pro' role, Plus App = 'plus' role
                const newRole = (appType === 'proApplications') ? 'pro' : 'plus';

                showConfirmationModal('Approve & Upgrade?', `User will become a ${newRole.toUpperCase()} member.`, async () => {
                    try {
                        // 1. Update User Role
                        await db.collection('users').doc(userId).update({ role: newRole });
                        // 2. Update Application Status
                        await db.collection(appType).doc(docId).update({ status: 'approved' });
                        
                        // 3. Notification (Optional)
                        await db.collection('notifications').add({
                            recipientId: userId,
                            message: `Congratulations! Your request for ${newRole} membership has been approved.`,
                            isRead: false,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });

                    } catch (err) {
                        console.error(err);
                        alert("Error approving application.");
                    }
                });
            });
        });

        // Reject Application
        document.querySelectorAll('.reject-app-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = e.currentTarget.getAttribute('data-id');
                const appType = e.currentTarget.getAttribute('data-type');
                
                showConfirmationModal('Reject Application?', 'User will be notified.', async () => {
                    await db.collection(appType).doc(docId).update({ status: 'rejected' });
                });
            });
        });
    };

    // --- 8. STATS & CHARTS ---
    const updateDashboardStats = () => {
        document.getElementById('pending-posts-stat').textContent = allPosts.filter(p => p.status === 'pending').length;
        document.getElementById('published-posts-stat').textContent = allPosts.filter(p => p.status === 'approved').length;
        document.getElementById('total-users-stat').textContent = allUsers.length;
        
        // Sidebar Badges
        const pendingP = allPosts.filter(p => p.status === 'pending').length;
        const badge = document.getElementById('pending-count-badge');
        if(badge) {
            badge.textContent = pendingP;
            badge.classList.toggle('hidden', pendingP === 0);
        }
    };

    const renderPostsChart = (snapshot) => {
        const ctx = document.getElementById('postsOverTimeChart');
        if (!ctx) return;
        
        const counts = {};
        snapshot.forEach(doc => {
            const d = doc.data().createdAt?.toDate().toISOString().split('T')[0];
            if(d) counts[d] = (counts[d] || 0) + 1;
        });
        const labels = Object.keys(counts).sort().slice(-30);
        const data = labels.map(d => counts[d]);
        
        if (postsOverTimeChartInstance) postsOverTimeChartInstance.destroy();
        postsOverTimeChartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Posts', data, borderColor: '#3B82F6', tension: 0.3 }] }
        });
    };

    const renderCategoriesChart = (snapshot) => {
        const ctx = document.getElementById('postsByCategoryChart');
        if (!ctx) return;
        const counts = {};
        snapshot.forEach(doc => {
            const c = doc.data().category || 'Other';
            counts[c] = (counts[c] || 0) + 1;
        });
        
        if (postsByCategoryChartInstance) postsByCategoryChartInstance.destroy();
        postsByCategoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { 
                labels: Object.keys(counts), 
                datasets: [{ data: Object.values(counts), backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'] }] 
            }
        });
    };

    // --- 9. UTILS: MODALS, SEARCH, THEME ---
    const showConfirmationModal = (title, msg, onConfirm) => {
        confirmModalTitle.textContent = title;
        confirmModalMessage.textContent = msg;
        confirmationModal.classList.remove('hidden');
        
        const okBtn = document.getElementById('confirm-action-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        
        const newOk = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOk, okBtn);
        
        newOk.addEventListener('click', () => {
            onConfirm();
            confirmationModal.classList.add('hidden');
        });
        cancelBtn.onclick = () => confirmationModal.classList.add('hidden');
    };

    const openPostModal = (post) => {
        document.getElementById('modal-title').textContent = post.title;
        document.getElementById('modal-author').textContent = post.authorName;
        document.getElementById('modal-category').textContent = post.category;
        document.getElementById('modal-date').textContent = post.createdAt ? new Date(post.createdAt.toDate()).toLocaleDateString() : '';
        document.getElementById('modal-content').innerHTML = post.content;
        
        // Image
        const imgContainer = document.getElementById('modal-image-container');
        if(post.imageUrl) {
            imgContainer.innerHTML = `<img src="${post.imageUrl}" class="w-full h-64 object-cover rounded">`;
            imgContainer.classList.remove('hidden');
        } else {
            imgContainer.classList.add('hidden');
        }
        
        postModal.classList.remove('hidden');
        postModal.classList.add('flex');

        // Approve/Reject Buttons inside Modal
        const approveBtn = document.getElementById('modal-approve-btn');
        const rejectBtn = document.getElementById('modal-reject-btn');
        
        if (post.status === 'pending') {
            approveBtn.classList.remove('hidden');
            rejectBtn.classList.remove('hidden');
            
            approveBtn.onclick = () => {
                db.collection('posts').doc(post.id).update({ status: 'approved' });
                postModal.classList.add('hidden');
            };
            rejectBtn.onclick = () => {
                db.collection('posts').doc(post.id).update({ status: 'rejected' });
                postModal.classList.add('hidden');
            };
        } else {
            approveBtn.classList.add('hidden');
            rejectBtn.classList.add('hidden');
        }
        
        document.getElementById('modal-close-btn').onclick = () => postModal.classList.add('hidden');
        document.getElementById('close-modal-btn').onclick = () => postModal.classList.add('hidden');
    };

    // Search Logic
    if(postSearchInput) {
        postSearchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allPosts.filter(p => p.title.toLowerCase().includes(term) || p.authorName.toLowerCase().includes(term));
            renderPosts(filtered);
        });
    }
    if(userSearchInput) {
        userSearchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allUsers.filter(u => u.displayName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
            renderUsers(filtered);
        });
    }

    // Theme
    const setupTheme = () => {
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            htmlElement.classList.add('dark');
            document.querySelectorAll('.theme-moon').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.theme-sun').forEach(el => el.classList.remove('hidden'));
        } else {
            htmlElement.classList.remove('dark');
            document.querySelectorAll('.theme-moon').forEach(el => el.classList.remove('hidden'));
            document.querySelectorAll('.theme-sun').forEach(el => el.classList.add('hidden'));
        }
        themeToggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                htmlElement.classList.toggle('dark');
                const isDark = htmlElement.classList.contains('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                
                document.querySelectorAll('.theme-moon').forEach(el => el.classList.toggle('hidden', isDark));
                document.querySelectorAll('.theme-sun').forEach(el => el.classList.toggle('hidden', !isDark));
            });
        });
    };

    const setupMobileMenu = () => {
        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.remove('-translate-x-full');
                sidebarBackdrop.classList.remove('hidden');
                setTimeout(() => sidebarBackdrop.classList.remove('opacity-0'), 10);
            });
        }
        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', () => {
                sidebar.classList.add('-translate-x-full');
                sidebarBackdrop.classList.add('opacity-0');
                setTimeout(() => sidebarBackdrop.classList.add('hidden'), 300);
            });
        }
    };
});