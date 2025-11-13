// Main Application Module

const App = {
    currentView: 'dashboard',

    // Initialize application
    init() {
        // Always setup event listeners (needed for login form)
        this.setupEventListeners();
        
        // Check authentication
        if (!Auth.init()) {
            // Not logged in - stay on login screen
            console.log('No active session, showing login screen');
            return;
        }

        // Logged in - initialize interface and load dashboard
        console.log('User logged in, initializing app');
        InterfaceManager.init();
        
        // Ensure dashboard is visible (remove hidden class)
        const dashboardView = document.getElementById('dashboardView');
        if (dashboardView) {
            dashboardView.classList.remove('hidden');
        }
        
        this.switchView('dashboard');
    },

    // Setup event listeners
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const result = Auth.login(username, password);
                if (result.success) {
                    // After successful login, Auth.login() already called showMainApp()
                    // Now just initialize interface and load dashboard
                    InterfaceManager.init();
                    this.switchView('dashboard');
                } else {
                    UI.showNotification(result.message || 'Invalid credentials', 'error');
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Auth.logout();
            });
        }

        // Sidebar navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Sidebar toggle (mobile)
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                UI.toggleSidebar();
            });
        }

        // Interface change (admin only)
        const interfaceSelect = document.getElementById('interfaceSelect');
        if (interfaceSelect) {
            interfaceSelect.addEventListener('change', (e) => {
                InterfaceManager.changeInterface(e.target.value);
            });
        }

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.multi-select-container')) {
                document.querySelectorAll('.multi-select-dropdown').forEach(d => {
                    d.classList.remove('active');
                });
            }
            if (!e.target.closest('.search-select-container')) {
                document.querySelectorAll('.search-select-dropdown').forEach(d => {
                    d.classList.remove('active');
                });
            }
        });
    },

    // Switch view
    switchView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
            view.classList.add('hidden');
        });

        // Show selected view
        const view = document.getElementById(`${viewName}View`);
        if (view) {
            view.classList.remove('hidden');
            view.classList.add('active');
        }

        // Update sidebar active state
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-view="${viewName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentView = viewName;

        // Load view content
        switch(viewName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'activities':
                this.loadActivitiesView();
                break;
            case 'winloss':
                this.loadWinLossView();
                break;
            case 'reports':
                this.switchReportTab('activities');
                break;
            case 'accounts':
                this.loadAccountsView();
                break;
            case 'admin':
                if (Auth.isAdmin()) {
                    console.log('Loading admin panel...');
                    Admin.loadAdminPanel();
                } else {
                    console.warn('User is not admin, cannot access admin panel');
                    UI.showNotification('You do not have admin access', 'error');
                }
                break;
        }
    },

    // Load dashboard
    loadDashboard() {
        this.updateStats();
        this.loadRecentActivities();
    },

    // Update statistics
    updateStats() {
        try {
            const accounts = DataManager.getAccounts();
            const activities = DataManager.getAllActivities();
            const internalActivities = DataManager.getInternalActivities();

            let totalProjects = 0;
            let customerActivities = 0;
            let wonProjects = 0;
            let lostProjects = 0;
            let activeProjects = 0;

            accounts.forEach(account => {
                account.projects?.forEach(project => {
                    totalProjects++;
                    customerActivities += project.activities?.length || 0;
                    
                    if (project.status === 'won') wonProjects++;
                    else if (project.status === 'lost') lostProjects++;
                    else activeProjects++;
                });
            });

            document.getElementById('totalAccountsStat').textContent = accounts.length;
            document.getElementById('totalProjectsStat').textContent = totalProjects;
            document.getElementById('totalActivitiesStat').textContent = activities.length;
            document.getElementById('customerActivitiesStat').textContent = customerActivities;
            document.getElementById('internalActivitiesStat').textContent = internalActivities.length;
            document.getElementById('projectStatusStat').textContent = totalProjects;
            document.getElementById('wonProjectsStat').textContent = wonProjects;
            document.getElementById('lostProjectsStat').textContent = lostProjects;
            document.getElementById('activeProjectsStat').textContent = activeProjects;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    },

    // Load recent activities
    loadRecentActivities() {
        try {
            const activities = DataManager.getAllActivities().slice(0, 10);
            const container = document.getElementById('recentActivitiesList');
            if (!container) {
                console.error('recentActivitiesList container not found');
                return;
            }

            if (activities.length === 0) {
                container.innerHTML = UI.emptyState('No recent activities');
                return;
            }

            let html = '';
            activities.forEach(activity => {
                html += `
                    <div class="activity-item">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <strong>${UI.getActivityTypeLabel(activity.type)}</strong>
                                <span class="activity-badge ${activity.isInternal ? 'internal' : 'customer'}">
                                    ${activity.isInternal ? 'Internal' : 'Customer'}
                                </span>
                                <div class="text-muted" style="margin-top: 0.5rem; font-size: 0.875rem;">
                                    ${activity.accountName || 'N/A'} ${activity.projectName ? '→ ' + activity.projectName : ''}
                                </div>
                                <div class="text-muted" style="font-size: 0.75rem; margin-top: 0.25rem;">
                                    ${UI.formatDate(activity.date || activity.createdAt)} • ${activity.userName || 'Unknown'}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading recent activities:', error);
            const container = document.getElementById('recentActivitiesList');
            if (container) {
                container.innerHTML = UI.emptyState('Error loading activities');
            }
        }
    },

    // Load activities view
    loadActivitiesView() {
        try {
            const activities = DataManager.getAllActivities();
            const container = document.getElementById('activitiesContent');
            if (!container) {
                console.error('activitiesContent container not found');
                return;
            }

            if (activities.length === 0) {
                container.innerHTML = UI.emptyState('No activities found');
                return;
            }

            // Group by month
            const activitiesByMonth = {};
            activities.forEach(activity => {
                const date = activity.date || activity.createdAt;
                const month = date ? date.substring(0, 7) : 'Unknown';
                if (!activitiesByMonth[month]) {
                    activitiesByMonth[month] = [];
                }
                activitiesByMonth[month].push(activity);
            });

            let html = '';
            Object.keys(activitiesByMonth).sort().reverse().forEach(month => {
                html += `
                    <div class="card">
                        <div class="card-header">
                            <h3>${UI.formatMonth(month)}</h3>
                        </div>
                        <div class="card-body">
                `;

                activitiesByMonth[month].forEach(activity => {
                    html += `
                        <div class="activity-item">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div>
                                    <strong>${UI.getActivityTypeLabel(activity.type)}</strong>
                                    <span class="activity-badge ${activity.isInternal ? 'internal' : 'customer'}">
                                        ${activity.isInternal ? 'Internal' : 'Customer'}
                                    </span>
                                    <div class="text-muted" style="margin-top: 0.5rem; font-size: 0.875rem;">
                                        ${activity.accountName || 'N/A'} ${activity.projectName ? '→ ' + activity.projectName : ''}
                                    </div>
                                    <div class="text-muted" style="font-size: 0.75rem; margin-top: 0.25rem;">
                                        ${UI.formatDate(activity.date || activity.createdAt)} • ${activity.userName || 'Unknown'}
                                    </div>
                                </div>
                                ${activity.userId === Auth.getCurrentUser()?.id ? `
                                    <div>
                                        <button class="btn btn-sm btn-secondary" onclick="App.editActivity('${activity.id}', ${activity.isInternal})">Edit</button>
                                        <button class="btn btn-sm btn-danger" onclick="App.deleteActivity('${activity.id}', ${activity.isInternal})">Delete</button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });

                html += `
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading activities view:', error);
            const container = document.getElementById('activitiesContent');
            if (container) {
                container.innerHTML = UI.emptyState('Error loading activities');
            }
        }
    },

    // Search activities
    searchActivities() {
        const query = document.getElementById('activitySearch').value.toLowerCase();
        const activities = document.querySelectorAll('.activity-item');
        
        activities.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? '' : 'none';
        });
    },

    // Load win/loss view
    loadWinLossView() {
        try {
            const accounts = DataManager.getAccounts();
            const container = document.getElementById('winlossContent');
            if (!container) {
                console.error('winlossContent container not found');
                return;
            }

            let allProjects = [];
            accounts.forEach(account => {
                account.projects?.forEach(project => {
                    allProjects.push({
                        ...project,
                        accountName: account.name,
                        accountId: account.id
                    });
                });
            });

            const wins = allProjects.filter(p => p.status === 'won').length;
            const losses = allProjects.filter(p => p.status === 'lost').length;
            const active = allProjects.filter(p => p.status === 'active').length;

            document.getElementById('totalWins').textContent = `${wins} Wins`;
            document.getElementById('totalLosses').textContent = `${losses} Losses`;
            document.getElementById('totalActive').textContent = `${active} Active`;

            if (allProjects.length === 0) {
                container.innerHTML = UI.emptyState('No projects found');
                return;
            }

            let html = '';
            allProjects.forEach(project => {
                const statusClass = project.status === 'won' ? 'won' : 
                                  project.status === 'lost' ? 'lost' : 'pending';
                
                html += `
                    <div class="project-card ${statusClass}">
                        <div class="project-info">
                            <h4>${project.name}</h4>
                            <p class="text-muted">${project.accountName}</p>
                            ${project.winLossData ? `
                                <div style="margin-top: 0.5rem;">
                                    <p><strong>MRR:</strong> $${project.winLossData.mrr || '0'}</p>
                                    <p><strong>Reason:</strong> ${project.winLossData.reason || 'N/A'}</p>
                                </div>
                            ` : ''}
                        </div>
                        <div class="win-loss-actions">
                            <button class="btn btn-sm btn-primary" onclick="App.openWinLossModal('${project.accountId}', '${project.id}')">
                                Update Status
                            </button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading win/loss view:', error);
            const container = document.getElementById('winlossContent');
            if (container) {
                container.innerHTML = UI.emptyState('Error loading projects');
            }
        }
    },

    // Filter win/loss
    filterWinLoss() {
        const query = document.getElementById('winlossSearch').value.toLowerCase();
        const cards = document.querySelectorAll('.project-card');
        
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? '' : 'none';
        });
    },

    // Load reports
    loadReports() {
        try {
            const monthInput = document.getElementById('reportMonth');
            const today = new Date();
            const defaultMonth = today.toISOString().substring(0, 7);
            
            // Set default month if not set
            if (monthInput && !monthInput.value) {
                monthInput.value = defaultMonth;
            }
            
            const selectedMonth = monthInput ? (monthInput.value || defaultMonth) : defaultMonth;

            const activities = DataManager.getAllActivities();
            const monthActivities = activities.filter(a => {
                const date = a.date || a.createdAt;
                if (!date) return false;
                const activityMonth = date.substring(0, 7);
                return activityMonth === selectedMonth;
            });

            const container = document.getElementById('reportsContent');
            if (!container) {
                console.error('reportsContent container not found');
                return;
            }

            // Generate monthly report
            // This is a basic structure - can be enhanced based on PDF requirements
            let html = `
            <div class="card">
                <div class="card-header">
                    <h3>Monthly Report - ${UI.formatMonth(selectedMonth)}</h3>
                </div>
                <div class="card-body">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h4>Total Activities</h4>
                            <div class="stat-value">${monthActivities.length}</div>
                        </div>
                        <div class="stat-card">
                            <h4>Customer Activities</h4>
                            <div class="stat-value">${monthActivities.filter(a => !a.isInternal).length}</div>
                        </div>
                        <div class="stat-card">
                            <h4>Internal Activities</h4>
                            <div class="stat-value">${monthActivities.filter(a => a.isInternal).length}</div>
                        </div>
                    </div>
                    
                    <h4 style="margin-top: 2rem; margin-bottom: 1rem;">Activities by Type</h4>
                    <div class="card">
                        <div class="card-body">
            `;

            const activitiesByType = {};
            monthActivities.forEach(activity => {
                const type = UI.getActivityTypeLabel(activity.type);
                activitiesByType[type] = (activitiesByType[type] || 0) + 1;
            });

            Object.entries(activitiesByType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
                html += `
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid var(--gray-200);">
                        <span>${type}</span>
                        <span class="badge">${count}</span>
                    </div>
                `;
            });

            html += `
                        </div>
                    </div>
                </div>
            </div>
            `;

            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading reports:', error);
            const container = document.getElementById('reportsContent');
            if (container) {
                container.innerHTML = UI.emptyState('Error loading reports');
            }
        }
    },

    // Load accounts view
    loadAccountsView() {
        try {
            const accounts = DataManager.getAccounts();
            const container = document.getElementById('accountsContent');
            if (!container) {
                console.error('accountsContent container not found');
                return;
            }

            if (accounts.length === 0) {
                container.innerHTML = UI.emptyState('No accounts found');
                return;
            }

            let html = '';
            accounts.forEach(account => {
                const projectCount = account.projects?.length || 0;
                const activityCount = this.getAccountActivityCount(account.id);
                html += `
                    <div class="card">
                        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                            <h3>${account.name}</h3>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-secondary btn-sm" onclick="App.editAccount('${account.id}')" title="Edit Account">✏️</button>
                                <button class="btn btn-info btn-sm" onclick="App.showMergeAccountModal('${account.id}')" title="Merge Account">🔀</button>
                                <button class="btn btn-danger btn-sm" onclick="App.showDeleteAccountModal('${account.id}')" title="Delete Account">🗑️</button>
                            </div>
                        </div>
                        <div class="card-body">
                            <p><strong>Industry:</strong> ${account.industry || 'N/A'}</p>
                            <p><strong>Sales Rep:</strong> ${account.salesRep || 'N/A'}</p>
                            <p><strong>Projects:</strong> ${projectCount}</p>
                            <p><strong>Activities:</strong> ${activityCount}</p>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading accounts view:', error);
            const container = document.getElementById('accountsContent');
            if (container) {
                container.innerHTML = UI.emptyState('Error loading accounts');
            }
        }
    },

    // Search accounts
    searchAccounts() {
        const query = document.getElementById('accountSearch').value.toLowerCase();
        const cards = document.querySelectorAll('#accountsContent .card');
        
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? '' : 'none';
        });
    },
    
    // Get activity count for account
    getAccountActivityCount(accountId) {
        const activities = DataManager.getAllActivities();
        return activities.filter(a => a.accountId === accountId).length;
    },
    
    // Edit account
    editAccount(accountId) {
        const account = DataManager.getAccountById(accountId);
        if (!account) {
            UI.showNotification('Account not found', 'error');
            return;
        }
        
        const name = prompt('Enter new account name:', account.name);
        if (!name || name.trim() === '') return;
        
        const industry = prompt('Enter industry:', account.industry || '');
        if (industry === null) return;
        
        // Get sales rep
        const salesReps = DataManager.getGlobalSalesReps();
        const currentSalesRep = salesReps.find(r => r.name === account.salesRep);
        let salesRepEmail = currentSalesRep ? currentSalesRep.email : '';
        
        if (salesReps.length > 0) {
            const salesRepOptions = salesReps.map(r => `${r.name} (${r.email})`).join('\n');
            const selectedIndex = prompt(`Select sales rep (enter number):\n${salesReps.map((r, i) => `${i + 1}. ${r.name} (${r.email})`).join('\n')}\n0. None`);
            if (selectedIndex !== null) {
                const index = parseInt(selectedIndex) - 1;
                if (index >= 0 && index < salesReps.length) {
                    salesRepEmail = salesReps[index].email;
                } else if (selectedIndex === '0') {
                    salesRepEmail = '';
                }
            }
        }
        
        const selectedSalesRep = salesReps.find(r => r.email === salesRepEmail);
        const salesRepName = selectedSalesRep ? selectedSalesRep.name : '';
        
        // Update account
        const accounts = DataManager.getAccounts();
        const accountIndex = accounts.findIndex(a => a.id === accountId);
        if (accountIndex !== -1) {
            accounts[accountIndex].name = name.trim();
            accounts[accountIndex].industry = industry.trim();
            accounts[accountIndex].salesRep = salesRepName;
            accounts[accountIndex].updatedAt = new Date().toISOString();
            DataManager.saveAccounts(accounts);
            
            UI.showNotification('Account updated successfully', 'success');
            this.loadAccountsView();
        }
    },
    
    // Show merge account modal
    showMergeAccountModal(accountId) {
        const account = DataManager.getAccountById(accountId);
        if (!account) {
            UI.showNotification('Account not found', 'error');
            return;
        }
        
        const accounts = DataManager.getAccounts().filter(a => a.id !== accountId);
        if (accounts.length === 0) {
            UI.showNotification('No other accounts to merge with', 'error');
            return;
        }
        
        const options = accounts.map((a, i) => `${i + 1}. ${a.name} (${a.industry || 'N/A'})`).join('\n');
        const selected = prompt(`Select account to merge "${account.name}" into:\n${options}\n\nEnter number or cancel:`);
        if (!selected) return;
        
        const index = parseInt(selected) - 1;
        if (index < 0 || index >= accounts.length) {
            UI.showNotification('Invalid selection', 'error');
            return;
        }
        
        const targetAccount = accounts[index];
        this.mergeAccounts(accountId, targetAccount.id);
    },
    
    // Merge accounts
    mergeAccounts(sourceAccountId, targetAccountId) {
        const sourceAccount = DataManager.getAccountById(sourceAccountId);
        const targetAccount = DataManager.getAccountById(targetAccountId);
        
        if (!sourceAccount || !targetAccount) {
            UI.showNotification('One or both accounts not found', 'error');
            return;
        }
        
        // Check for conflicts
        const conflicts = [];
        if (sourceAccount.salesRep !== targetAccount.salesRep) {
            conflicts.push({
                field: 'Sales Rep',
                source: sourceAccount.salesRep || 'None',
                target: targetAccount.salesRep || 'None'
            });
        }
        if (sourceAccount.industry !== targetAccount.industry) {
            conflicts.push({
                field: 'Industry',
                source: sourceAccount.industry || 'None',
                target: targetAccount.industry || 'None'
            });
        }
        
        // Show conflicts and get user choices
        let finalSalesRep = targetAccount.salesRep;
        let finalIndustry = targetAccount.industry;
        
        if (conflicts.length > 0) {
            let conflictMsg = 'Conflicts detected:\n\n';
            conflicts.forEach(c => {
                conflictMsg += `${c.field}:\n  Source: ${c.source}\n  Target: ${c.target}\n\n`;
            });
            conflictMsg += 'Enter "1" to use Source values, "2" to use Target values, or "3" to cancel:';
            
            const choice = prompt(conflictMsg);
            if (choice === '3' || choice === null) return;
            
            if (choice === '1') {
                finalSalesRep = sourceAccount.salesRep;
                finalIndustry = sourceAccount.industry;
            }
        }
        
        // Merge projects
        const mergedProjects = [...(targetAccount.projects || [])];
        (sourceAccount.projects || []).forEach(project => {
            // Check for duplicate project names
            const existing = mergedProjects.find(p => p.name === project.name);
            if (!existing) {
                mergedProjects.push(project);
            } else {
                // Merge project activities
                if (project.activities) {
                    if (!existing.activities) existing.activities = [];
                    existing.activities.push(...project.activities);
                }
            }
        });
        
        // Update target account
        const accounts = DataManager.getAccounts();
        const targetIndex = accounts.findIndex(a => a.id === targetAccountId);
        if (targetIndex !== -1) {
            accounts[targetIndex].salesRep = finalSalesRep;
            accounts[targetIndex].industry = finalIndustry;
            accounts[targetIndex].projects = mergedProjects;
            accounts[targetIndex].updatedAt = new Date().toISOString();
            
            // Update all activities to point to target account
            const activities = DataManager.getAllActivities();
            activities.forEach(activity => {
                if (activity.accountId === sourceAccountId) {
                    activity.accountId = targetAccountId;
                    activity.accountName = targetAccount.name;
                }
            });
            DataManager.saveActivities(activities);
            
            // Delete source account
            DataManager.deleteAccount(sourceAccountId);
            
            DataManager.saveAccounts(accounts);
            
            UI.showNotification(`Accounts merged successfully. "${sourceAccount.name}" merged into "${targetAccount.name}"`, 'success');
            this.loadAccountsView();
        }
    },
    
    // Show delete account modal
    showDeleteAccountModal(accountId) {
        const account = DataManager.getAccountById(accountId);
        if (!account) {
            UI.showNotification('Account not found', 'error');
            return;
        }
        
        const projectCount = account.projects?.length || 0;
        const activityCount = this.getAccountActivityCount(accountId);
        
        let message = `Are you sure you want to delete "${account.name}"?\n\n`;
        message += `This will delete:\n`;
        message += `- ${projectCount} project(s)\n`;
        message += `- ${activityCount} activity/activities\n\n`;
        message += `This action cannot be undone!\n\n`;
        message += `Enter "DELETE" to confirm:`;
        
        const confirmation = prompt(message);
        if (confirmation !== 'DELETE') {
            return;
        }
        
        // Check for activities with different sales reps
        const activities = DataManager.getAllActivities().filter(a => a.accountId === accountId);
        const uniqueSalesReps = [...new Set(activities.map(a => a.salesRep).filter(Boolean))];
        
        if (uniqueSalesReps.length > 1) {
            const salesRepMsg = `Warning: Activities have different sales reps:\n${uniqueSalesReps.join(', ')}\n\n`;
            const salesRepMsg2 = `Do you want to reassign activities to another account before deletion?\n\n`;
            const salesRepMsg3 = `Enter account name to reassign, or "DELETE" to proceed with deletion:`;
            const reassign = prompt(salesRepMsg + salesRepMsg2 + salesRepMsg3);
            
            if (reassign && reassign !== 'DELETE') {
                const targetAccount = DataManager.getAccounts().find(a => a.name.toLowerCase() === reassign.toLowerCase());
                if (targetAccount) {
                    // Reassign activities
                    activities.forEach(activity => {
                        activity.accountId = targetAccount.id;
                        activity.accountName = targetAccount.name;
                    });
                    DataManager.saveActivities(activities);
                    UI.showNotification(`Activities reassigned to "${targetAccount.name}"`, 'success');
                } else {
                    UI.showNotification('Account not found. Deletion cancelled.', 'error');
                    return;
                }
            }
        }
        
        // Delete account (this will also delete projects and activities)
        DataManager.deleteAccount(accountId);
        
        UI.showNotification('Account deleted successfully', 'success');
        this.loadAccountsView();
    },

    // Load settings view
    // Switch report tabs
    switchReportTab(tab) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        if (tab === 'activities') {
            const content = document.getElementById('reportActivitiesTab');
            const btn = document.querySelector('.tab-btn[onclick*="activities"]');
            if (content) content.classList.remove('hidden');
            if (btn) btn.classList.add('active');
            this.loadActivitiesView('reportActivitiesContent');
        } else if (tab === 'reports') {
            const content = document.getElementById('reportReportsTab');
            const btn = document.querySelector('.tab-btn[onclick*="reports"]');
            if (content) content.classList.remove('hidden');
            if (btn) btn.classList.add('active');
            this.loadReports();
        } else if (tab === 'management') {
            const content = document.getElementById('reportManagementTab');
            const btn = document.querySelector('.tab-btn[onclick*="management"]');
            if (content) content.classList.remove('hidden');
            if (btn) btn.classList.add('active');
            this.loadActivityManagement();
        }
    },

    // Load activity management
    loadActivityManagement() {
        try {
            const activities = DataManager.getAllActivities();
            
            // Populate filters
            this.populateReportFilters(activities);
            
            // Filter and display
            this.filterReportActivities(activities);
        } catch (error) {
            console.error('Error loading activity management:', error);
            const container = document.getElementById('reportManagementContent');
            if (container) {
                container.innerHTML = UI.emptyState('Error loading activity management');
            }
        }
    },

    // Populate report filters
    populateReportFilters(activities) {
        const users = DataManager.getUsers();
        const regions = DataManager.getRegions();
        
        // User filter
        const userFilter = document.getElementById('reportUserFilter');
        if (userFilter) {
            let html = '<option value="">All Users</option>';
            users.forEach(user => {
                html += `<option value="${user.id}">${user.username}</option>`;
            });
            userFilter.innerHTML = html;
        }
        
        // Region filter
        const regionFilter = document.getElementById('reportRegionFilter');
        if (regionFilter) {
            let html = '<option value="">All Regions</option>';
            regions.forEach(region => {
                html += `<option value="${region}">${region}</option>`;
            });
            regionFilter.innerHTML = html;
        }
        
        // Activity type filter
        const activityFilter = document.getElementById('reportActivityTypeFilter');
        if (activityFilter) {
            const types = [...new Set(activities.map(a => a.type))];
            let html = '<option value="">All Activity Types</option>';
            types.forEach(type => {
                html += `<option value="${type}">${UI.getActivityTypeLabel(type)}</option>`;
            });
            activityFilter.innerHTML = html;
        }
    },

    // Filter report activities
    filterReportActivities(activities = null) {
        if (!activities) {
            activities = DataManager.getAllActivities();
        }
        
        const userId = document.getElementById('reportUserFilter')?.value;
        const region = document.getElementById('reportRegionFilter')?.value;
        const activityType = document.getElementById('reportActivityTypeFilter')?.value;
        
        let filtered = activities;
        
        if (userId) {
            filtered = filtered.filter(a => a.userId === userId);
        }
        
        if (region) {
            filtered = filtered.filter(a => a.region === region || a.salesRepRegion === region);
        }
        
        if (activityType) {
            filtered = filtered.filter(a => a.type === activityType);
        }
        
        // Display filtered activities
        const container = document.getElementById('reportManagementContent');
        if (!container) return;
        
        if (filtered.length === 0) {
            container.innerHTML = UI.emptyState('No activities found');
            return;
        }
        
        // Group by month
        const activitiesByMonth = {};
        filtered.forEach(activity => {
            const date = activity.date || activity.createdAt;
            const month = date ? date.substring(0, 7) : 'Unknown';
            if (!activitiesByMonth[month]) {
                activitiesByMonth[month] = [];
            }
            activitiesByMonth[month].push(activity);
        });
        
        let html = '';
        Object.keys(activitiesByMonth).sort().reverse().forEach(month => {
            html += `
                <div class="card">
                    <div class="card-header">
                        <h3>${DataManager.formatMonth(month)}</h3>
                    </div>
                    <div class="card-body">
            `;
            
            activitiesByMonth[month].forEach(activity => {
                if (activity.isInternal) {
                    // Internal activities: Simple format "Internal - Activity Name"
                    const activityName = activity.activityName || UI.getActivityTypeLabel(activity.type);
                    html += `
                        <div class="activity-item">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div>
                                    <strong>Internal - ${activityName}</strong>
                                </div>
                                <div>
                                    ${activity.userId === Auth.getCurrentUser()?.id ? `
                                        <button class="btn btn-sm btn-secondary" onclick="App.editActivity('${activity.id}')">Edit</button>
                                        <button class="btn btn-sm btn-danger" onclick="App.deleteActivity('${activity.id}')">Delete</button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // External activities: Full format
                    html += `
                        <div class="activity-item">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 0.25rem;">
                                        ${activity.accountName || ''} ${activity.projectName ? '→ ' + activity.projectName : ''}
                                    </div>
                                    <strong>${UI.getActivityTypeLabel(activity.type)}</strong>
                                    <span class="activity-badge customer">Customer</span>
                                    <div class="text-muted" style="font-size: 0.75rem; margin-top: 0.25rem;">
                                        ${UI.formatDate(activity.date || activity.createdAt)} • ${activity.userName || 'Unknown'} • ${UI.getActivitySummary(activity) || 'No details'}
                                    </div>
                                </div>
                                <div>
                                    ${activity.userId === Auth.getCurrentUser()?.id ? `
                                        <button class="btn btn-sm btn-secondary" onclick="App.editActivity('${activity.id}')">Edit</button>
                                        <button class="btn btn-sm btn-danger" onclick="App.deleteActivity('${activity.id}')">Delete</button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },

    loadActivitiesView(containerId = 'activitiesContent') {
        try {
            const activities = DataManager.getAllActivities();
            const container = document.getElementById(containerId);
            if (!container) {
                console.error('Activities container not found:', containerId);
                return;
            }

            if (activities.length === 0) {
                container.innerHTML = UI.emptyState('No activities found');
                return;
            }

            // Group by month
            const activitiesByMonth = {};
            activities.forEach(activity => {
                const date = activity.date || activity.createdAt;
                const month = date ? date.substring(0, 7) : 'Unknown';
                if (!activitiesByMonth[month]) {
                    activitiesByMonth[month] = [];
                }
                activitiesByMonth[month].push(activity);
            });

            let html = '';
            Object.keys(activitiesByMonth).sort().reverse().forEach(month => {
                html += `
                    <div class="card">
                        <div class="card-header">
                            <h3>${DataManager.formatMonth(month)}</h3>
                        </div>
                        <div class="card-body">
                `;

                activitiesByMonth[month].forEach(activity => {
                    if (activity.isInternal) {
                        // Internal activities: Simple format "Internal - Activity Name"
                        const activityName = activity.activityName || UI.getActivityTypeLabel(activity.type);
                        html += `
                            <div class="activity-item">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div>
                                        <strong>Internal - ${activityName}</strong>
                                    </div>
                                    <div>
                                        ${activity.userId === Auth.getCurrentUser()?.id ? `
                                            <button class="btn btn-sm btn-secondary" onclick="App.editActivity('${activity.id}')">Edit</button>
                                            <button class="btn btn-sm btn-danger" onclick="App.deleteActivity('${activity.id}')">Delete</button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        // External activities: Full format
                        html += `
                            <div class="activity-item">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div>
                                        <div style="font-weight: 600; margin-bottom: 0.25rem;">
                                            ${activity.accountName || ''} ${activity.projectName ? '→ ' + activity.projectName : ''}
                                        </div>
                                        <strong>${UI.getActivityTypeLabel(activity.type)}</strong>
                                        <span class="activity-badge customer">Customer</span>
                                        <div class="text-muted" style="font-size: 0.75rem; margin-top: 0.25rem;">
                                            ${UI.formatDate(activity.date || activity.createdAt)} • ${activity.userName || 'Unknown'} • ${UI.getActivitySummary(activity) || 'No details'}
                                        </div>
                                    </div>
                                    <div>
                                        ${activity.userId === Auth.getCurrentUser()?.id ? `
                                            <button class="btn btn-sm btn-secondary" onclick="App.editActivity('${activity.id}')">Edit</button>
                                            <button class="btn btn-sm btn-danger" onclick="App.deleteActivity('${activity.id}')">Delete</button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                });

                html += `
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading activities view:', error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = UI.emptyState('Error loading activities');
            }
        }
    },

    // Load user regions (legacy - kept for compatibility)
    loadUserRegions() {
        try {
            const currentUser = Auth.getCurrentUser();
            if (!currentUser) {
                console.error('No current user for loadUserRegions');
                return;
            }

            const allRegions = DataManager.getRegions();
            const userRegions = currentUser.regions || [];
            const container = document.getElementById('userRegionsList');
            if (!container) {
                console.error('userRegionsList container not found');
                return;
            }

            console.log('Loading regions. All:', allRegions.length, 'User:', userRegions.length);

            if (allRegions.length === 0) {
                container.innerHTML = '<p class="text-muted">No regions available</p>';
                return;
            }

            let html = '';
            allRegions.forEach(region => {
                const checked = userRegions.includes(region) ? 'checked' : '';
                html += `
                    <div class="settings-item">
                        <input type="checkbox" id="region_${region}" ${checked} value="${region}">
                        <label for="region_${region}">${region}</label>
                    </div>
                `;
            });
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading user regions:', error);
        }
    },

    // Save user regions
    saveUserRegions() {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        const checkboxes = document.querySelectorAll('#userRegionsList input[type="checkbox"]:checked');
        const regions = Array.from(checkboxes).map(cb => cb.value);

        DataManager.updateUser(currentUser.id, { regions });
        Auth.currentUser.regions = regions;
        UI.showNotification('Regions saved successfully', 'success');
    },

    // Load user sales reps
    loadUserSalesReps() {
        try {
            const currentUser = Auth.getCurrentUser();
            if (!currentUser) {
                console.error('No current user for loadUserSalesReps');
                return;
            }

            const salesReps = currentUser.salesReps || [];
            const container = document.getElementById('salesRepsList');
            if (!container) {
                console.error('salesRepsList container not found');
                return;
            }

            console.log('Loading sales reps:', salesReps.length);

            if (salesReps.length === 0) {
                container.innerHTML = '<p class="text-muted">No sales reps added</p>';
                return;
            }

            let html = '';
            salesReps.forEach(rep => {
                html += `
                    <div class="settings-item">
                        <span>${rep}</span>
                        <button class="btn btn-sm btn-danger" onclick="App.removeSalesRep('${rep}')">Remove</button>
                    </div>
                `;
            });
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading user sales reps:', error);
        }
    },

    // Add sales rep
    addSalesRep() {
        const input = document.getElementById('newSalesRep');
        const rep = input.value.trim();
        
        if (!rep) {
            UI.showNotification('Please enter a sales rep name', 'error');
            return;
        }

        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        const salesReps = currentUser.salesReps || [];
        if (salesReps.includes(rep)) {
            UI.showNotification('Sales rep already exists', 'error');
            return;
        }

        salesReps.push(rep);
        DataManager.updateUser(currentUser.id, { salesReps });
        Auth.currentUser.salesReps = salesReps;
        
        input.value = '';
        UI.showNotification('Sales rep added successfully', 'success');
        this.loadUserSalesReps();
    },

    // Remove sales rep
    removeSalesRep(rep) {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        const salesReps = (currentUser.salesReps || []).filter(r => r !== rep);
        DataManager.updateUser(currentUser.id, { salesReps });
        Auth.currentUser.salesReps = salesReps;
        
        UI.showNotification('Sales rep removed successfully', 'success');
        this.loadUserSalesReps();
    },

    // Open win/loss modal
    openWinLossModal(accountId, projectId) {
        this.createWinLossModal();
        
        const accounts = DataManager.getAccounts();
        const account = accounts.find(a => a.id === accountId);
        const project = account?.projects?.find(p => p.id === projectId);
        
        if (!project) {
            UI.showNotification('Project not found', 'error');
            return;
        }
        
        document.getElementById('winLossAccountId').value = accountId;
        document.getElementById('winLossProjectId').value = projectId;
        document.getElementById('winLossStatus').value = project.status || 'active';
        
        if (project.winLossData) {
            document.getElementById('winLossReason').value = project.winLossData.reason || '';
            document.getElementById('competitorAnalysis').value = project.winLossData.competitors || '';
            document.getElementById('winLossMRR').value = project.winLossData.mrr || '';
            document.getElementById('accountType').value = project.winLossData.accountType || 'existing';
            this.toggleWinLossFields();
        }
        
        UI.showModal('winLossModal');
    },
    
    // Create Win/Loss modal
    createWinLossModal() {
        const container = document.getElementById('modalsContainer');
        const modalId = 'winLossModal';
        
        if (document.getElementById(modalId)) return;
        
        const modalHTML = `
            <div id="${modalId}" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Update Project Status</h2>
                        <button class="modal-close" onclick="UI.hideModal('${modalId}')">&times;</button>
                    </div>
                    <form id="winLossForm" onsubmit="App.saveWinLoss(event)">
                        <input type="hidden" id="winLossProjectId">
                        <input type="hidden" id="winLossAccountId">
                        <div class="form-group">
                            <label class="form-label required">Project Status</label>
                            <select class="form-control" id="winLossStatus" required onchange="App.toggleWinLossFields()">
                                <option value="">Select Status</option>
                                <option value="active">Active</option>
                                <option value="won">Won</option>
                                <option value="lost">Lost</option>
                            </select>
                        </div>
                        <div id="winLossFields" class="d-none">
                            <div class="form-group">
                                <label class="form-label required">Reason for Win/Loss</label>
                                <textarea class="form-control" id="winLossReason" rows="3" placeholder="Explain the reason..." required></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Competitor Analysis</label>
                                <input type="text" class="form-control" id="competitorAnalysis" placeholder="Which competitors were involved?">
                            </div>
                            <div class="form-group">
                                <label class="form-label required">MRR (Monthly Recurring Revenue)</label>
                                <input type="number" class="form-control" id="winLossMRR" min="0" step="100" placeholder="Enter amount" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Account Type</label>
                                <select class="form-control" id="accountType">
                                    <option value="existing">Existing Account</option>
                                    <option value="new">New Account</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="UI.hideModal('${modalId}')">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Status</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', modalHTML);
    },
    
    // Toggle Win/Loss fields
    toggleWinLossFields() {
        const status = document.getElementById('winLossStatus').value;
        const fields = document.getElementById('winLossFields');
        if (fields) {
            if (status === 'won' || status === 'lost') {
                fields.classList.remove('d-none');
            } else {
                fields.classList.add('d-none');
            }
        }
    },
    
    // Save Win/Loss
    saveWinLoss(event) {
        event.preventDefault();
        
        const accountId = document.getElementById('winLossAccountId').value;
        const projectId = document.getElementById('winLossProjectId').value;
        const status = document.getElementById('winLossStatus').value;
        
        const accounts = DataManager.getAccounts();
        const account = accounts.find(a => a.id === accountId);
        const project = account?.projects?.find(p => p.id === projectId);
        
        if (!project) {
            UI.showNotification('Project not found', 'error');
            return;
        }
        
        project.status = status;
        
        if (status === 'won' || status === 'lost') {
            project.winLossData = {
                reason: document.getElementById('winLossReason').value,
                competitors: document.getElementById('competitorAnalysis').value,
                mrr: document.getElementById('winLossMRR').value,
                accountType: document.getElementById('accountType').value,
                updatedAt: new Date().toISOString()
            };
        } else {
            delete project.winLossData;
        }
        
        DataManager.saveAccounts(accounts);
        
        UI.hideModal('winLossModal');
        UI.showNotification('Project status updated!', 'success');
        this.loadWinLossView();
    },

    // Edit activity (own activities only)
    editActivity(activityId, isInternal) {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        // Find activity
        let activity;
        if (isInternal) {
            const activities = DataManager.getInternalActivities();
            activity = activities.find(a => a.id === activityId);
        } else {
            const activities = DataManager.getActivities();
            activity = activities.find(a => a.id === activityId);
        }

        if (!activity) {
            UI.showNotification('Activity not found', 'error');
            return;
        }

        // Check if user owns this activity
        if (activity.userId !== currentUser.id) {
            UI.showNotification('You can only edit your own activities', 'error');
            return;
        }

        UI.showNotification('Edit activity - to be fully implemented', 'info');
    },

    // Delete activity (own activities only)
    deleteActivity(activityId, isInternal) {
        if (!confirm('Are you sure you want to delete this activity?')) return;

        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        // Find activity
        let activity;
        if (isInternal) {
            const activities = DataManager.getInternalActivities();
            activity = activities.find(a => a.id === activityId);
        } else {
            const activities = DataManager.getActivities();
            activity = activities.find(a => a.id === activityId);
        }

        if (!activity) {
            UI.showNotification('Activity not found', 'error');
            return;
        }

        // Check if user owns this activity
        if (activity.userId !== currentUser.id) {
            UI.showNotification('You can only delete your own activities', 'error');
            return;
        }

        // Delete activity
        if (isInternal) {
            DataManager.deleteInternalActivity(activityId);
        } else {
            DataManager.deleteActivity(activityId);
        }

        UI.showNotification('Activity deleted successfully', 'success');
        this.loadActivitiesView();
        this.loadDashboard();
    },

    // Expose functions globally
    openActivityModal: () => Activities.openActivityModal()
};

// Make app globally available
window.app = App;

// Make DataManager available globally for debugging
window.DataManager = DataManager;
window.Auth = Auth;

// Utility function to reset users (for testing)
window.resetUsers = function() {
    localStorage.removeItem('users');
    DataManager.ensureDefaultUsers();
    console.log('Users reset. Current users:', DataManager.getUsers().map(u => u.username));
    alert('Users reset! You can now login with:\n- admin / admin123\n- user / user123');
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    // Ensure users exist before initializing
    DataManager.ensureDefaultUsers();
    App.init();
});

