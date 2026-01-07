const amqplib = require('amqplib');

async function connect() {
  const url = process.env.RABBITMQ_URL || 'amqp://localhost';
  const conn = await amqplib.connect(url);
  const channel = await conn.createChannel();
  return { conn, channel };
}

async function publish(queue, msg) {
  const { conn, channel } = await connect();
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)), { persistent: true });
  setTimeout(async () => {
    try { await channel.close(); await conn.close(); } catch (e) {}
  }, 500);
}

async function consume(queue, onMessage) {
  const { conn, channel } = await connect();
  await channel.assertQueue(queue, { durable: true });
  channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      await onMessage(data);
      channel.ack(msg);
    } catch (err) {
      channel.nack(msg, false, false);
    }
  }, { noAck: false });
}

module.exports = {
  publish,
  consume,
};
