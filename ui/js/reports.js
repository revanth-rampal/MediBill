// Reports Page JavaScript
class ReportsManager {
    constructor() {
        this.bills = [];
        this.filteredBills = [];
        this.customers = [];
        
        this.initializeEventListeners();
        this.loadData();
        this.setDefaultDateRange();
    }

    initializeEventListeners() {
        // Filter buttons
        document.getElementById('applyFiltersBtn').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            this.clearFilters();
        });

        // Export buttons
        document.getElementById('exportExcelBtn').addEventListener('click', () => {
            this.exportToExcel();
        });

        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.exportToPDF();
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

        // Bill details modal buttons
        document.getElementById('printBillBtn').addEventListener('click', () => {
            this.printSelectedBill();
        });

        document.getElementById('emailBillBtn').addEventListener('click', () => {
            this.emailSelectedBill();
        });
    }

    async loadData() {
        try {
            // Load bills from localStorage
            this.bills = JSON.parse(localStorage.getItem('medBillHistory') || '[]');
            
            // Load customers for filter dropdown
            this.customers = JSON.parse(localStorage.getItem('medBillCustomers') || '[]');
            
            // Add some mock bills if empty
            if (this.bills.length === 0) {
                this.bills = this.generateMockBills();
                localStorage.setItem('medBillHistory', JSON.stringify(this.bills));
            }

            this.populateCustomerFilter();
            this.filteredBills = [...this.bills];
            this.updateReportsTable();
            this.updateSummaryCards();
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading reports data. Please try again.');
        }
    }

    generateMockBills() {
        const mockBills = [];
        const customers = [
            { id: 1, name: 'John Doe', phone: '9876543210' },
            { id: 2, name: 'Jane Smith', phone: '9876543211' },
            { id: 3, name: 'Bob Johnson', phone: '9876543212' }
        ];

        for (let i = 1; i <= 15; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            
            const subtotal = Math.random() * 500 + 100;
            const gstAmount = subtotal * 0.18;
            const discountAmount = Math.random() * 50;
            const totalAmount = subtotal + gstAmount - discountAmount;

            mockBills.push({
                billNo: `BILL-${1000 + i}`,
                date: date.toISOString(),
                customer: customer,
                medicines: [
                    {
                        name: 'Paracetamol 500mg',
                        quantity: Math.floor(Math.random() * 10) + 1,
                        unit: 'tablet',
                        mrp: 2.50,
                        total: Math.random() * 100 + 50
                    }
                ],
                subtotal: subtotal,
                gstAmount: gstAmount,
                discountAmount: discountAmount,
                totalAmount: totalAmount,
                paymentMethod: ['cash', 'upi', 'card'][Math.floor(Math.random() * 3)]
            });
        }

        return mockBills;
    }

    setDefaultDateRange() {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        document.getElementById('dateFrom').value = thirtyDaysAgo.toISOString().split('T')[0];
        document.getElementById('dateTo').value = today.toISOString().split('T')[0];
    }

    populateCustomerFilter() {
        const customerFilter = document.getElementById('customerFilter');
        customerFilter.innerHTML = '<option value="">All Customers</option>';

        // Get unique customers from bills
        const uniqueCustomers = [];
        this.bills.forEach(bill => {
            if (bill.customer && !uniqueCustomers.find(c => c.id === bill.customer.id)) {
                uniqueCustomers.push(bill.customer);
            }
        });

        uniqueCustomers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} (${customer.phone})`;
            customerFilter.appendChild(option);
        });
    }

    applyFilters() {
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        const customerId = document.getElementById('customerFilter').value;
        const paymentMethod = document.getElementById('paymentFilter').value;

        this.filteredBills = this.bills.filter(bill => {
            const billDate = new Date(bill.date).toISOString().split('T')[0];
            
            const matchesDateRange = (!dateFrom || billDate >= dateFrom) && 
                                   (!dateTo || billDate <= dateTo);
            
            const matchesCustomer = !customerId || 
                                  (bill.customer && bill.customer.id.toString() === customerId);
            
            const matchesPayment = !paymentMethod || bill.paymentMethod === paymentMethod;

            return matchesDateRange && matchesCustomer && matchesPayment;
        });

        this.updateReportsTable();
        this.updateSummaryCards();
    }

    clearFilters() {
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('customerFilter').value = '';
        document.getElementById('paymentFilter').value = '';

        this.filteredBills = [...this.bills];
        this.updateReportsTable();
        this.updateSummaryCards();
        this.setDefaultDateRange();
    }

    updateReportsTable() {
        const tbody = document.getElementById('reportsTableBody');
        tbody.innerHTML = '';

        this.filteredBills.forEach(bill => {
            const row = document.createElement('tr');
            const billDate = new Date(bill.date);
            
            row.innerHTML = `
                <td>${bill.billNo}</td>
                <td>${billDate.toLocaleDateString()}</td>
                <td>${billDate.toLocaleTimeString()}</td>
                <td>${bill.customer ? bill.customer.name : 'Walk-in'}</td>
                <td>${bill.customer ? bill.customer.phone : '-'}</td>
                <td>${bill.medicines.length}</td>
                <td>₹${bill.subtotal.toFixed(2)}</td>
                <td>₹${bill.discountAmount.toFixed(2)}</td>
                <td>₹${bill.gstAmount.toFixed(2)}</td>
                <td>₹${bill.totalAmount.toFixed(2)}</td>
                <td>${bill.paymentMethod.toUpperCase()}</td>
                <td class="actions">
                    <button class="btn btn-primary btn-sm" onclick="reportsManager.viewBillDetails('${bill.billNo}')">View</button>
                    <button class="btn btn-secondary btn-sm" onclick="reportsManager.printBill('${bill.billNo}')">Print</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateSummaryCards() {
        const totalSales = this.filteredBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
        const totalBills = this.filteredBills.length;
        const averageBill = totalBills > 0 ? totalSales / totalBills : 0;
        const totalDiscount = this.filteredBills.reduce((sum, bill) => sum + bill.discountAmount, 0);

        document.getElementById('totalSales').textContent = `₹${totalSales.toFixed(2)}`;
        document.getElementById('totalBills').textContent = totalBills.toString();
        document.getElementById('averageBill').textContent = `₹${averageBill.toFixed(2)}`;
        document.getElementById('totalDiscount').textContent = `₹${totalDiscount.toFixed(2)}`;
    }

    viewBillDetails(billNo) {
        const bill = this.bills.find(b => b.billNo === billNo);
        if (bill) {
            const billDate = new Date(bill.date);
            const billDetailsContent = document.getElementById('billDetailsContent');
            
            billDetailsContent.innerHTML = `
                <div class="bill-details">
                    <div class="bill-header">
                        <h4>Bill No: ${bill.billNo}</h4>
                        <p><strong>Date:</strong> ${billDate.toLocaleDateString()} ${billDate.toLocaleTimeString()}</p>
                        ${bill.customer ? `<p><strong>Customer:</strong> ${bill.customer.name} (${bill.customer.phone})</p>` : '<p><strong>Customer:</strong> Walk-in</p>'}
                    </div>
                    
                    <div class="medicines-list">
                        <h5>Medicines:</h5>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Medicine</th>
                                    <th>Quantity</th>
                                    <th>Unit</th>
                                    <th>MRP</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bill.medicines.map(medicine => `
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
                    </div>
                    
                    <div class="bill-summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>₹${bill.subtotal.toFixed(2)}</span>
                        </div>
                        ${bill.gstAmount > 0 ? `
                            <div class="summary-row">
                                <span>GST (18%):</span>
                                <span>₹${bill.gstAmount.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        ${bill.discountAmount > 0 ? `
                            <div class="summary-row">
                                <span>Discount:</span>
                                <span>-₹${bill.discountAmount.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        <div class="summary-row total-row">
                            <span>Total:</span>
                            <span>₹${bill.totalAmount.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Payment Method:</span>
                            <span>${bill.paymentMethod.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            `;
            
            this.currentBill = bill;
            document.getElementById('billDetailsModal').style.display = 'block';
        }
    }

    printBill(billNo) {
        const bill = this.bills.find(b => b.billNo === billNo);
        if (bill) {
            const billContent = this.generateBillHTML(bill);
            const printWindow = window.open('', '_blank');
            printWindow.document.write(billContent);
            printWindow.document.close();
            printWindow.print();
        }
    }

    printSelectedBill() {
        if (this.currentBill) {
            this.printBill(this.currentBill.billNo);
        }
    }

    emailSelectedBill() {
        if (this.currentBill && this.currentBill.customer && this.currentBill.customer.email) {
            // This would typically call a backend service to send email
            alert(`Bill would be emailed to ${this.currentBill.customer.email}`);
        } else {
            alert('Customer email not available');
        }
    }

    generateBillHTML(bill) {
        const billDate = new Date(bill.date);
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bill - ${bill.billNo}</title>
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
                    <p><strong>Bill No:</strong> ${bill.billNo}</p>
                    <p><strong>Date:</strong> ${billDate.toLocaleDateString()} ${billDate.toLocaleTimeString()}</p>
                    ${bill.customer ? `<p><strong>Customer:</strong> ${bill.customer.name} (${bill.customer.phone})</p>` : ''}
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
                        ${bill.medicines.map(medicine => `
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
                    <p>Subtotal: ₹${bill.subtotal.toFixed(2)}</p>
                    ${bill.gstAmount > 0 ? `<p>GST (18%): ₹${bill.gstAmount.toFixed(2)}</p>` : ''}
                    ${bill.discountAmount > 0 ? `<p>Discount: -₹${bill.discountAmount.toFixed(2)}</p>` : ''}
                    <p class="total-row">Total: ₹${bill.totalAmount.toFixed(2)}</p>
                    <p>Payment: ${bill.paymentMethod.toUpperCase()}</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <p>Thank you for your business!</p>
                </div>
            </body>
            </html>
        `;
    }

    exportToExcel() {
        try {
            // Create CSV content
            const headers = ['Bill No', 'Date', 'Time', 'Customer', 'Phone', 'Items', 'Subtotal', 'Discount', 'GST', 'Total', 'Payment'];
            const csvContent = [
                headers.join(','),
                ...this.filteredBills.map(bill => {
                    const billDate = new Date(bill.date);
                    return [
                        bill.billNo,
                        billDate.toLocaleDateString(),
                        billDate.toLocaleTimeString(),
                        bill.customer ? bill.customer.name : 'Walk-in',
                        bill.customer ? bill.customer.phone : '-',
                        bill.medicines.length,
                        bill.subtotal.toFixed(2),
                        bill.discountAmount.toFixed(2),
                        bill.gstAmount.toFixed(2),
                        bill.totalAmount.toFixed(2),
                        bill.paymentMethod.toUpperCase()
                    ].join(',');
                })
            ].join('\n');

            // Download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `billing-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Error exporting data. Please try again.');
        }
    }

    exportToPDF() {
        try {
            // This would typically use a PDF library like jsPDF
            // For demo, creating a simple HTML version
            const reportContent = this.generateReportHTML();
            const printWindow = window.open('', '_blank');
            printWindow.document.write(reportContent);
            printWindow.document.close();
            printWindow.print();
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            alert('Error exporting PDF. Please try again.');
        }
    }

    generateReportHTML() {
        const totalSales = this.filteredBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
        const totalBills = this.filteredBills.length;
        const averageBill = totalBills > 0 ? totalSales / totalBills : 0;
        const totalDiscount = this.filteredBills.reduce((sum, bill) => sum + bill.discountAmount, 0);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Billing Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .summary { margin-bottom: 30px; }
                    .summary-item { display: inline-block; margin: 10px 20px; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>MedBill Pro - Billing Report</h2>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="summary">
                    <div class="summary-item">
                        <h4>Total Sales</h4>
                        <p>₹${totalSales.toFixed(2)}</p>
                    </div>
                    <div class="summary-item">
                        <h4>Total Bills</h4>
                        <p>${totalBills}</p>
                    </div>
                    <div class="summary-item">
                        <h4>Average Bill</h4>
                        <p>₹${averageBill.toFixed(2)}</p>
                    </div>
                    <div class="summary-item">
                        <h4>Total Discount</h4>
                        <p>₹${totalDiscount.toFixed(2)}</p>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Bill No</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Subtotal</th>
                            <th>Discount</th>
                            <th>GST</th>
                            <th>Total</th>
                            <th>Payment</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.filteredBills.map(bill => {
                            const billDate = new Date(bill.date);
                            return `
                                <tr>
                                    <td>${bill.billNo}</td>
                                    <td>${billDate.toLocaleDateString()}</td>
                                    <td>${bill.customer ? bill.customer.name : 'Walk-in'}</td>
                                    <td>${bill.medicines.length}</td>
                                    <td>₹${bill.subtotal.toFixed(2)}</td>
                                    <td>₹${bill.discountAmount.toFixed(2)}</td>
                                    <td>₹${bill.gstAmount.toFixed(2)}</td>
                                    <td>₹${bill.totalAmount.toFixed(2)}</td>
                                    <td>${bill.paymentMethod.toUpperCase()}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }
}

// Initialize reports manager when page loads
let reportsManager;
document.addEventListener('DOMContentLoaded', () => {
    reportsManager = new ReportsManager();
});