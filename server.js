const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 1. API ROUTES MUST COME *BEFORE* STATIC FILES
app.post('/api/biodata', async (req, res) => {
    try {
        const {
            name, dob, gender, email, phone, address, state, matno, department, level,password
        } = req.body;

        const query = `
            INSERT INTO users (
                full_name, date_of_birth, gender, email, phone_number, 
                residential_address, state_of_origin, matric_number, department, level,password
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11)
            RETURNING *;
        `;

        const values = [name, dob, gender, email, phone, address, state, matno, department, level,password];
        const newRecord = await pool.query(query, values);

        return res.status(201).json({ 
            message: 'Form submitted and saved to database successfully!', 
            data: newRecord.rows[0] 
        });

    } catch (err) {
        console.error("SERVER ERROR DETAILS:", err);
        if (err.code === '23505') { // Postgres duplicate key error code
            return res.status(400).json({ error: 'A student with this email or matric number already exists.' });
        }
        return res.status(500).json({ error: err.message || 'Server error while saving biodata.' });
    }
});
app.post('/api/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Please fill in all fields.' });
        }

        // Search for user in database
        const userQuery = await pool.query(
            'SELECT * FROM users WHERE identifier = $1 AND password = $2',
            [identifier, password]
        );

        if (userQuery.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        return res.status(200).json({ message: 'Login successful' });

    } catch (err) {
        console.error("SERVER ERROR:", err);
        return res.status(500).json({ error: 'Server error during login.' });
    }
});
// 2. SERVE STATIC FRONTEND FILES AFTER API ROUTES
app.use(express.static(__dirname));

// PostgreSQL Connection Pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect((err) => {
    if (err) {
        console.error('Database connection error:', err.stack);
    } else {
        console.log('Connected to PostgreSQL database successfully.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});