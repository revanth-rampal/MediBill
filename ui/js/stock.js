// Stock/Inventory Page JavaScript
class StockManager {
    constructor() {
        this.medicines = [];
        this.currentMedicine = null;
        this.isEditing = false;
        
        this.initializeEventListeners();
        this.loadStock();
        this.loadFilterOptions();
    }

    initializeEventListeners() {
        // Add medicine button
        document.getElementById('addMedicineBtn').addEventListener('click', () => {
            this.showAddMedicineModal();
        });

        // Search functionality
        document.getElementById('stockSearch').addEventListener('input', (e) => {
            this.filterStock();
        });

        // Filter dropdowns
        document.getElementById('companyFilter').addEventListener('change', () => {
            this.filterStock();
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterStock();
        });

        document.getElementById('expiryFilter').addEventListener('change', () => {
            this.filterStock();
        });

        // Medicine form submission
        document.getElementById('medicineForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMedicine();
        });

        // Cancel button
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideMedicineModal();
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    async loadStock() {
        try {
            // This would typically fetch from backend
            // For demo, using localStorage with some mock data
            let medicines = JSON.parse(localStorage.getItem('medBillStock') || '[]');
            
            // Add some mock data if empty
            if (medicines.length === 0) {
                medicines = [
                    {
                        id: 1,
                        name: 'Paracetamol 500mg',
                        code: 'PCM500',
                        batch: 'PCM001',
                        expiry: '2024-12-31',
                        stock: 150,
                        unit: 'tablet',
                        mrp: 2.50,
                        cost: 1.80,
                        company: 'ABC Pharma',
                        category: 'tablet',
                        description: 'Pain relief and fever reducer'
                    },
                    {
                        id: 2,
                        name: 'Amoxicillin 250mg',
                        code: 'AMX250',
                        batch: 'AMX001',
                        expiry: '2024-06-30',
                        stock: 5,
                        unit: 'strip',
                        mrp: 45.00,
                        cost: 32.00,
                        company: 'XYZ Pharma',
                        category: 'tablet',
                        description: 'Antibiotic'
                    },
                    {
                        id: 3,
                        name: 'Cough Syrup',
                        code: 'CS100',
                        batch: 'CS001',
                        expiry: '2024-03-15',
                        stock: 25,
                        unit: 'bottle',
                        mrp: 85.00,
                        cost: 65.00,
                        company: 'DEF Pharma',
                        category: 'syrup',
                        description: 'Cough suppressant'
                    },
                    {
                        id: 4,
                        name: 'Aspirin 75mg',
                        code: 'ASP75',
                        batch: 'ASP001',
                        expiry: '2023-12-31',
                        stock: 80,
                        unit: 'tablet',
                        mrp: 1.25,
                        cost: 0.90,
                        company: 'ABC Pharma',
                        category: 'tablet',
                        description: 'Blood thinner'
                    }
                ];
                localStorage.setItem('medBillStock', JSON.stringify(medicines));
            }
            
            this.medicines = medicines;
            this.updateStockTable();
        } catch (error) {
            console.error('Error loading stock:', error);
            alert('Error loading stock. Please try again.');
        }
    }

