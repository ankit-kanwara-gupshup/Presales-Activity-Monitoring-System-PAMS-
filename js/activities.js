// Activities Management Module

// Common Products List (avoid code duplication)
const COMMON_PRODUCTS = [
    'AI Agents',
    'Campaign Manager',
    'Agent Assist',
    'Journey Builder',
    'Personalize',
    'Voice AI',
    'Other'
];

const Activities = {
    selectedUseCases: [],
    selectedChannels: [],
    selectedProjectProducts: [],
    editingActivity: null,
    activityType: null, // 'internal' or 'external'

    // Open unified activity modal
    openActivityModal() {
        this.resetActivityForm();
        this.createActivityModal();
        UI.showModal('activityModal');
    },

    // Open customer activity modal (legacy - for backward compatibility)
    openCustomerActivityModal() {
        this.openActivityModal();
    },

    // Open internal activity modal (legacy - for backward compatibility)
    openInternalActivityModal() {
        this.openActivityModal();
    },

    // Create unified activity modal HTML
    createActivityModal() {
        const container = document.getElementById('modalsContainer');
        const modalId = 'activityModal';
        
        if (document.getElementById(modalId)) return; // Already exists

        const modalHTML = `
            <div id="${modalId}" class="modal">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2 class="modal-title">Log Activity</h2>
                        <button class="modal-close" onclick="UI.hideModal('${modalId}')">&times;</button>
                    </div>
                    <form id="activityForm" onsubmit="Activities.saveActivity(event)">
                        <!-- SECTION 1: Activity Type (Internal/External) -->
                        <div class="form-section">
                            <h3>Activity Type</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Select Activity Category</label>
                                    <div class="radio-group">
                                        <label class="radio-label">
                                            <input type="radio" name="activityCategory" value="internal" onchange="Activities.setActivityCategory('internal')" required>
                                            <span>Internal Activity</span>
                                        </label>
                                        <label class="radio-label">
                                            <input type="radio" name="activityCategory" value="external" onchange="Activities.setActivityCategory('external')" required>
                                            <span>External Activity</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SECTION 2: Account Section (Only for External) -->
                        <div id="accountSection" class="form-section hidden">
                            <h3>Account Information</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Account Name</label>
                                    <div class="search-select-container" style="position: relative;">
                                        <div class="form-control" style="display: flex; align-items: center; cursor: pointer; position: relative;" onclick="Activities.toggleAccountDropdown()">
                                            <span id="accountDisplay" style="flex: 1;">Select account...</span>
                                            <span style="margin-left: 0.5rem;">▼</span>
                                        </div>
                                        <div class="search-select-dropdown" id="accountDropdown" style="display: none; position: absolute; z-index: 1000; width: 100%;">
                                            <!-- Will be populated by loadAccountDropdown() -->
                                        </div>
                                    </div>
                                    <input type="hidden" id="selectedAccountId">
                                    <div id="newAccountFields" style="margin-top: 0.5rem; display: none;">
                                        <input type="text" class="form-control" id="newAccountName" placeholder="Account Name" style="margin-bottom: 0.5rem;">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label required">Sales Rep</label>
                                    <select class="form-control" id="salesRepSelect" data-was-required="true" required>
                                        <option value="">Select Sales Rep...</option>
                                        ${DataManager.getGlobalSalesReps().filter(r => r.isActive).map(rep => 
                                            `<option value="${rep.email}" data-name="${rep.name}">${rep.name}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Industry</label>
                                    <select class="form-control" id="industry" data-was-required="true" required>
                                        <option value="">Select Industry</option>
                                        ${DataManager.getIndustries().map(ind => `<option value="${ind}">${ind}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- SECTION 3: Project Section (Only for External) -->
                        <div id="projectSection" class="form-section hidden">
                            <h3>Project Information</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Project Name</label>
                                    <div class="search-select-container">
                                        <div class="form-control" id="projectDisplayContainer" style="display: flex; align-items: center; cursor: pointer; position: relative; background: #e5e7eb; cursor: not-allowed;" onclick="Activities.toggleProjectDropdown()">
                                            <span id="projectDisplay" style="flex: 1;">Select account first...</span>
                                            <span style="margin-left: 0.5rem;">▼</span>
                                        </div>
                                        <div class="search-select-dropdown" id="projectDropdown" style="display: none;">
                                            <!-- Will be populated by loadProjectDropdown() -->
                                        </div>
                                    </div>
                                    <input type="hidden" id="selectedProjectId">
                                    <div id="newProjectFields" style="margin-top: 0.5rem; display: none;">
                                        <input type="text" class="form-control" id="newProjectName" placeholder="Project Name" style="margin-bottom: 0.5rem;">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">SFDC Link</label>
                                    <div class="checkbox-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="noSfdcLink" onchange="Activities.toggleSfdcLink()">
                                            <span>No SFDC link exists</span>
                                        </label>
                                    </div>
                                    <input type="url" class="form-control" id="sfdcLink" placeholder="https://..." style="margin-top: 0.5rem;">
                                </div>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Primary Use Case</label>
                                    <div class="multi-select-container">
                                        <div class="multi-select-trigger" onclick="Activities.toggleMultiSelect('useCaseDropdown')">
                                            <span class="multi-select-selected" id="useCaseSelected">Select use cases...</span>
                                            <span>▼</span>
                                        </div>
                                        <div class="multi-select-dropdown" id="useCaseDropdown">
                                            ${['Marketing', 'Commerce', 'Support'].map(uc => `
                                                <div class="multi-select-option" onclick="Activities.toggleOption('useCase', '${uc}')">
                                                    <input type="checkbox" value="${uc}"> ${uc}
                                                </div>
                                            `).join('')}
                                            <div class="multi-select-option" onclick="Activities.toggleOption('useCase', 'Other')">
                                                <input type="checkbox" value="Other" id="useCaseOtherCheck"> Other
                                            </div>
                                        </div>
                                    </div>
                                    <input type="text" class="form-control" id="useCaseOtherText" placeholder="Specify other use case..." style="margin-top: 0.5rem; display: none;">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label required">Products Interested</label>
                                <div class="multi-select-container">
                                    <div class="multi-select-trigger" onclick="Activities.toggleMultiSelect('projectProductsDropdown')">
                                        <span class="multi-select-selected" id="projectProductsSelected">Select products...</span>
                                        <span>▼</span>
                                    </div>
                                    <div class="multi-select-dropdown" id="projectProductsDropdown">
                                        ${COMMON_PRODUCTS.map(p => `
                                            <div class="multi-select-option" onclick="Activities.toggleOption('projectProducts', '${p}')">
                                                <input type="checkbox" value="${p}"> ${p}
                                            </div>
                                        `).join('')}
                                        <div class="multi-select-option" onclick="Activities.toggleOption('projectProducts', 'Other')">
                                            <input type="checkbox" value="Other"> Other
                                        </div>
                                    </div>
                                </div>
                                <input type="text" class="form-control" id="projectProductsOtherText" placeholder="Specify other product..." style="margin-top: 0.5rem; display: none;">
                            </div>
                            <div class="form-group">
                                <label class="form-label required">Channels</label>
                                <div class="multi-select-container">
                                    <div class="multi-select-trigger" onclick="Activities.toggleMultiSelect('channelsDropdown')">
                                        <span class="multi-select-selected" id="channelsSelected">Select channels...</span>
                                        <span>▼</span>
                                    </div>
                                    <div class="multi-select-dropdown" id="channelsDropdown">
                                        ${['WhatsApp', 'Web', 'Voice', 'RCS', 'Instagram', 'Mobile SDK', 'Other'].map(c => `
                                            <div class="multi-select-option" onclick="Activities.toggleOption('channels', '${c}')">
                                                <input type="checkbox" value="${c}"> ${c}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                <input type="text" class="form-control" id="channelsOtherText" placeholder="Specify other channel..." style="margin-top: 0.5rem; display: none;">
                            </div>
                        </div>

                        <!-- SECTION 4: Activity Details -->
                        <div class="form-section">
                            <h3>Activity Details</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Date</label>
                                    <input type="date" class="form-control" id="activityDate" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label required">Activity Type</label>
                                    <select class="form-control" id="activityTypeSelect" onchange="Activities.showActivityFields()" required>
                                        <option value="">Select Activity Type</option>
                                        <!-- Options will be populated based on Internal/External -->
                                    </select>
                                </div>
                            </div>
                            <div id="activityFields"></div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="UI.hideModal('${modalId}')">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Activity</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', modalHTML);
        
        // Set default date
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('activityDate');
        if (dateInput) dateInput.value = today;
    },

    // Create customer activity modal HTML (legacy - kept for compatibility)
    createCustomerActivityModal() {
        const container = document.getElementById('modalsContainer');
        const modalId = 'customerActivityModal';
        
        if (document.getElementById(modalId)) return; // Already exists

        const modalHTML = `
            <div id="${modalId}" class="modal">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2 class="modal-title">Log Customer Activity</h2>
                        <button class="modal-close" onclick="UI.hideModal('${modalId}')">&times;</button>
                    </div>
                    <form id="customerActivityForm" onsubmit="Activities.saveCustomerActivity(event)">
                        <div class="form-section">
                            <h3>Basic Information</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Account Name</label>
                                    <div class="search-select-container">
                                        <input type="text" class="search-select-input form-control" id="accountSearch" 
                                               placeholder="Search or create new account..." onkeyup="Activities.searchAccounts(this.value)">
                                        <div class="search-select-dropdown" id="accountDropdown"></div>
                                    </div>
                                    <input type="hidden" id="selectedAccountId">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Project Name</label>
                                    <div class="search-select-container">
                                        <input type="text" class="search-select-input form-control" id="projectSearch" 
                                               placeholder="Select account first..." disabled onkeyup="Activities.searchProjects(this.value)">
                                        <div class="search-select-dropdown" id="projectDropdown"></div>
                                    </div>
                                    <input type="hidden" id="selectedProjectId">
                                </div>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Sales Rep Name</label>
                                    <input type="text" class="form-control" id="salesRep" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label required">Industry</label>
                                    <select class="form-control" id="industry" required>
                                        <option value="">Select Industry</option>
                                        ${DataManager.getIndustries().map(ind => `<option value="${ind}">${ind}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">SFDC Link</label>
                                    <input type="url" class="form-control" id="sfdcLink" placeholder="https://...">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Primary Use Case</label>
                                    <div class="multi-select-container">
                                        <div class="multi-select-trigger" onclick="Activities.toggleMultiSelect('useCaseDropdown')">
                                            <span class="multi-select-selected" id="useCaseSelected">Select use cases...</span>
                                            <span>▼</span>
                                        </div>
                                        <div class="multi-select-dropdown" id="useCaseDropdown">
                                            ${['Marketing', 'Commerce', 'Support', 'Sales', 'Service', 'Other'].map(uc => `
                                                <div class="multi-select-option" onclick="Activities.toggleOption('useCase', '${uc}')">
                                                    <input type="checkbox" value="${uc}"> ${uc}
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Customer Type</label>
                                    <select class="form-control" id="customerType">
                                        <option value="">Select Type</option>
                                        <option value="New">New</option>
                                        <option value="Existing">Existing</option>
                                        <option value="Prospect">Prospect</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Location</label>
                                    <input type="text" class="form-control" id="location">
                                </div>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Number of Participants</label>
                                    <input type="number" class="form-control" id="participantCount" min="1">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Participants' Roles</label>
                                    <input type="text" class="form-control" id="participantRoles" placeholder="e.g., CEO, CTO, PM">
                                </div>
                            </div>
                        </div>
                        <div class="form-section">
                            <h3>Activity Details</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Date</label>
                                    <input type="date" class="form-control" id="activityDate" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label required">Activity Type</label>
                                    <select class="form-control" id="customerActivityType" onchange="Activities.showActivityFields(this.value)" required>
                                        <option value="">Select Activity Type</option>
                                        <option value="customerCall">Customer Call</option>
                                        <option value="poc">POC (Proof of Concept)</option>
                                        <option value="rfx">RFx</option>
                                    </select>
                                </div>
                            </div>
                            <div id="customerActivityFields"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="UI.hideModal('${modalId}')">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Activity</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', modalHTML);
        
        // Set default date
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('activityDate');
        if (dateInput) dateInput.value = today;
    },

    // Create internal activity modal
    createInternalActivityModal() {
        const container = document.getElementById('modalsContainer');
        const modalId = 'internalActivityModal';
        
        if (document.getElementById(modalId)) return;

        const modalHTML = `
            <div id="${modalId}" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Log Internal Activity</h2>
                        <button class="modal-close" onclick="UI.hideModal('${modalId}')">&times;</button>
                    </div>
                    <form id="internalActivityForm" onsubmit="Activities.saveInternalActivity(event)">
                        <div class="form-section">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Date</label>
                                    <input type="date" class="form-control" id="internalDate" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label required">Activity Type</label>
                                    <select class="form-control" id="internalActivityType" required>
                                        <option value="">Select Type</option>
                                        <option value="Enablement">Enablement</option>
                                        <option value="Video Creation">Video Creation</option>
                                        <option value="Webinar">Webinar</option>
                                        <option value="Event/Booth Hosting">Event/Booth Hosting</option>
                                        <option value="Product Feedback">Product Feedback</option>
                                        <option value="Content Creation">Content Creation</option>
                                        <option value="Training">Training</option>
                                        <option value="Documentation">Documentation</option>
                                        <option value="Internal Meeting">Internal Meeting</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Time Spent (hours)</label>
                                <input type="number" class="form-control" id="internalTimeSpent" min="0.5" step="0.5" placeholder="e.g., 2.5">
                            </div>
                            <div class="form-group">
                                <label class="form-label required">Session Name / Topic</label>
                                <textarea class="form-control" id="internalTopic" rows="3" required placeholder="Describe the session or topic..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="UI.hideModal('${modalId}')">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Activity</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', modalHTML);
    },

    // Show activity fields based on type
    showActivityFields() {
        const activityTypeSelect = document.getElementById('activityTypeSelect');
        if (!activityTypeSelect) return;
        
        const type = activityTypeSelect.value;
        const container = document.getElementById('activityFields');
        if (!container) return;

        let html = '';
        
        if (this.activityType === 'internal') {
            html = this.getInternalActivityFields();
        } else if (this.activityType === 'external') {
            if (type === 'customerCall') {
                html = this.getCustomerCallFields();
            } else if (type === 'sow') {
                html = this.getSOWFields();
            } else if (type === 'poc') {
                html = this.getPOCFields();
            } else if (type === 'rfx') {
                html = this.getRFxFields();
            } else if (type === 'pricing') {
                html = ''; // No fields for pricing
            }
        }
        
        container.innerHTML = html;
    },

    // Get customer call fields
    getCustomerCallFields() {
        return `
            <div class="form-group">
                <label class="form-label required">Call Type</label>
                <select class="form-control" id="callType" required>
                    <option value="">Select Type</option>
                    <option value="Demo">Demo</option>
                    <option value="Discovery">Discovery</option>
                    <option value="Scoping Deep Dive">Scoping Deep Dive</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Q&A">Q&A</option>
                    <option value="Internal Kickoff">Internal Kickoff</option>
                    <option value="Customer Kickoff">Customer Kickoff</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label required">Description / MOM</label>
                <textarea class="form-control" id="callDescription" rows="4" required placeholder="Enter description or minutes of meeting..."></textarea>
            </div>
        `;
    },

    // Get POC fields
    getPOCFields() {
        return `
            <div class="form-group">
                <label class="form-label required">Access Type</label>
                <select class="form-control" id="accessType" required onchange="Activities.togglePOCFields()">
                    <option value="">Select Access Type</option>
                    <option value="Sandbox">Sandbox</option>
                    <option value="Custom POC - Structured Journey">Custom POC - Structured Journey</option>
                    <option value="Custom POC - Agentic">Custom POC - Agentic</option>
                    <option value="Custom POC - Commerce">Custom POC - Commerce</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label required">Use Case Description</label>
                <textarea class="form-control" id="useCaseDescription" rows="3" required></textarea>
            </div>
            <!-- Sandbox Fields -->
            <div id="pocSandboxFields" class="hidden">
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label required">Start Date</label>
                        <input type="date" class="form-control" id="pocStartDate" required onchange="Activities.setPOCEndDate()">
                    </div>
                    <div class="form-group">
                        <label class="form-label required">End Date</label>
                        <input type="date" class="form-control" id="pocEndDate" required>
                    </div>
                </div>
            </div>
            <!-- Custom POC Fields -->
            <div id="pocCustomFields" class="hidden">
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Demo Environment</label>
                        <input type="text" class="form-control" id="demoEnvironment">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Bot Trigger URL/Number</label>
                        <input type="text" class="form-control" id="botTriggerUrl" placeholder="URL or number">
                    </div>
                </div>
            </div>
        `;
    },

    // Toggle POC fields based on Access Type
    togglePOCFields() {
        const accessType = document.getElementById('accessType').value;
        const sandboxFields = document.getElementById('pocSandboxFields');
        const customFields = document.getElementById('pocCustomFields');
        
        if (accessType === 'Sandbox') {
            if (sandboxFields) sandboxFields.classList.remove('hidden');
            if (customFields) customFields.classList.add('hidden');
        } else if (accessType && accessType.startsWith('Custom POC')) {
            if (sandboxFields) sandboxFields.classList.add('hidden');
            if (customFields) customFields.classList.remove('hidden');
        } else {
            if (sandboxFields) sandboxFields.classList.add('hidden');
            if (customFields) customFields.classList.add('hidden');
        }
    },

    // Get SOW fields
    getSOWFields() {
        return `
            <div class="form-group">
                <label class="form-label required">SOW Document Link</label>
                <input type="url" class="form-control" id="sowLink" placeholder="https://..." required>
            </div>
        `;
    },

    // Get Internal Activity fields
    getInternalActivityFields() {
        return `
            <div class="form-group">
                <label class="form-label required">Time Spent</label>
                <div class="radio-group">
                    <label class="radio-label">
                        <input type="radio" name="timeSpentType" value="day" onchange="Activities.toggleTimeSpentInput()">
                        <span>Day(s)</span>
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="timeSpentType" value="hour" onchange="Activities.toggleTimeSpentInput()">
                        <span>Hour(s)</span>
                    </label>
                </div>
                <input type="number" class="form-control" id="timeSpentValue" placeholder="Enter value..." style="margin-top: 0.5rem; display: none;" min="0" step="0.5">
            </div>
            <div class="form-group">
                <label class="form-label">Activity Name</label>
                <input type="text" class="form-control" id="internalActivityName" placeholder="Enter activity name...">
            </div>
            <div class="form-group">
                <label class="form-label">Topic</label>
                <input type="text" class="form-control" id="internalTopic" placeholder="Enter topic...">
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-control" id="internalDescription" rows="4" placeholder="Enter description..."></textarea>
            </div>
        `;
    },

    // Toggle time spent input
    toggleTimeSpentInput() {
        const timeSpentValue = document.getElementById('timeSpentValue');
        const selected = document.querySelector('input[name="timeSpentType"]:checked');
        if (timeSpentValue && selected) {
            timeSpentValue.style.display = 'block';
            if (selected.value === 'day') {
                timeSpentValue.placeholder = 'Enter number of days';
                timeSpentValue.step = '1';
            } else {
                timeSpentValue.placeholder = 'Enter hours';
                timeSpentValue.step = '0.5';
            }
        }
    },

    // Get RFx fields
    getRFxFields() {
        return `
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label required">RFx Type</label>
                    <select class="form-control" id="rfxType" required>
                        <option value="">Select Type</option>
                        <option value="RFP">RFP (Request for Proposal)</option>
                        <option value="RFI">RFI (Request for Information)</option>
                        <option value="RFQ">RFQ (Request for Quote)</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label required">Submission Deadline</label>
                    <input type="date" class="form-control" id="submissionDeadline" required>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Google Folder Link</label>
                <input type="url" class="form-control" id="googleFolderLink" placeholder="https://drive.google.com/...">
            </div>
            <div class="form-group">
                <label class="form-label">Additional Notes</label>
                <textarea class="form-control" id="rfxNotes" rows="3"></textarea>
            </div>
        `;
    },

    // Multi-select functions
    toggleMultiSelect(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.classList.toggle('active');
            
            // Close other dropdowns
            document.querySelectorAll('.multi-select-dropdown').forEach(d => {
                if (d.id !== dropdownId) {
                    d.classList.remove('active');
                }
            });
        }
    },

    toggleOption(category, value) {
        if (event) event.stopPropagation();
        
        let selectedArray;
        let displayId;
        let otherTextId = null;
        
        if (category === 'useCase') {
            selectedArray = this.selectedUseCases;
            displayId = 'useCaseSelected';
            otherTextId = 'useCaseOtherText';
        } else if (category === 'channels') {
            selectedArray = this.selectedChannels;
            displayId = 'channelsSelected';
            otherTextId = 'channelsOtherText';
        } else if (category === 'projectProducts') {
            selectedArray = this.selectedProjectProducts;
            displayId = 'projectProductsSelected';
            otherTextId = 'projectProductsOtherText';
        }
        
        const index = selectedArray.indexOf(value);
        if (index > -1) {
            selectedArray.splice(index, 1);
            // Hide other text field if "Other" is deselected
            if (value === 'Other' && otherTextId) {
                const otherText = document.getElementById(otherTextId);
                if (otherText) {
                    otherText.style.display = 'none';
                    otherText.value = '';
                }
            }
        } else {
            selectedArray.push(value);
            // Show other text field if "Other" is selected
            if (value === 'Other' && otherTextId) {
                const otherText = document.getElementById(otherTextId);
                if (otherText) {
                    otherText.style.display = 'block';
                    otherText.required = true;
                }
            }
        }
        
        this.updateMultiSelectDisplay(displayId, selectedArray);
    },

    updateMultiSelectDisplay(displayId, selectedArray) {
        const display = document.getElementById(displayId);
        if (!display) return;
        
        if (selectedArray.length === 0) {
            display.textContent = displayId.includes('useCase') ? 'Select use cases...' :
                                 displayId.includes('products') ? 'Select products...' :
                                 displayId.includes('channels') ? 'Select channels...' :
                                 'Select products...';
        } else {
            display.innerHTML = selectedArray.map(item => 
                `<span class="multi-select-tag">${item}</span>`
            ).join('');
        }
    },

    // Load account dropdown (show all accounts immediately)
    loadAccountDropdown() {
        const dropdown = document.getElementById('accountDropdown');
        if (!dropdown) return;
        
        const accounts = DataManager.getAccounts();
        
        let html = '';
        accounts.forEach(account => {
            html += `<div class="search-select-item" onclick="Activities.selectAccount('${account.id}', '${account.name}')">${account.name}</div>`;
        });
        html += `<div class="search-select-create" onclick="Activities.showNewAccountFields()">+ Add New Account</div>`;
        
        dropdown.innerHTML = html;
    },
    
    // Toggle account dropdown
    toggleAccountDropdown() {
        const dropdown = document.getElementById('accountDropdown');
        if (!dropdown) return;
        
        const isVisible = dropdown.style.display !== 'none';
        if (isVisible) {
            dropdown.style.display = 'none';
        } else {
            this.loadAccountDropdown();
            dropdown.style.display = 'block';
            dropdown.classList.add('active');
        }
    },
    
    // Show new account fields
    showNewAccountFields() {
        document.getElementById('accountDropdown').style.display = 'none';
        document.getElementById('selectedAccountId').value = 'new';
        document.getElementById('accountDisplay').textContent = 'New Account';
        document.getElementById('newAccountFields').style.display = 'block';
        document.getElementById('newAccountName').required = true;
        
        // Enable project dropdown for new account
        const projectDisplayContainer = document.getElementById('projectDisplayContainer');
        if (projectDisplayContainer) {
            projectDisplayContainer.style.background = '';
            projectDisplayContainer.style.cursor = 'pointer';
            projectDisplayContainer.removeAttribute('disabled');
        }
        document.getElementById('projectDisplay').textContent = 'Select or create project...';
    },
    
    // Create new account (from form)
    createNewAccount(name) {
        // This is called when user types in new account name field
        document.getElementById('selectedAccountId').value = 'new';
        if (name) {
            document.getElementById('newAccountName').value = name;
        }
    },

    selectAccount(id, name) {
        document.getElementById('selectedAccountId').value = id;
        document.getElementById('accountDisplay').textContent = name;
        document.getElementById('accountDropdown').style.display = 'none';
        document.getElementById('newAccountFields').style.display = 'none';
        if (document.getElementById('newAccountName')) {
            document.getElementById('newAccountName').required = false;
        }
        
        // Auto-populate Sales Rep and Industry from account
        const account = DataManager.getAccountById(id);
        if (account) {
            const salesRepSelect = document.getElementById('salesRepSelect');
            const industrySelect = document.getElementById('industry');
            
            if (salesRepSelect && account.salesRep) {
                // Find sales rep by name in global list (account stores name, dropdown uses email as value)
                const salesRep = DataManager.getGlobalSalesReps().find(r => r.name === account.salesRep);
                if (salesRep) {
                    // Find option by email (value is email)
                    const option = Array.from(salesRepSelect.options).find(opt => opt.value === salesRep.email);
                    if (option) {
                        salesRepSelect.value = salesRep.email;
                    }
                }
                // Note: If sales rep not in global list, dropdown will be empty
                // Admin should add sales rep to global list first
            }
            if (industrySelect && account.industry) {
                industrySelect.value = account.industry;
            }
        }
        
        // Enable project dropdown and load projects
        const projectDisplayContainer = document.getElementById('projectDisplayContainer');
        if (projectDisplayContainer) {
            projectDisplayContainer.style.background = '';
            projectDisplayContainer.style.cursor = 'pointer';
            projectDisplayContainer.removeAttribute('disabled');
        }
        document.getElementById('projectDisplay').textContent = 'Select project...';
        // Load existing projects for dropdown
        this.loadProjectsForAccount(id);
        // Show all projects immediately
        this.loadProjectDropdown();
    },

    // Load projects for account dropdown
    loadProjectsForAccount(accountId) {
        const account = DataManager.getAccountById(accountId);
        const projectSearch = document.getElementById('projectSearch');
        if (!account || !projectSearch) return;
        
        // Store projects for later use in search
        this.accountProjects = account.projects || [];
    },

    createNewAccount(name) {
        document.getElementById('selectedAccountId').value = 'new';
        document.getElementById('accountSearch').value = name;
        document.getElementById('accountDropdown').classList.remove('active');
        
        const projectSearch = document.getElementById('projectSearch');
        if (projectSearch) {
            projectSearch.disabled = false;
            projectSearch.placeholder = 'Search or create new project...';
        }
    },

    // Load project dropdown (show all projects immediately)
    loadProjectDropdown() {
        const accountId = document.getElementById('selectedAccountId').value;
        const dropdown = document.getElementById('projectDropdown');
        if (!dropdown || !accountId) {
            return;
        }
        
        let html = '';
        
        // If account is 'new', only show "Add New Project" option
        if (accountId === 'new') {
            html = `<div class="search-select-create" onclick="Activities.showNewProjectFields()">+ Add New Project</div>`;
        } else {
            // For existing accounts, show all projects
            const accounts = DataManager.getAccounts();
            const account = accounts.find(a => a.id === accountId);
            const projects = account?.projects || [];
            
            projects.forEach(project => {
                html += `<div class="search-select-item" onclick="Activities.selectProject('${project.id}', '${project.name}')">${project.name}</div>`;
            });
            html += `<div class="search-select-create" onclick="Activities.showNewProjectFields()">+ Add New Project</div>`;
        }
        
        dropdown.innerHTML = html;
    },
    
    // Toggle project dropdown
    toggleProjectDropdown() {
        const accountId = document.getElementById('selectedAccountId').value;
        if (!accountId) {
            UI.showNotification('Please select an account first', 'error');
            return;
        }
        
        // For new accounts, ensure account name is entered
        if (accountId === 'new') {
            const accountName = document.getElementById('newAccountName')?.value;
            if (!accountName || !accountName.trim()) {
                UI.showNotification('Please enter an account name first', 'error');
                return;
            }
        }
        
        const dropdown = document.getElementById('projectDropdown');
        if (!dropdown) return;
        
        const isVisible = dropdown.style.display !== 'none';
        if (isVisible) {
            dropdown.style.display = 'none';
        } else {
            this.loadProjectDropdown();
            dropdown.style.display = 'block';
            dropdown.classList.add('active');
        }
    },
    
    // Show new project fields
    showNewProjectFields() {
        document.getElementById('projectDropdown').style.display = 'none';
        document.getElementById('selectedProjectId').value = 'new';
        document.getElementById('projectDisplay').textContent = 'New Project';
        document.getElementById('newProjectFields').style.display = 'block';
        document.getElementById('newProjectName').required = true;
    },
    
    // Search projects (legacy - kept for compatibility)
    searchProjects(query) {
        // This function is no longer used but kept for compatibility
        // Projects are now loaded via loadProjectDropdown()
        this.loadProjectDropdown();
    },

    selectProject(id, name) {
        document.getElementById('selectedProjectId').value = id;
        document.getElementById('projectDisplay').textContent = name;
        document.getElementById('projectDropdown').style.display = 'none';
        document.getElementById('newProjectFields').style.display = 'none';
        if (document.getElementById('newProjectName')) {
            document.getElementById('newProjectName').required = false;
        }
        
        // Load and pre-populate project data if existing project
        if (id && id !== 'new') {
            this.loadProjectData(id);
        } else {
            // Clear project fields for new project
            this.clearProjectFields();
        }
    },
    
    // Load project data and pre-populate fields
    loadProjectData(projectId) {
        const accountId = document.getElementById('selectedAccountId')?.value;
        if (!accountId || !projectId) return;
        
        const account = DataManager.getAccountById(accountId);
        if (!account || !account.projects) return;
        
        const project = account.projects.find(p => p.id === projectId);
        if (!project) return;
        
        // Pre-populate SFDC Link
        const sfdcLink = document.getElementById('sfdcLink');
        const noSfdcLink = document.getElementById('noSfdcLink');
        if (sfdcLink && noSfdcLink) {
            if (project.sfdcLink) {
                sfdcLink.value = project.sfdcLink;
                noSfdcLink.checked = false;
                sfdcLink.style.display = 'block';
            } else {
                noSfdcLink.checked = true;
                sfdcLink.style.display = 'none';
            }
        }
        
        // Pre-populate Use Cases
        if (project.useCases && project.useCases.length > 0) {
            this.selectedUseCases = [];
            project.useCases.forEach(uc => {
                if (uc.startsWith('Other: ')) {
                    this.selectedUseCases.push('Other');
                    const otherText = document.getElementById('useCaseOtherText');
                    if (otherText) {
                        otherText.value = uc.replace('Other: ', '');
                        otherText.style.display = 'block';
                    }
                } else {
                    this.selectedUseCases.push(uc);
                }
            });
            this.updateMultiSelectDisplay('useCaseSelected', this.selectedUseCases);
        }
        
        // Pre-populate Products Interested
        if (project.productsInterested && project.productsInterested.length > 0) {
            this.selectedProjectProducts = [];
            project.productsInterested.forEach(prod => {
                if (prod.startsWith('Other: ')) {
                    this.selectedProjectProducts.push('Other');
                    const otherText = document.getElementById('projectProductsOtherText');
                    if (otherText) {
                        otherText.value = prod.replace('Other: ', '');
                        otherText.style.display = 'block';
                    }
                } else {
                    this.selectedProjectProducts.push(prod);
                }
            });
            this.updateMultiSelectDisplay('projectProductsSelected', this.selectedProjectProducts);
        }
        
        // Pre-populate Channels
        if (project.channels && project.channels.length > 0) {
            this.selectedChannels = [];
            project.channels.forEach(ch => {
                if (ch.startsWith('Other: ')) {
                    this.selectedChannels.push('Other');
                    const otherText = document.getElementById('channelsOtherText');
                    if (otherText) {
                        otherText.value = ch.replace('Other: ', '');
                        otherText.style.display = 'block';
                    }
                } else {
                    this.selectedChannels.push(ch);
                }
            });
            this.updateMultiSelectDisplay('channelsSelected', this.selectedChannels);
        }
    },
    
    // Clear project fields for new project
    clearProjectFields() {
        // Clear SFDC
        const sfdcLink = document.getElementById('sfdcLink');
        const noSfdcLink = document.getElementById('noSfdcLink');
        if (sfdcLink) sfdcLink.value = '';
        if (noSfdcLink) noSfdcLink.checked = false;
        if (sfdcLink) sfdcLink.style.display = 'block';
        
        // Clear Use Cases
        this.selectedUseCases = [];
        const useCaseOtherText = document.getElementById('useCaseOtherText');
        if (useCaseOtherText) {
            useCaseOtherText.value = '';
            useCaseOtherText.style.display = 'none';
        }
        this.updateMultiSelectDisplay('useCaseSelected', []);
        
        // Clear Products
        this.selectedProjectProducts = [];
        const productsOtherText = document.getElementById('projectProductsOtherText');
        if (productsOtherText) {
            productsOtherText.value = '';
            productsOtherText.style.display = 'none';
        }
        this.updateMultiSelectDisplay('projectProductsSelected', []);
        
        // Clear Channels
        this.selectedChannels = [];
        const channelsOtherText = document.getElementById('channelsOtherText');
        if (channelsOtherText) {
            channelsOtherText.value = '';
            channelsOtherText.style.display = 'none';
        }
        this.updateMultiSelectDisplay('channelsSelected', []);
    },

    createNewProject(name) {
        // This is called when user types in new project name field
        document.getElementById('selectedProjectId').value = 'new';
        if (name) {
            document.getElementById('newProjectName').value = name;
        }
    },

    // Save activity (unified for Internal and External)
    saveActivity(event) {
        event.preventDefault();
        
        try {
            const currentUser = Auth.getCurrentUser();
            if (!currentUser) {
                UI.showNotification('User not authenticated', 'error');
                return;
            }
            
            const activityCategory = document.querySelector('input[name="activityCategory"]:checked')?.value;
            if (!activityCategory) {
                UI.showNotification('Please select activity category (Internal/External)', 'error');
                return;
            }
            
            // Remove required attributes from hidden fields to prevent validation errors
            const accountSection = document.getElementById('accountSection');
            const projectSection = document.getElementById('projectSection');
            
            if (activityCategory === 'internal') {
                // For internal, ALWAYS remove required from account/project fields (even if hidden)
                if (accountSection) {
                    // Remove required from all fields in account section
                    const accountFields = accountSection.querySelectorAll('[required], [data-was-required="true"]');
                    accountFields.forEach(field => {
                        field.removeAttribute('required');
                        field.setAttribute('data-was-required', 'true');
                    });
                    // Also clear values to prevent validation issues
                    const industrySelect = document.getElementById('industry');
                    const salesRepSelect = document.getElementById('salesRepSelect');
                    const accountDisplay = document.getElementById('accountDisplay');
                    if (industrySelect) industrySelect.value = '';
                    if (salesRepSelect) salesRepSelect.value = '';
                    if (accountDisplay) accountDisplay.textContent = 'Select account...';
                }
                if (projectSection) {
                    // Remove required from all fields in project section
                    const projectFields = projectSection.querySelectorAll('[required], [data-was-required="true"]');
                    projectFields.forEach(field => {
                        field.removeAttribute('required');
                        field.setAttribute('data-was-required', 'true');
                    });
                }
            } else {
                // For external, ensure account/project fields are required
                if (accountSection) {
                    const accountFields = accountSection.querySelectorAll('[data-was-required="true"]');
                    accountFields.forEach(field => {
                        // Only add required if field is visible (not in hidden section)
                        if (!accountSection.classList.contains('hidden')) {
                            field.setAttribute('required', 'required');
                        }
                    });
                }
                if (projectSection) {
                    const projectFields = projectSection.querySelectorAll('[data-was-required="true"]');
                    projectFields.forEach(field => {
                        // Only add required if field is visible (not in hidden section)
                        if (!projectSection.classList.contains('hidden')) {
                            field.setAttribute('required', 'required');
                        }
                    });
                }
            }
            
            const date = document.getElementById('activityDate').value;
            const activityType = document.getElementById('activityTypeSelect').value;
            
            if (!date || !activityType) {
                UI.showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            if (activityCategory === 'internal') {
                this.saveInternalActivityUnified(currentUser, date, activityType);
            } else {
                this.saveExternalActivityUnified(currentUser, date, activityType);
            }
        } catch (error) {
            console.error('Error saving activity:', error);
            UI.showNotification('Error saving activity: ' + error.message, 'error');
        }
    },

    // Save internal activity (unified)
    saveInternalActivityUnified(currentUser, date, activityType) {
        const timeSpentType = document.querySelector('input[name="timeSpentType"]:checked')?.value;
        const timeSpentValue = document.getElementById('timeSpentValue')?.value;
        
        let timeSpent = null;
        if (timeSpentType && timeSpentValue) {
            timeSpent = `${timeSpentValue} ${timeSpentType === 'day' ? 'day(s)' : 'hour(s)'}`;
        }
        
        const activityName = document.getElementById('internalActivityName')?.value || '';
        const topic = document.getElementById('internalTopic')?.value || '';
        const description = document.getElementById('internalDescription')?.value || '';
        
        const activity = {
            userId: currentUser.id,
            userName: currentUser.username,
            date: date,
            type: activityType,
            timeSpent: timeSpent,
            activityName: activityName,
            topic: topic,
            description: description,
            isInternal: true
        };
        
        DataManager.addInternalActivity(activity);
        
        UI.hideModal('activityModal');
        UI.showNotification('Internal activity logged successfully!', 'success');
        
        if (window.app) {
            window.app.loadDashboard();
            window.app.loadActivitiesView();
        }
    },

    // Save external activity (unified)
    saveExternalActivityUnified(currentUser, date, activityType) {
        // Get account information
        const accountIdEl = document.getElementById('selectedAccountId');
        const salesRepSelect = document.getElementById('salesRepSelect');
        const industryEl = document.getElementById('industry');
        const projectIdEl = document.getElementById('selectedProjectId');
        
        if (!accountIdEl || !salesRepSelect || !industryEl) {
            UI.showNotification('Please fill in all required account fields', 'error');
            return;
        }
        
        const accountId = accountIdEl.value;
        let accountName = document.getElementById('accountDisplay')?.textContent || '';
        if (accountId === 'new') {
            accountName = document.getElementById('newAccountName')?.value || '';
        }
        const industry = industryEl.value;
        
        // Get project info (now from Project Information section)
        const projectId = projectIdEl ? projectIdEl.value : '';
        let projectName = document.getElementById('projectDisplay')?.textContent || '';
        if (projectId === 'new') {
            projectName = document.getElementById('newProjectName')?.value || '';
        }
        
        if (!accountId || !accountName || !industry) {
            UI.showNotification('Please fill in all required account fields', 'error');
            return;
        }
        
        if (accountId === 'new' && !accountName.trim()) {
            UI.showNotification('Please enter an account name', 'error');
            return;
        }
        
        if (!projectId || (!projectName && projectId !== 'new')) {
            UI.showNotification('Please select or create a project', 'error');
            return;
        }
        
        if (projectId === 'new' && !projectName.trim()) {
            UI.showNotification('Please enter a project name', 'error');
            return;
        }
        
        // Handle sales rep (from dropdown only - no adding new)
        const selectedOption = salesRepSelect.options[salesRepSelect.selectedIndex];
        const salesRep = selectedOption ? selectedOption.getAttribute('data-name') || selectedOption.text : '';
        
        if (!salesRep || !salesRepSelect.value) {
            UI.showNotification('Please select a sales rep', 'error');
            return;
        }
        
        // Create or get account
        let finalAccountId = accountId;
        if (accountId === 'new') {
            const newAccount = DataManager.addAccount({
                name: accountName,
                industry: industry,
                salesRep: salesRep,
                createdBy: currentUser.id
            });
            finalAccountId = newAccount.id;
        } else {
            // Update account with sales rep if changed
            const account = DataManager.getAccountById(accountId);
            if (account && (account.salesRep !== salesRep || account.industry !== industry)) {
                DataManager.updateAccount(accountId, {
                    salesRep: salesRep,
                    industry: industry
                });
            }
        }
        
        // Get project information
        const noSfdcLink = document.getElementById('noSfdcLink')?.checked || false;
        const sfdcLink = noSfdcLink ? '' : (document.getElementById('sfdcLink')?.value || '');
        
        // Get use cases (handle Other)
        let useCases = [...this.selectedUseCases];
        const useCaseOtherText = document.getElementById('useCaseOtherText')?.value;
        if (useCases.includes('Other') && useCaseOtherText) {
            const otherIndex = useCases.indexOf('Other');
            useCases[otherIndex] = `Other: ${useCaseOtherText}`;
        }
        
        // Get project products (handle Other) - Required for external activities
        let projectProducts = this.getProjectProductsWithOther();
        
        // Get channels (handle Other) - Required for external activities
        let projectChannels = this.getChannelsWithOther();
        
        // Validate project products (required for external)
        if (projectProducts.length === 0) {
            UI.showNotification('Please select at least one product interested for the project', 'error');
            return;
        }
        
        // Validate channels (required for external)
        if (projectChannels.length === 0) {
            UI.showNotification('Please select at least one channel for the project', 'error');
            return;
        }
        
        // Create or get project
        let finalProjectId = projectId;
        if (projectId === 'new' && projectName) {
            const newProject = DataManager.addProject(finalAccountId, {
                name: projectName,
                sfdcLink: sfdcLink,
                useCases: useCases,
                productsInterested: projectProducts,
                channels: projectChannels,
                createdBy: currentUser.id
            });
            finalProjectId = newProject.id;
        } else if (projectId && projectId !== 'new') {
            // Update existing project if SFDC link, use cases, products, or channels changed
            const accounts = DataManager.getAccounts();
            const account = accounts.find(a => a.id === finalAccountId);
            const project = account?.projects?.find(p => p.id === projectId);
            if (project) {
                if (sfdcLink) project.sfdcLink = sfdcLink;
                if (useCases.length > 0) project.useCases = useCases;
                if (projectProducts.length > 0) project.productsInterested = projectProducts;
                if (projectChannels.length > 0) project.channels = projectChannels;
                DataManager.saveAccounts(accounts);
            }
        }
        
        // Create activity based on type
        const activity = {
            userId: currentUser.id,
            userName: currentUser.username,
            accountId: finalAccountId,
            accountName: accountName,
            projectId: finalProjectId || null,
            projectName: projectName || null,
            date: date,
            type: activityType,
            salesRep: salesRep,
            industry: industry,
            details: {}
        };
        
        // Add type-specific details
        if (activityType === 'customerCall') {
            const callDescription = document.getElementById('callDescription')?.value || '';
            if (!callDescription.trim()) {
                UI.showNotification('Description / MOM is required for Customer Call activities', 'error');
                return;
            }
            activity.details = {
                callType: document.getElementById('callType')?.value || '',
                description: callDescription
            };
        } else if (activityType === 'sow') {
            activity.details = {
                sowLink: document.getElementById('sowLink')?.value || ''
            };
        } else if (activityType === 'poc') {
            const accessType = document.getElementById('accessType')?.value || '';
            activity.details = {
                accessType: accessType,
                useCaseDescription: document.getElementById('useCaseDescription')?.value || ''
            };
            
            if (accessType === 'Sandbox') {
                activity.details.startDate = document.getElementById('pocStartDate')?.value || '';
                activity.details.endDate = document.getElementById('pocEndDate')?.value || '';
                // POC Environment Name - default empty, admin can set later
                activity.details.pocEnvironmentName = '';
                activity.details.assignedStatus = 'Unassigned';
            } else if (accessType && accessType.startsWith('Custom POC')) {
                activity.details.demoEnvironment = document.getElementById('demoEnvironment')?.value || '';
                activity.details.botTriggerUrl = document.getElementById('botTriggerUrl')?.value || '';
            }
        } else if (activityType === 'rfx') {
            activity.details = {
                rfxType: document.getElementById('rfxType')?.value || '',
                submissionDeadline: document.getElementById('submissionDeadline')?.value || '',
                googleFolderLink: document.getElementById('googleFolderLink')?.value || '',
                notes: document.getElementById('rfxNotes')?.value || ''
            };
        } else if (activityType === 'pricing') {
            // No details for pricing
            activity.details = {};
        }
        
        // Save activity
        DataManager.addActivity(activity);
        
        // Also save to project if project exists
        if (finalProjectId && finalProjectId !== 'new') {
            const accounts = DataManager.getAccounts();
            const account = accounts.find(a => a.id === finalAccountId);
            const project = account?.projects?.find(p => p.id === finalProjectId);
            if (project) {
                if (!project.activities) project.activities = [];
                project.activities.push(activity);
                DataManager.saveAccounts(accounts);
            }
        }
        
        UI.hideModal('activityModal');
        UI.showNotification('Activity logged successfully!', 'success');
        
        if (window.app) {
            window.app.loadDashboard();
            window.app.loadActivitiesView();
        }
    },

    // Get project products with Other text if applicable
    getProjectProductsWithOther() {
        let products = [...this.selectedProjectProducts];
        const productsOtherText = document.getElementById('projectProductsOtherText')?.value;
        if (products.includes('Other') && productsOtherText) {
            const otherIndex = products.indexOf('Other');
            products[otherIndex] = `Other: ${productsOtherText}`;
        }
        return products;
    },

    // Get channels with Other text if applicable
    getChannelsWithOther() {
        let channels = [...this.selectedChannels];
        const channelsOtherText = document.getElementById('channelsOtherText')?.value;
        if (channels.includes('Other') && channelsOtherText) {
            const otherIndex = channels.indexOf('Other');
            channels[otherIndex] = `Other: ${channelsOtherText}`;
        }
        return channels;
    },

    // Save customer activity (legacy - kept for compatibility)
    saveCustomerActivity(event) {
        event.preventDefault();
        
        try {
            const accountIdEl = document.getElementById('selectedAccountId');
            const accountSearchEl = document.getElementById('accountSearch');
            const projectIdEl = document.getElementById('selectedProjectId');
            const projectSearchEl = document.getElementById('projectSearch');
            
            if (!accountIdEl || !accountSearchEl) {
                UI.showNotification('Form elements not found. Please refresh the page.', 'error');
                console.error('Account form elements not found');
                return;
            }
            
            const accountId = accountIdEl.value;
            const accountName = accountSearchEl.value;
            const projectId = projectIdEl ? projectIdEl.value : '';
            const projectName = projectSearchEl ? projectSearchEl.value : '';
            
            if (!accountId || !accountName) {
                UI.showNotification('Please select or create an account', 'error');
                return;
            }
            
            const currentUser = Auth.getCurrentUser();
            if (!currentUser) {
                UI.showNotification('User not authenticated', 'error');
                return;
            }
            
            // Create or get account
            let finalAccountId = accountId;
            if (accountId === 'new') {
                const newAccount = DataManager.addAccount({
                    name: accountName,
                    industry: document.getElementById('industry').value,
                    salesRep: document.getElementById('salesRep').value,
                    createdBy: currentUser.id
                });
                finalAccountId = newAccount.id;
            }
            
            // Create or get project
            let finalProjectId = projectId;
            if (projectId === 'new' && projectName) {
                const newProject = DataManager.addProject(finalAccountId, {
                    name: projectName,
                    sfdcLink: document.getElementById('sfdcLink').value,
                    useCases: this.selectedUseCases,
                    createdBy: currentUser.id
                });
                finalProjectId = newProject.id;
            }
            
            // Create activity
            const activityTypeEl = document.getElementById('customerActivityType');
            if (!activityTypeEl || !activityTypeEl.value) {
                UI.showNotification('Please select an activity type', 'error');
                return;
            }
            
            const activityType = activityTypeEl.value;
            const activity = {
                userId: currentUser.id,
                userName: currentUser.username,
                accountId: finalAccountId,
                accountName: accountName,
                projectId: finalProjectId || null,
                projectName: projectName || null,
                date: document.getElementById('activityDate').value,
                type: activityType,
                salesRep: document.getElementById('salesRep').value,
                industry: document.getElementById('industry').value,
                customerType: document.getElementById('customerType')?.value || '',
                location: document.getElementById('location')?.value || '',
                participantCount: document.getElementById('participantCount')?.value || '',
                participantRoles: document.getElementById('participantRoles')?.value || '',
                details: {}
            };
            
            // Add type-specific details
            if (activityType === 'customerCall') {
                activity.details = {
                    callType: document.getElementById('callType')?.value || '',
                    duration: document.getElementById('callDuration')?.value || '',
                    // Products removed - now at project level
                    products: [],
                    channels: this.selectedChannels,
                    opportunityStatus: document.getElementById('opportunityStatus')?.value || '',
                    dealSize: document.getElementById('dealSize')?.value || '',
                    competitors: document.getElementById('competitors')?.value || '',
                    objectiveNextSteps: document.getElementById('objectiveNextSteps')?.value || ''
                };
            } else if (activityType === 'poc') {
                activity.details = {
                    accountType: document.getElementById('pocAccountType')?.value || '',
                    accessType: document.getElementById('accessType')?.value || '',
                    // Products removed - now at project level
                    products: [],
                    startDate: document.getElementById('pocStartDate')?.value || '',
                    endDate: document.getElementById('pocEndDate')?.value || '',
                    useCaseDescription: document.getElementById('useCaseDescription')?.value || '',
                    demoEnvironment: document.getElementById('demoEnvironment')?.value || '',
                    botTriggerUrl: document.getElementById('botTriggerUrl')?.value || ''
                };
            } else if (activityType === 'rfx') {
                activity.details = {
                    rfxType: document.getElementById('rfxType')?.value || '',
                    submissionDeadline: document.getElementById('submissionDeadline')?.value || '',
                    googleFolderLink: document.getElementById('googleFolderLink')?.value || '',
                    notes: document.getElementById('rfxNotes')?.value || ''
                };
            }
            
            // Save activity
            DataManager.addActivity(activity);
            
            // Also save to project if project exists
            if (finalProjectId && finalProjectId !== 'new') {
                const accounts = DataManager.getAccounts();
                const account = accounts.find(a => a.id === finalAccountId);
                const project = account?.projects?.find(p => p.id === finalProjectId);
                if (project) {
                    if (!project.activities) project.activities = [];
                    project.activities.push(activity);
                    DataManager.saveAccounts(accounts);
                }
            }
            
            UI.hideModal('customerActivityModal');
            this.resetCustomerActivityForm();
            UI.showNotification('Customer activity logged successfully!', 'success');
            
            // Reload views
            if (window.app) {
                window.app.loadDashboard();
                window.app.loadActivitiesView();
            }
        } catch (error) {
            console.error('Error saving customer activity:', error);
            UI.showNotification('Error saving activity: ' + error.message, 'error');
        }
    },

    // Save internal activity
    saveInternalActivity(event) {
        event.preventDefault();
        
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) {
            UI.showNotification('User not authenticated', 'error');
            return;
        }
        
        const activity = {
            userId: currentUser.id,
            userName: currentUser.username,
            date: document.getElementById('internalDate').value,
            type: document.getElementById('internalActivityType').value,
            timeSpent: document.getElementById('internalTimeSpent').value,
            topic: document.getElementById('internalTopic').value
        };
        
        DataManager.addInternalActivity(activity);
        
        UI.hideModal('internalActivityModal');
        UI.showNotification('Internal activity logged successfully!', 'success');
        
        // Reload views
        if (window.app) {
            window.app.loadDashboard();
            window.app.loadActivitiesView();
        }
    },

    // Set activity category (Internal/External)
    setActivityCategory(category) {
        this.activityType = category;
        const accountSection = document.getElementById('accountSection');
        const projectSection = document.getElementById('projectSection');
        const activityTypeSelect = document.getElementById('activityTypeSelect');
        
        if (category === 'internal') {
            // Hide Account and Project sections for Internal
            if (accountSection) {
                accountSection.classList.add('hidden');
                // Remove required from all fields in account section
                const accountFields = accountSection.querySelectorAll('[required], [data-was-required="true"]');
                accountFields.forEach(field => {
                    field.removeAttribute('required');
                    field.setAttribute('data-was-required', 'true');
                });
                // Clear values
                const industrySelect = document.getElementById('industry');
                const salesRepSelect = document.getElementById('salesRepSelect');
                const accountDisplay = document.getElementById('accountDisplay');
                if (industrySelect) industrySelect.value = '';
                if (salesRepSelect) salesRepSelect.value = '';
                if (accountDisplay) accountDisplay.textContent = 'Select account...';
            }
            if (projectSection) {
                projectSection.classList.add('hidden');
                // Remove required from all fields in project section
                const projectFields = projectSection.querySelectorAll('[required], [data-was-required="true"]');
                projectFields.forEach(field => {
                    field.removeAttribute('required');
                    field.setAttribute('data-was-required', 'true');
                });
            }
            
            // Populate Internal activity types
            if (activityTypeSelect) {
                activityTypeSelect.innerHTML = `
                    <option value="">Select Activity Type</option>
                    <option value="Enablement">Enablement</option>
                    <option value="Video Creation">Video Creation</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Event/Booth Hosting">Event/Booth Hosting</option>
                    <option value="Product Feedback">Product Feedback</option>
                    <option value="Content Creation">Content Creation</option>
                    <option value="Training">Training</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Internal Meeting">Internal Meeting</option>
                    <option value="Other">Other</option>
                `;
            }
        } else {
            // Show Account and Project sections for External
            if (accountSection) {
                accountSection.classList.remove('hidden');
                // Restore required attributes
                const accountFields = accountSection.querySelectorAll('[data-was-required="true"]');
                accountFields.forEach(field => {
                    field.setAttribute('required', 'required');
                });
            }
            if (projectSection) {
                projectSection.classList.remove('hidden');
                // Restore required attributes
                const projectFields = projectSection.querySelectorAll('[data-was-required="true"]');
                projectFields.forEach(field => {
                    field.setAttribute('required', 'required');
                });
            }
            
            // Populate External activity types
            if (activityTypeSelect) {
                activityTypeSelect.innerHTML = `
                    <option value="">Select Activity Type</option>
                    <option value="customerCall">Customer Call</option>
                    <option value="sow">SOW (Statement of Work)</option>
                    <option value="poc">POC (Proof of Concept)</option>
                    <option value="rfx">RFx</option>
                    <option value="pricing">Pricing</option>
                `;
            }
        }
        
        // Clear activity fields when category changes
        const activityFields = document.getElementById('activityFields');
        if (activityFields) activityFields.innerHTML = '';
    },

    // Toggle SFDC link field
    toggleSfdcLink() {
        const checkbox = document.getElementById('noSfdcLink');
        const sfdcInput = document.getElementById('sfdcLink');
        if (checkbox && sfdcInput) {
            if (checkbox.checked) {
                sfdcInput.style.display = 'none';
                sfdcInput.value = '';
            } else {
                sfdcInput.style.display = 'block';
            }
        }
    },

    // Toggle Use Case Other text field
    toggleUseCaseOther() {
        const checkbox = document.getElementById('useCaseOtherCheck');
        const textInput = document.getElementById('useCaseOtherText');
        if (checkbox && textInput) {
            if (checkbox.checked) {
                textInput.style.display = 'block';
                textInput.required = true;
                if (!this.selectedUseCases.includes('Other')) {
                    this.selectedUseCases.push('Other');
                }
            } else {
                textInput.style.display = 'none';
                textInput.value = '';
                textInput.required = false;
                this.selectedUseCases = this.selectedUseCases.filter(uc => uc !== 'Other');
            }
            this.updateMultiSelectDisplay('useCaseSelected', this.selectedUseCases);
        }
    },

    // Handle sales rep dropdown change
    handleSalesRepChange() {
        const select = document.getElementById('salesRepSelect');
        const newFields = document.getElementById('newSalesRepFields');
        
        if (!select || !newFields) return;
        
        if (select.value === '__new__') {
            newFields.style.display = 'block';
            document.getElementById('newSalesRepName').required = true;
            document.getElementById('newSalesRepEmail').required = true;
            document.getElementById('newSalesRepRegion').required = true;
            // Clear fields
            document.getElementById('newSalesRepName').value = '';
            document.getElementById('newSalesRepEmail').value = '';
            document.getElementById('newSalesRepRegion').value = '';
        } else {
            newFields.style.display = 'none';
            document.getElementById('newSalesRepName').required = false;
            document.getElementById('newSalesRepEmail').required = false;
            document.getElementById('newSalesRepRegion').required = false;
        }
    },

    // Reset activity form
    resetActivityForm() {
        this.activityType = null;
        this.selectedUseCases = [];
        this.selectedChannels = [];
        this.selectedProjectProducts = [];
        
        const form = document.getElementById('activityForm');
        if (form) form.reset();
        
        // Reset all sections
        const accountSection = document.getElementById('accountSection');
        const projectSection = document.getElementById('projectSection');
        if (accountSection) accountSection.classList.add('hidden');
        if (projectSection) projectSection.classList.add('hidden');
        
        const activityFields = document.getElementById('activityFields');
        if (activityFields) activityFields.innerHTML = '';
        
        // Reset radio buttons
        const radios = document.querySelectorAll('input[name="activityCategory"]');
        radios.forEach(radio => radio.checked = false);
        
        // Set default date
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('activityDate');
        if (dateInput) dateInput.value = today;
    },

    // Reset customer activity form (legacy)
    resetCustomerActivityForm() {
        const form = document.getElementById('customerActivityForm');
        if (form) form.reset();
        
        const selectedAccountId = document.getElementById('selectedAccountId');
        if (selectedAccountId) selectedAccountId.value = '';
        
        const selectedProjectId = document.getElementById('selectedProjectId');
        if (selectedProjectId) selectedProjectId.value = '';
        
        const projectSearch = document.getElementById('projectSearch');
        if (projectSearch) {
            projectSearch.disabled = true;
            projectSearch.placeholder = 'Select account first...';
        }
        
        const customerActivityFields = document.getElementById('customerActivityFields');
        if (customerActivityFields) customerActivityFields.innerHTML = '';
        
        this.selectedUseCases = [];
        this.selectedChannels = [];
        
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('activityDate');
        if (dateInput) dateInput.value = today;
    },

    // Helper functions
    toggleDealSize() {
        const status = document.getElementById('opportunityStatus').value;
        const group = document.getElementById('dealSizeGroup');
        if (group) {
            group.classList.toggle('d-none', status !== 'yes');
        }
    },

    setPOCEndDate() {
        const startDate = document.getElementById('pocStartDate').value;
        if (startDate) {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);
            const endDateInput = document.getElementById('pocEndDate');
            if (endDateInput) {
                endDateInput.value = endDate.toISOString().split('T')[0];
            }
        }
    }
};

// Expose Activities globally for onclick handlers
window.Activities = Activities;

