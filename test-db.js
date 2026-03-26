const { Pool } = require('pg');
const pool = new Pool({ 
    connectionString: 'postgres://postgres:postgres@db.hgedrvcjulaeqguizpqn.supabase.co:5432/postgres', 
    ssl: { rejectUnauthorized: false } 
});

pool.query('SELECT NOW()')
    .then(res => {
        console.log('✅ Connected successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    });
