const mysql = require('mysql');
const db = mysql.createConnection({
    host:       'localhost',
    user:       'root',
    database:   'gamesdata'
})

module.exports = db;