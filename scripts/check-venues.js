require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
    try {
        const res = await pool.query("SELECT name, slug, tiqets_product_id FROM venues");
        console.log('--- ALL VENUES ---');
        res.rows.forEach(r => console.log(`[${r.name}] -> (${r.slug}) | Tiqets ID: ${r.tiqets_product_id || 'NONE'}`));
        console.log('------------------');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

check();
