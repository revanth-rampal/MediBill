import sqlite3
conn = sqlite3.connect('medical_billing.db')
cur = conn.cursor()
cur.executescript("""
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT UNIQUE,
    totalVisits INTEGER DEFAULT 0,
    totalSpent REAL DEFAULT 0,
    lastPurchase TEXT
);
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_no TEXT,
    customer_id INTEGER,
    date TEXT,
    subtotal REAL,
    gst REAL,
    discount REAL,
    total REAL,
    payment_method TEXT
);
CREATE TABLE IF NOT EXISTS bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER,
    name TEXT,
    quantity INTEGER,
    unit TEXT,
    mrp REAL,
    total REAL
);
INSERT OR IGNORE INTO settings (key, value) VALUES ('upiId', '"yourshop@upi"');
""")
conn.commit()
conn.close()
