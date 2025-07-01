from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3, qrcode, io, json
from datetime import datetime

app = Flask(__name__)
CORS(app)
DATABASE = 'medical_billing.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# -------------------- Customers --------------------
@app.route('/api/customers/<phone>')
def get_customer(phone):
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM customers WHERE phone = ?', (phone,))
    row = cur.fetchone()
    conn.close()
    return jsonify(dict(row)) if row else ('', 404)

@app.route('/api/customers', methods=['GET'])
def get_customers():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM customers")
    rows = cur.fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/customers', methods=['POST'])
def create_customer():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO customers (name, phone) VALUES (?, ?)", (data['name'], data['phone']))
    conn.commit()
    conn.close()
    return jsonify({'status': 'created'})

@app.route('/api/customers/<int:id>', methods=['PUT'])
def update_customer(id):
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE customers SET name = ?, phone = ? WHERE id = ?", (data['name'], data['phone'], id))
    conn.commit()
    conn.close()
    return jsonify({'status': 'updated'})

@app.route('/api/customers/<int:id>', methods=['DELETE'])
def delete_customer(id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM customers WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({'status': 'deleted'})

# -------------------- Settings --------------------
@app.route('/api/settings', methods=['GET'])
def get_settings():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT key, value FROM settings')
    settings = {row['key']: json.loads(row['value']) for row in cur.fetchall()}
    conn.close()
    return jsonify(settings)

@app.route('/api/settings', methods=['POST'])
def update_settings():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    for key, value in data.items():
        cur.execute("REPLACE INTO settings (key, value) VALUES (?, ?)", (key, json.dumps(value)))
    conn.commit()
    conn.close()
    return jsonify({'status': 'updated'})

# -------------------- UPI QR Code --------------------
@app.route('/api/upi_qr')
def upi_qr():
    amount = request.args.get('amount')
    conn = get_db()
    upi_id = conn.execute("SELECT value FROM settings WHERE key = 'upiId'").fetchone()['value']
    conn.close()
    upi_url = f'upi://pay?pa={upi_id}&pn=MedBillPro&am={amount}&cu=INR'
    img = qrcode.make(upi_url)
    buf = io.BytesIO(); img.save(buf); buf.seek(0)
    return send_file(buf, mimetype='image/png')

# -------------------- Bills --------------------
@app.route('/api/bills', methods=['POST'])
def submit_bill():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO bills (bill_no, customer_id, date, subtotal, gst, discount, total, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", (
        data['billNo'], data['customer']['id'] if data['customer'] else None,
        data['date'], data['subtotal'], data['gstAmount'], data['discountAmount'],
        data['totalAmount'], data['paymentMethod']
    ))
    bill_id = cur.lastrowid
    for item in data['medicines']:
        cur.execute("INSERT INTO bill_items (bill_id, name, quantity, unit, mrp, total) VALUES (?, ?, ?, ?, ?, ?)", (
            bill_id, item['name'], item['quantity'], item['unit'], item['mrp'], item['total']
        ))
    if data['customer']:
        cur.execute("UPDATE customers SET totalVisits = totalVisits + 1, totalSpent = totalSpent + ?, lastPurchase = ? WHERE id = ?", (
            data['totalAmount'], datetime.now().strftime('%Y-%m-%d'), data['customer']['id']
        ))
    conn.commit(); conn.close()
    return jsonify({'status': 'success'})

@app.route('/api/bills', methods=['GET'])
def get_bills():
    start_date = request.args.get('from')
    end_date = request.args.get('to')
    conn = get_db()
    cur = conn.cursor()
    if start_date and end_date:
        cur.execute("SELECT * FROM bills WHERE date BETWEEN ? AND ?", (start_date, end_date))
    else:
        cur.execute("SELECT * FROM bills")
    rows = cur.fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

# -------------------- Stock APIs --------------------
@app.route('/api/stock', methods=['GET'])
def get_stock():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM stock")
    rows = cur.fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/api/stock', methods=['POST'])
def add_stock():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO stock (name, batch, expiry, stock, company, category, price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (data['name'], data['batch'], data['expiry'], data['stock'], data['company'], data['category'], data['price']))
    conn.commit()
    conn.close()
    return jsonify({'status': 'added'})

# -------------------- App Start --------------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)
