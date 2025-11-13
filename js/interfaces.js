// Interface Management Module

const InterfaceManager = {
    currentInterface: 'modern',

    init() {
        // Load saved interface preference
        const saved = localStorage.getItem('interfacePreference');
        if (saved) {
            this.currentInterface = saved;
        }
        this.applyInterface(this.currentInterface);
    },

    // Change interface (admin only)
    changeInterface(interfaceType) {
        if (!Auth.isAdmin()) {
            UI.showNotification('Only admins can change interface preference', 'error');
            return;
        }

        this.currentInterface = interfaceType;
        localStorage.setItem('interfacePreference', interfaceType);
        this.applyInterface(interfaceType);
        UI.showNotification('Interface preference updated', 'success');
    },

    // Apply interface style
    applyInterface(interfaceType) {
        const body = document.body;
        
        // Remove all interface classes
        body.classList.remove('interface-modern', 'interface-compact', 'interface-dashboard', 'interface-minimal');
        
        // Add current interface class
        body.classList.add(`interface-${interfaceType}`);
        
        // Update select if exists
        const select = document.getElementById('interfaceSelect');
        if (select) {
            select.value = interfaceType;
        }
    },

    // Get current interface
    getCurrentInterface() {
        return this.currentInterface;
    }
};

