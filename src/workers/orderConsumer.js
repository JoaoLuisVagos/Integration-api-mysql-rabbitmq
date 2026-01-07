const rabbitmq = require('../config/rabbitmq');
const db = require('../database');

async function waitForDb(retries = 20, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await db.init();
      return;
    } catch (err) {
      console.log(`DB not ready, retrying (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('Could not connect to DB after retries');
}

async function startWorker() {
  while (true) {
    try {
      await waitForDb();
      console.log('Database initialized');

      // connect directly to RabbitMQ and consume
      const amqpUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
      const conn = await require('amqplib').connect(amqpUrl);
      const channel = await conn.createChannel();
      await channel.assertQueue('orders', { durable: true });
      channel.consume('orders', async (msg) => {
        if (!msg) return;
        try {
          const order = JSON.parse(msg.content.toString());
          console.log('Received order from queue:', order);
          try {
            const res = await db.insertOrder(order);
            console.log('Order inserted with id:', (res && (res.insertId || res.insert_id)) || res[0]);
            channel.ack(msg);
          } catch (err) {
            console.error('Failed to insert order into DB', err);
            channel.nack(msg, false, false);
          }
        } catch (err) {
          console.error('Invalid message, dropping', err);
          channel.ack(msg);
        }
      });

      console.log('Worker is listening for orders');
      break; // consumer established
    } catch (err) {
      console.error('Worker start failed, retrying in 2s:', err && (err.code || err.message));
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

startWorker();

