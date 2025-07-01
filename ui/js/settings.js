// Settings Page JavaScript
class SettingsManager {
    constructor() {
        this.settings = {};
        
        this.initializeEventListeners();
        this.loadSettings();
    }

    initializeEventListeners() {
        // Logo upload
        document.getElementById('logoUpload').addEventListener('change', (e) => {
            this.handleLogoUpload(e);
        });

        // Loyalty program toggle
        document.getElementById('loyaltyEnabled').addEventListener('change', (e) => {
            this.toggleLoyaltyOptions(e.target.checked);
        });

        // Save settings button
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveAllSettings();
        });

        // Reset settings button
        document.getElementById('resetSettingsBtn').addEventListener('click', () => {
            this.resetSettings();
        });
    }

    async loadSettings() {
        try {
            // Load settings from localStorage (would be from backend in real app)
            this.settings = JSON.parse(localStorage.getItem('medBillSettings') || '{}');
            
            // Set default values if not present
            const defaults = {
                storeName: 'MedBill Pro',
                storePhone: '',
                storeAddress: '',
                upiId: '',
                gstEnabled: true,
                loyaltyEnabled: false,
                visitThreshold: 5,
                spendThreshold: 1000,
                discountType: 'percentage',
                discountValue: 10,
                lowStockAlert: true,
                lowStockThreshold: 10,
                expiryAlert: true,
                expiryDays: 30
            };

            this.settings = { ...defaults, ...this.settings };
            this.populateForm();
        } catch (error) {
            console.error('Error loading settings:', error);
            alert('Error loading settings. Please try again.');
        }
    }

    populateForm() {
        // Store Information
        document.getElementById('storeName').value = this.settings.storeName || '';
        document.getElementById('storePhone').value = this.settings.storePhone || '';
        document.getElementById('storeAddress').value = this.settings.storeAddress || '';

        // Payment Settings
        document.getElementById('upiId').value = this.settings.upiId || '';
        document.getElementById('gstEnabled').checked = this.settings.gstEnabled || false;

        // Loyalty Program Settings
        document.getElementById('loyaltyEnabled').checked = this.settings.loyaltyEnabled || false;
        document.getElementById('visitThreshold').value = this.settings.visitThreshold || 5;
        document.getElementById('spendThreshold').value = this.settings.spendThreshold || 1000;
        document.getElementById('discountType').value = this.settings.discountType || 'percentage';
        document.getElementById('discountValue').value = this.settings.discountValue || 10;

        // Notification Settings
        document.getElementById('lowStockAlert').checked = this.settings.lowStockAlert !== false;
        document.getElementById('lowStockThreshold').value = this.settings.lowStockThreshold || 10;
        document.getElementById('expiryAlert').checked = this.settings.expiryAlert !== false;
        document.getElementById('expiryDays').value = this.settings.expiryDays || 30;

        // Toggle loyalty options visibility
        this.toggleLoyaltyOptions(this.settings.loyaltyEnabled);

        // Load logo if exists
        if (this.settings.logoData) {
            this.displayLogo(this.settings.logoData);
        }
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size should be less than 2MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const logoData = e.target.result;
                this.displayLogo(logoData);
                this.settings.logoData = logoData;
            };
            reader.readAsDataURL(file);
        }
    }

    displayLogo(logoData) {
        const logoPreview = document.getElementById('logoPreview');
        logoPreview.innerHTML = `
            <img src="${logoData}" alt="Store Logo" style="max-width: 200px; max-height: 100px; border: 1px solid #ddd; border-radius: 4px;">
            <br>
            <button type="button" class="btn btn-danger btn-sm" style="margin-top: 10px;" onclick="settingsManager.removeLogo()">Remove Logo</button>
        `;
    }

    removeLogo() {
        document.getElementById('logoPreview').innerHTML = '';
        document.getElementById('logoUpload').value = '';
        delete this.settings.logoData;
    }

    toggleLoyaltyOptions(enabled) {
        const loyaltyOptions = document.getElementById('loyaltyOptions');
        loyaltyOptions.style.display = enabled ? 'block' : 'none';
    }

    async saveAllSettings() {
        try {
            // Collect all form data
            const formData = {
                // Store Information
                storeName: document.getElementById('storeName').value.trim(),
                storePhone: document.getElementById('storePhone').value.trim(),
                storeAddress: document.getElementById('storeAddress').value.trim(),

                // Payment Settings
                upiId: document.getElementById('upiId').value.trim(),
                gstEnabled: document.getElementById('gstEnabled').checked,

                // Loyalty Program Settings
                loyaltyEnabled: document.getElementById('loyaltyEnabled').checked,
                visitThreshold: parseInt(document.getElementById('visitThreshold').value) || 5,
                spendThreshold: parseFloat(document.getElementById('spendThreshold').value) || 1000,
                discountType: document.getElementById('discountType').value,
                discountValue: parseFloat(document.getElementById('discountValue').value) || 10,

                // Notification Settings
                lowStockAlert: document.getElementById('lowStockAlert').checked,
                lowStockThreshold: parseInt(document.getElementById('lowStockThreshold').value) || 10,
                expiryAlert: document.getElementById('expiryAlert').checked,
                expiryDays: parseInt(document.getElementById('expiryDays').value) || 30
            };

            // Validation
            if (!formData.storeName) {
                alert('Store name is required');
                return;
            }

            if (formData.loyaltyEnabled) {
                if (formData.visitThreshold < 1 || formData.spendThreshold < 0 || formData.discountValue <= 0) {
                    alert('Please enter valid loyalty program values');
                    return;
                }

                if (formData.discountType === 'percentage' && formData.discountValue > 100) {
                    alert('Percentage discount cannot be more than 100%');
                    return;
                }
            }

            // Merge with existing settings (including logo data)
            this.settings = { ...this.settings, ...formData };

            // Save to localStorage (would be sent to backend in real app)
            localStorage.setItem('medBillSettings', JSON.stringify(this.settings));

            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings. Please try again.');
        }
    }

    async resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
            try {
                // Clear localStorage
                localStorage.removeItem('medBillSettings');
                
                // Reset form
                this.settings = {};
                await this.loadSettings();
                
                alert('Settings reset to default values successfully!');
            } catch (error) {
                console.error('Error resetting settings:', error);
                alert('Error resetting settings. Please try again.');
            }
        }
    }

    // Method to get current settings (can be used by other modules)
    getSettings() {
        return this.settings;
    }

    // Method to get specific setting
    getSetting(key, defaultValue = null) {
        return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
    }
}

// Initialize settings manager when page loads
let settingsManager;
document.addEventListener('DOMContentLoaded', () => {
    settingsManager = new SettingsManager();
});