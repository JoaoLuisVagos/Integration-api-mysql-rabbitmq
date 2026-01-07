const mysql = require('mysql2/promise');

let pool;

async function init() {
  if (pool) return pool;

  const cfg = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'integration',
    waitForConnections: true,
    connectionLimit: 10,
  };

  const maxAttempts = 30;
  const delayMs = 2000;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      pool = mysql.createPool(cfg);
      // try a simple query to ensure DB is reachable
      await pool.query('SELECT 1');

      console.log('Connected to MySQL (attempt', attempt + ')');
      return pool;
    } catch (err) {
      console.error(`MySQL connect attempt ${attempt} failed:`, err.code || err.message);
      try {
        if (pool) await pool.end();
      } catch (e) {}
      pool = null;
      if (attempt >= maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function insertOrder(order) {
  if (!pool) await init();
  const externalId = order.orderId || order.external_id || null;
  const payload = JSON.stringify(order);
  const status = 'PENDING';
  const sql = 'INSERT INTO orders (external_id, payload, status) VALUES (?, ?, ?)';
  const [result] = await pool.query(sql, [externalId, payload, status]);
  return result;
}

module.exports = {
  init,
  insertOrder,
};
