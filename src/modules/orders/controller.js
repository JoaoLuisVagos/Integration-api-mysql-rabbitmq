exports.create = async (req, res) => {
  return res.status(202).json({ message: 'Order received' });
};