    loadFilterOptions() {
        // Load unique companies and categories for filters
        const companies = [...new Set(this.medicines.map(m => m.company))];
        const categories = [...new Set(this.medicines.map(m => m.category))];

        const companyFilter = document.getElementById('companyFilter');
        const categoryFilter = document.getElementById('categoryFilter');

        // Clear existing options (except "All")
        companyFilter.innerHTML = '<option value="">All Companies</option>';
        categoryFilter.innerHTML = '<option value="">All Categories</option>';

        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company;
            option.textContent = company;
            companyFilter.appendChild(option);
        });

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryFilter.appendChild(option);
        });
    }

    updateStockTable(medicinesToShow = this.medicines) {
        const tbody = document.getElementById('stockTableBody');
        tbody.innerHTML = '';

        medicinesToShow.forEach(medicine => {
            const row = document.createElement('tr');
            const status = this.getStockStatus(medicine);
            
            // Add row classes based on status
            if (status === 'Low Stock') {
                row.classList.add('row-low-stock');
            } else if (status === 'Expired') {
                row.classList.add('row-expired');
            } else if (status === 'Expiring Soon') {
                row.classList.add('row-expiring');
            }

            row.innerHTML = `
                <td>${medicine.name}</td>
                <td>${medicine.batch}</td>
                <td>${medicine.expiry}</td>
                <td>${medicine.stock}</td>
                <td>${medicine.unit}</td>
                <td>₹${medicine.mrp.toFixed(2)}</td>
                <td>${medicine.company}</td>
                <td>${medicine.category.charAt(0).toUpperCase() + medicine.category.slice(1)}</td>
                <td><span class="status-badge ${this.getStatusClass(status)}">${status}</span></td>
                <td class="actions">
                    <button class="btn btn-primary btn-sm" onclick="stockManager.editMedicine(${medicine.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="stockManager.deleteMedicine(${medicine.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getStockStatus(medicine) {
        const today = new Date();
        const expiryDate = new Date(medicine.expiry);
        const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (daysToExpiry < 0) {
            return 'Expired';
        } else if (daysToExpiry <= 30) {
            return 'Expiring Soon';
        } else if (medicine.stock <= 10) {
            return 'Low Stock';
        } else {
            return 'In Stock';
        }
    }

    getStatusClass(status) {
        switch (status) {
            case 'In Stock':
                return 'status-active';
            case 'Low Stock':
                return 'status-low';
            case 'Expired':
                return 'status-expired';
            case 'Expiring Soon':
                return 'status-expiring';
            default:
                return '';
        }
    }

    filterStock() {
        const searchTerm = document.getElementById('stockSearch').value.toLowerCase();
        const companyFilter = document.getElementById('companyFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const expiryFilter = document.getElementById('expiryFilter').value;

        let filteredMedicines = this.medicines.filter(medicine => {
            const matchesSearch = medicine.name.toLowerCase().includes(searchTerm) ||
                                medicine.code.toLowerCase().includes(searchTerm) ||
                                medicine.batch.toLowerCase().includes(searchTerm);
            
            const matchesCompany = !companyFilter || medicine.company === companyFilter;
            const matchesCategory = !categoryFilter || medicine.category === categoryFilter;
            
            let matchesExpiry = true;
            if (expiryFilter === 'expired') {
                matchesExpiry = this.getStockStatus(medicine) === 'Expired';
            } else if (expiryFilter === 'expiring') {
                matchesExpiry = this.getStockStatus(medicine) === 'Expiring Soon';
            }

            return matchesSearch && matchesCompany && matchesCategory && matchesExpiry;
        });

        this.updateStockTable(filteredMedicines);
    }

    showAddMedicineModal() {
        this.isEditing = false;
        this.currentMedicine = null;
        document.getElementById('modalTitle').textContent = 'Add Medicine';
        document.getElementById('medicineForm').reset();
        document.getElementById('medicineFormModal').style.display = 'block';
    }

    editMedicine(id) {
        const medicine = this.medicines.find(m => m.id === id);
        if (medicine) {
            this.isEditing = true;
            this.currentMedicine = medicine;
            document.getElementById('modalTitle').textContent = 'Edit Medicine';
            
            // Populate form
            document.getElementById('medicineName').value = medicine.name;
            document.getElementById('medicineCode').value = medicine.code || '';
            document.getElementById('batchNo').value = medicine.batch;
            document.getElementById('expiryDate').value = medicine.expiry;
            document.getElementById('stockQty').value = medicine.stock;
            document.getElementById('unit').value = medicine.unit;
            document.getElementById('mrp').value = medicine.mrp;
            document.getElementById('costPrice').value = medicine.cost || '';
            document.getElementById('company').value = medicine.company;
            document.getElementById('category').value = medicine.category;
            document.getElementById('description').value = medicine.description || '';
            
            document.getElementById('medicineFormModal').style.display = 'block';
        }
    }

    async deleteMedicine(id) {
        if (confirm('Are you sure you want to delete this medicine?')) {
            try {
                this.medicines = this.medicines.filter(m => m.id !== id);
                localStorage.setItem('medBillStock', JSON.stringify(this.medicines));
                this.updateStockTable();
                this.loadFilterOptions();
                alert('Medicine deleted successfully!');
            } catch (error) {
                console.error('Error deleting medicine:', error);
                alert('Error deleting medicine. Please try again.');
            }
        }
    }

    async saveMedicine() {
        try {
            const formData = new FormData(document.getElementById('medicineForm'));
            const medicineData = {
                name: formData.get('name').trim(),
                code: formData.get('code').trim(),
                batch: formData.get('batch').trim(),
                expiry: formData.get('expiry'),
                stock: parseInt(formData.get('stock')),
                unit: formData.get('unit'),
                mrp: parseFloat(formData.get('mrp')),
                cost: parseFloat(formData.get('cost')) || 0,
                company: formData.get('company').trim(),
                category: formData.get('category'),
                description: formData.get('description').trim()
            };

            // Validation
            if (!medicineData.name || !medicineData.batch || !medicineData.expiry || 
                !medicineData.stock || !medicineData.mrp || !medicineData.company) {
                alert('Please fill all required fields');
                return;
            }

            // Check for duplicate batch number
            const existingMedicine = this.medicines.find(m => 
                m.batch === medicineData.batch && 
                (!this.isEditing || m.id !== this.currentMedicine.id)
            );
            
            if (existingMedicine) {
                alert('A medicine with this batch number already exists');
                return;
            }

            if (this.isEditing) {
                // Update existing medicine
                const index = this.medicines.findIndex(m => m.id === this.currentMedicine.id);
                this.medicines[index] = {
                    ...this.currentMedicine,
                    ...medicineData
                };
            } else {
                // Add new medicine
                const newMedicine = {
                    id: Date.now(),
                    ...medicineData
                };
                this.medicines.push(newMedicine);
            }

            // Save to localStorage
            localStorage.setItem('medBillStock', JSON.stringify(this.medicines));
            
            this.updateStockTable();
            this.loadFilterOptions();
            this.hideMedicineModal();
            
            alert(this.isEditing ? 'Medicine updated successfully!' : 'Medicine added successfully!');
        } catch (error) {
            console.error('Error saving medicine:', error);
            alert('Error saving medicine. Please try again.');
        }
    }

    hideMedicineModal() {
        document.getElementById('medicineFormModal').style.display = 'none';
        document.getElementById('medicineForm').reset();
        this.currentMedicine = null;
        this.isEditing = false;
    }
}

// Initialize stock manager when page loads
let stockManager;
document.addEventListener('DOMContentLoaded', () => {
    stockManager = new StockManager();
});