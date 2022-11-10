const { Client } = require("pg");

/*
package needed to read .env which is
not on github repo to read pool info
*/
require('dotenv').config();

const client = new Client({
    host: process.env.HOST,
    user: process.env.DB_USER,
    port: process.env.PORT,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    // ssl: { rejectUnauthorized: false }
});

client.connect();

client.query(`SELECT * from instructors LIMIT 4`, (err, res) => {
    if (!err) {
        console.log(res.rows);
    } else {
        console.log(err.message);
    }
    client.end();
});