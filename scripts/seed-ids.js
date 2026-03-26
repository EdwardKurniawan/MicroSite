require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function update() {
    try {
        console.log('Updating Kanazawa venues with test Tiqets IDs...');
        await pool.query("UPDATE venues SET tiqets_product_id = '974312' WHERE slug = 'kenroku-en-garden'");
        await pool.query("UPDATE venues SET tiqets_product_id = '974465' WHERE slug = '21st-century-museum'");
        await pool.query("UPDATE venues SET tiqets_product_id = '975001' WHERE slug = 'myoryuji-ninja-temple'");
        console.log('Syncing Amsterdam IDs...');
        await pool.query("UPDATE venues SET tiqets_product_id = '974116' WHERE slug = 'rijksmuseum'");
        await pool.query("UPDATE venues SET tiqets_product_id = '974117' WHERE slug = 'van-gogh-museum'");
        console.log('Update complete.');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

update();
