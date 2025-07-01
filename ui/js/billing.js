// Billing Page JavaScript
class BillingManager {
    constructor() {
        this.medicines = [];
        this.currentCustomer = null;
        this.subtotal = 0;
        this.gstAmount = 0;
        this.discountAmount = 0;
        this.totalAmount = 0;
        this.loyaltyEligible = false;
        
        this.initializeEventListeners();
        this.loadSettings();
    }

    initializeEventListeners() {
        // Customer search
        document.getElementById('searchCustomerBtn').addEventListener('click', () => {
            this.searchCustomer();
        });

        document.getElementById('customerMobile').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchCustomer();
            }
        });

        // Medicine entry
        document.getElementById('addMedicineBtn').addEventListener('click', () => {
            this.addMedicine();
        });

        // GST toggle
        document.getElementById('gstToggle').addEventListener('change', () => {
            this.calculateTotals();
        });

        // Loyalty discount toggle
        document.getElementById('loyaltyDiscount').addEventListener('change', () => {
            this.calculateTotals();
        });

        // Action buttons
        document.getElementById('generateQRBtn').addEventListener('click', () => {
            this.generateUPIQR();
        });

        document.getElementById('printBillBtn').addEventListener('click', () => {
            this.printBill();
        });

        document.getElementById('submitBillBtn').addEventListener('click', () => {
            this.submitBill();
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

    async loadSettings() {
        try {
            // This would typically fetch from backend
            // For now, using localStorage as demo
            const settings = JSON.parse(localStorage.getItem('medBillSettings') || '{}');
            
            if (settings.gstEnabled) {
                document.getElementById('gstToggle').checked = true;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async searchCustomer() {
        const mobile = document.getElementById('customerMobile').value.trim();
        
        if (!mobile) {
            alert('Please enter a mobile number');
            return;
        }

        try {
            // Simulate API call - replace with actual backend call
            const customer = await this.mockCustomerSearch(mobile);
            
            if (customer) {
                this.currentCustomer = customer;
                this.showCustomerInfo(customer);
                this.checkLoyaltyEligibility(customer);
            } else {
                alert('Customer not found. You can add them in the Customers section.');
                this.currentCustomer = null;
                this.loyaltyEligible = false;
                document.getElementById('loyaltyRow').style.display = 'none';
            }
        } catch (error) {
            console.error('Error searching customer:', error);
            alert('Error searching customer. Please try again.');
        }
    }

    async mockCustomerSearch(mobile) {
        // Mock customer data - replace with actual API call
        const mockCustomers = [
            {
                id: 1,
                name: 'John Doe',
                phone: '9876543210',
                totalVisits: 8,
                totalSpent: 2500,
                lastPurchase: '2024-01-15'
            },
            {
                id: 2,
                name: 'Jane Smith',
                phone: '9876543211',
                totalVisits: 3,
                totalSpent: 800,
                lastPurchase: '2024-01-10'
            }
        ];

        return mockCustomers.find(customer => customer.phone === mobile) || null;
    }

    showCustomerInfo(customer) {
        const customerInfo = document.getElementById('customerInfo');
        customerInfo.innerHTML = `
            <div class="customer-info">
                <h4>${customer.name}</h4>
                <p><strong>Phone:</strong> ${customer.phone}</p>
                <p><strong>Total Visits:</strong> ${customer.totalVisits}</p>
                <p><strong>Total Spent:</strong> ₹${customer.totalSpent}</p>
                <p><strong>Last Purchase:</strong> ${customer.lastPurchase}</p>
            </div>
        `;
        
        document.getElementById('customerModal').style.display = 'block';
    }

    checkLoyaltyEligibility(customer) {
        const settings = JSON.parse(localStorage.getItem('medBillSettings') || '{}');
        
        if (settings.loyaltyEnabled) {
            const visitThreshold = settings.visitThreshold || 5;
            const spendThreshold = settings.spendThreshold || 1000;
            
            this.loyaltyEligible = customer.totalVisits >= visitThreshold && 
                                 customer.totalSpent >= spendThreshold;
            
            if (this.loyaltyEligible) {
                document.getElementById('loyaltyRow').style.display = 'flex';
            } else {
                document.getElementById('loyaltyRow').style.display = 'none';
            }
        }
    }

    addMedicine() {
        const name = document.getElementById('medicineName').value.trim();
        const quantity = parseInt(document.getElementById('quantity').value);
        const unit = document.getElementById('unit').value;
        const mrp = parseFloat(document.getElementById('mrp').value);

        if (!name || !quantity || !mrp) {
            alert('Please fill all medicine details');
            return;
        }

        const medicine = {
            id: Date.now(),
            name,
            quantity,
            unit,
            mrp,
            total: quantity * mrp
        };

        this.medicines.push(medicine);
        this.updateMedicineTable();
        this.calculateTotals();
        this.clearMedicineForm();
    }

    updateMedicineTable() {
        const tbody = document.getElementById('medicineTableBody');
        tbody.innerHTML = '';

        this.medicines.forEach(medicine => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${medicine.name}</td>
                <td>${medicine.quantity}</td>
                <td>${medicine.unit}</td>
                <td>₹${medicine.mrp.toFixed(2)}</td>
                <td>₹${medicine.total.toFixed(2)}</td>
                <td class="actions">
                    <button class="btn btn-warning btn-sm" onclick="billingManager.editMedicine(${medicine.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="billingManager.deleteMedicine(${medicine.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    editMedicine(id) {
        const medicine = this.medicines.find(m => m.id === id);
        if (medicine) {
            document.getElementById('medicineName').value = medicine.name;
            document.getElementById('quantity').value = medicine.quantity;
            document.getElementById('unit').value = medicine.unit;
            document.getElementById('mrp').value = medicine.mrp;
            
            this.deleteMedicine(id);
        }
    }

    deleteMedicine(id) {
        this.medicines = this.medicines.filter(m => m.id !== id);
        this.updateMedicineTable();
        this.calculateTotals();
    }

    calculateTotals() {
        this.subtotal = this.medicines.reduce((sum, medicine) => sum + medicine.total, 0);
        
        // Calculate GST
        const gstEnabled = document.getElementById('gstToggle').checked;
        this.gstAmount = gstEnabled ? this.subtotal * 0.18 : 0;
        
        // Calculate loyalty discount
        const loyaltyEnabled = document.getElementById('loyaltyDiscount').checked;
        if (loyaltyEnabled && this.loyaltyEligible) {
            const settings = JSON.parse(localStorage.getItem('medBillSettings') || '{}');
            const discountType = settings.discountType || 'percentage';
            const discountValue = settings.discountValue || 10;
            
            if (discountType === 'percentage') {
                this.discountAmount = this.subtotal * (discountValue / 100);
            } else {
                this.discountAmount = discountValue;
            }
        } else {
            this.discountAmount = 0;
        }
        
        this.totalAmount = this.subtotal + this.gstAmount - this.discountAmount;
        
        // Update display
        document.getElementById('subtotal').textContent = `₹${this.subtotal.toFixed(2)}`;
        document.getElementById('gstAmount').textContent = `₹${this.gstAmount.toFixed(2)}`;
        document.getElementById('discountAmount').textContent = `₹${this.discountAmount.toFixed(2)}`;
        document.getElementById('totalAmount').textContent = `₹${this.totalAmount.toFixed(2)}`;
    }

    clearMedicineForm() {
        document.getElementById('medicineName').value = '';
        document.getElementById('quantity').value = '';
        document.getElementById('unit').value = 'tablet';
        document.getElementById('mrp').value = '';
    }

    async generateUPIQR() {
        if (this.medicines.length === 0) {
            alert('Please add medicines to generate QR code');
            return;
        }

        try {
            const settings = JSON.parse(localStorage.getItem('medBillSettings') || '{}');
            const upiId = settings.upiId;
            
            if (!upiId) {
                alert('Please configure UPI ID in settings');
                return;
            }

            // Generate UPI payment string
            const paymentString = `upi://pay?pa=${upiId}&pn=MedBill Pro&am=${this.totalAmount.toFixed(2)}&cu=INR`;
            
            // This would typically call a backend service to generate QR code
            // For demo, showing a placeholder
            const qrContainer = document.getElementById('qrContainer');
            qrContainer.innerHTML = `
                <div style="text-align: center;">
                    <div style="width: 200px; height: 200px; border: 2px solid #ccc; margin: 0 auto; display: flex; align-items: center; justify-content: center; background: #f8f9fa;">
                        QR Code<br>₹${this.totalAmount.toFixed(2)}
                    </div>
                    <p style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                        Scan to pay ₹${this.totalAmount.toFixed(2)}
                    </p>
                </div>
            `;
            
            document.getElementById('qrModal').style.display = 'block';
        } catch (error) {
            console.error('Error generating QR code:', error);
            alert('Error generating QR code. Please try again.');
        }
    }

    async printBill() {
        if (this.medicines.length === 0) {
            alert('Please add medicines to print bill');
            return;
        }

        try {
            // This would typically call a backend service to generate and print bill
            // For demo, opening print dialog with bill content
            const billContent = this.generateBillHTML();
            const printWindow = window.open('', '_blank');
            printWindow.document.write(billContent);
            printWindow.document.close();
            printWindow.print();
        } catch (error) {
            console.error('Error printing bill:', error);
            alert('Error printing bill. Please try again.');
        }
    }

    generateBillHTML() {
        const billDate = new Date().toLocaleDateString();
        const billTime = new Date().toLocaleTimeString();
        const billNo = 'BILL-' + Date.now();

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bill - ${billNo}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .bill-info { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .totals { text-align: right; }
                    .total-row { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>MedBill Pro</h2>
                    <p>Medical Store</p>
                </div>
                <div class="bill-info">
                    <p><strong>Bill No:</strong> ${billNo}</p>
                    <p><strong>Date:</strong> ${billDate} ${billTime}</p>
                    ${this.currentCustomer ? `<p><strong>Customer:</strong> ${this.currentCustomer.name} (${this.currentCustomer.phone})</p>` : ''}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Medicine</th>
                            <th>Qty</th>
                            <th>Unit</th>
                            <th>MRP</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.medicines.map(medicine => `
                            <tr>
                                <td>${medicine.name}</td>
                                <td>${medicine.quantity}</td>
                                <td>${medicine.unit}</td>
                                <td>₹${medicine.mrp.toFixed(2)}</td>
                                <td>₹${medicine.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="totals">
                    <p>Subtotal: ₹${this.subtotal.toFixed(2)}</p>
                    ${this.gstAmount > 0 ? `<p>GST (18%): ₹${this.gstAmount.toFixed(2)}</p>` : ''}
                    ${this.discountAmount > 0 ? `<p>Discount: -₹${this.discountAmount.toFixed(2)}</p>` : ''}
                    <p class="total-row">Total: ₹${this.totalAmount.toFixed(2)}</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <p>Thank you for your business!</p>
                </div>
            </body>
            </html>
        `;
    }

    async submitBill() {
        if (this.medicines.length === 0) {
            alert('Please add medicines to submit bill');
            return;
        }

        try {
            const billData = {
                billNo: 'BILL-' + Date.now(),
                date: new Date().toISOString(),
                customer: this.currentCustomer,
                medicines: this.medicines,
                subtotal: this.subtotal,
                gstAmount: this.gstAmount,
                discountAmount: this.discountAmount,
                totalAmount: this.totalAmount,
                paymentMethod: 'cash' // This could be selected by user
            };

            // This would typically send to backend
            console.log('Submitting bill:', billData);
            
            // Save to localStorage for demo
            const bills = JSON.parse(localStorage.getItem('medBillHistory') || '[]');
            bills.push(billData);
            localStorage.setItem('medBillHistory', JSON.stringify(bills));

            alert('Bill submitted successfully!');
            this.resetBilling();
        } catch (error) {
            console.error('Error submitting bill:', error);
            alert('Error submitting bill. Please try again.');
        }
    }

    resetBilling() {
        this.medicines = [];
        this.currentCustomer = null;
        this.subtotal = 0;
        this.gstAmount = 0;
        this.discountAmount = 0;
        this.totalAmount = 0;
        this.loyaltyEligible = false;

        document.getElementById('customerMobile').value = '';
        document.getElementById('loyaltyRow').style.display = 'none';
        document.getElementById('gstToggle').checked = false;
        document.getElementById('loyaltyDiscount').checked = false;
        
        this.updateMedicineTable();
        this.calculateTotals();
        this.clearMedicineForm();
    }
}

// Initialize billing manager when page loads
let billingManager;
document.addEventListener('DOMContentLoaded', () => {
    billingManager = new BillingManager();
});