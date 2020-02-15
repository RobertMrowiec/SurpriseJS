const jwt = require('jsonwebtoken');
const secret = process.env.SECRET || 'You_better_change_this';

exports.verify = (req, res) => {
  const result = jwt.verify(req.params.token, secret, { expiresIn: 60 * 60 });
  return res.status(200).json(result);
};

exports.generate = (req, res) => {
  const token = jwt.sign({ foo: 'bar' }, secret);
  return res.status(200).json(token);
};
