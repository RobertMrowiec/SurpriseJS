const express = require('express');
const router = express.Router();
const login = require('./details');

router.get('/verify/:token', login.verify)
      .post('/generate', login.generate);

module.exports = router;
