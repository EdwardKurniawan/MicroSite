require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
        
        // Also check if our target tables exist
        const tables = res.rows.map(r => r.table_name);
        if (!tables.includes('affiliate_clicks')) {
            console.log('Creating affiliate_clicks table...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS affiliate_clicks (
                    id SERIAL PRIMARY KEY,
                    venue_slug TEXT,
                    clicked_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
        }
        if (!tables.includes('newsletter_signups')) {
            console.log('Creating newsletter_signups table...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS newsletter_signups (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE,
                    city_slug TEXT,
                    signed_up_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
        }
        console.log('Database schema verified.');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

check();
