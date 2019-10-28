const express = require('express');
const router = express.Router();
const request = require('request');
const db = require('../../dbconnection.js');
router.get('/:page', (req, res) => {
    db.query('SELECT * FROM games LIMIT 20', (err, result) => {
        if (err) res.send(err);
        else res.send(result);
    });
});


module.exports = router;