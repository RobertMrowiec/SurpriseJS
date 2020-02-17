const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  let token = req.get('Authorization');
  const secret = process.env.SECRET || 'You_better_change_this'; // You can use dotenv package to access process.env.variables

  if (!token)
    return res.status(401).json({ message: 'Authorization header is not present' });

  token = token.split('Bearer ').pop();
  jwt.verify(token, secret, (err, decoded) => {
    if (err) return res.status(401).json({ message: err });

    req.user = decoded;
    next();
  });
};
