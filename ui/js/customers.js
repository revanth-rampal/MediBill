// Customers Page JavaScript
class CustomersManager {
    constructor() {
        this.customers = [];
        this.currentCustomer = null;
        this.isEditing = false;
        
        this.initializeEventListeners();
        this.loadCustomers();
    }

    initializeEventListeners() {
        // Add customer button
        document.getElementById('addCustomerBtn').addEventListener('click', () => {
            this.showAddCustomerModal();
        });

        // Search functionality
        document.getElementById('customerSearch').addEventListener('input', (e) => {
            this.filterCustomers(e.target.value);
        });

        // Customer form submission
        document.getElementById('customerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomer();
        });

        // Cancel button
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideCustomerModal();
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

    async loadCustomers() {
        try {
            // This would typically fetch from backend
            // For demo, using localStorage with some mock data
            let customers = JSON.parse(localStorage.getItem('medBillCustomers') || '[]');
            
            // Add some mock data if empty
            if (customers.length === 0) {
                customers = [
                    {
                        id: 1,
                        name: 'John Doe',
                        phone: '9876543210',
                        email: 'john@example.com',
                        address: '123 Main St, City',
                        dob: '1985-06-15',
                        totalVisits: 8,
                        totalSpent: 2500,
                        lastVisit: '2024-01-15'
                    },
                    {
                        id: 2,
                        name: 'Jane Smith',
                        phone: '9876543211',
                        email: 'jane@example.com',
                        address: '456 Oak Ave, City',
                        dob: '1990-03-22',
                        totalVisits: 3,
                        totalSpent: 800,
                        lastVisit: '2024-01-10'
                    },
                    {
                        id: 3,
                        name: 'Bob Johnson',
                        phone: '9876543212',
                        email: 'bob@example.com',
                        address: '789 Pine Rd, City',
                        dob: '1978-11-08',
                        totalVisits: 12,
                        totalSpent: 4200,
                        lastVisit: '2024-01-18'
                    }
                ];
                localStorage.setItem('medBillCustomers', JSON.stringify(customers));
            }
            
            this.customers = customers;
            this.updateCustomersTable();
        } catch (error) {
            console.error('Error loading customers:', error);
            alert('Error loading customers. Please try again.');
        }
    }

    updateCustomersTable() {
        const tbody = document.getElementById('customersTableBody');
        tbody.innerHTML = '';

        this.customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.name}</td>
                <td>${customer.phone}</td>
                <td>${customer.email || '-'}</td>
                <td>${customer.totalVisits}</td>
                <td>₹${customer.totalSpent.toFixed(2)}</td>
                <td>${customer.lastVisit}</td>
                <td class="actions">
                    <button class="btn btn-primary btn-sm" onclick="customersManager.editCustomer(${customer.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="customersManager.deleteCustomer(${customer.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    filterCustomers(searchTerm) {
        const filteredCustomers = this.customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const tbody = document.getElementById('customersTableBody');
        tbody.innerHTML = '';

        filteredCustomers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.name}</td>
                <td>${customer.phone}</td>
                <td>${customer.email || '-'}</td>
                <td>${customer.totalVisits}</td>
                <td>₹${customer.totalSpent.toFixed(2)}</td>
                <td>${customer.lastVisit}</td>
                <td class="actions">
                    <button class="btn btn-primary btn-sm" onclick="customersManager.editCustomer(${customer.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="customersManager.deleteCustomer(${customer.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    showAddCustomerModal() {
        this.isEditing = false;
        this.currentCustomer = null;
        document.getElementById('modalTitle').textContent = 'Add Customer';
        document.getElementById('customerForm').reset();
        document.getElementById('customerFormModal').style.display = 'block';
    }

    editCustomer(id) {
        const customer = this.customers.find(c => c.id === id);
        if (customer) {
            this.isEditing = true;
            this.currentCustomer = customer;
            document.getElementById('modalTitle').textContent = 'Edit Customer';
            
            // Populate form
            document.getElementById('customerName').value = customer.name;
            document.getElementById('customerPhone').value = customer.phone;
            document.getElementById('customerEmail').value = customer.email || '';
            document.getElementById('customerAddress').value = customer.address || '';
            document.getElementById('customerDOB').value = customer.dob || '';
            
            document.getElementById('customerFormModal').style.display = 'block';
        }
    }

    async deleteCustomer(id) {
        if (confirm('Are you sure you want to delete this customer?')) {
            try {
                this.customers = this.customers.filter(c => c.id !== id);
                localStorage.setItem('medBillCustomers', JSON.stringify(this.customers));
                this.updateCustomersTable();
                alert('Customer deleted successfully!');
            } catch (error) {
                console.error('Error deleting customer:', error);
                alert('Error deleting customer. Please try again.');
            }
        }
    }

    async saveCustomer() {
        try {
            const formData = new FormData(document.getElementById('customerForm'));
            const customerData = {
                name: formData.get('name').trim(),
                phone: formData.get('phone').trim(),
                email: formData.get('email').trim(),
                address: formData.get('address').trim(),
                dob: formData.get('dob')
            };

            // Validation
            if (!customerData.name || !customerData.phone) {
                alert('Name and phone are required fields');
                return;
            }

            // Check for duplicate phone number
            const existingCustomer = this.customers.find(c => 
                c.phone === customerData.phone && 
                (!this.isEditing || c.id !== this.currentCustomer.id)
            );
            
            if (existingCustomer) {
                alert('A customer with this phone number already exists');
                return;
            }

            if (this.isEditing) {
                // Update existing customer
                const index = this.customers.findIndex(c => c.id === this.currentCustomer.id);
                this.customers[index] = {
                    ...this.currentCustomer,
                    ...customerData
                };
            } else {
                // Add new customer
                const newCustomer = {
                    id: Date.now(),
                    ...customerData,
                    totalVisits: 0,
                    totalSpent: 0,
                    lastVisit: null
                };
                this.customers.push(newCustomer);
            }

            // Save to localStorage
            localStorage.setItem('medBillCustomers', JSON.stringify(this.customers));
            
            this.updateCustomersTable();
            this.hideCustomerModal();
            
            alert(this.isEditing ? 'Customer updated successfully!' : 'Customer added successfully!');
        } catch (error) {
            console.error('Error saving customer:', error);
            alert('Error saving customer. Please try again.');
        }
    }

    hideCustomerModal() {
        document.getElementById('customerFormModal').style.display = 'none';
        document.getElementById('customerForm').reset();
        this.currentCustomer = null;
        this.isEditing = false;
    }
}

// Initialize customers manager when page loads
let customersManager;
document.addEventListener('DOMContentLoaded', () => {
    customersManager = new CustomersManager();
});