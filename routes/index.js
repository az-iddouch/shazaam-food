const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  // const data = { name: 'iron man', job: 'hero', awesome: true };
  // res.json(data);
  // res.send('hola people ... 😎');
  // res.send(req.query.name);
  res.render('hello', { name: 'jaghead', age: 12 });
});

router.get('/reverse/:name', (req, res) => {
  res.send([...req.params.name].reverse().join(''));
});

module.exports = router;
