const rabbitmq = require('../../config/rabbitmq');

exports.create = async (req, res) => {
  const order = req.body;
  try {
    await rabbitmq.publish('orders', order);
    return res.status(202).json({ message: 'Order received' });
  } catch (err) {
    console.error('Failed to publish order', err);
    return res.status(500).json({ error: 'Failed to enqueue order' });
  }
};
