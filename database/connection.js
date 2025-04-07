var mysql = require('mysql2');
 
require('dotenv').config(); // use npm install for this first
 
var connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'Spec6007!',
    database : 'Social_Game'
});

connection.connect((err => {
    if(err) throw err;
    console.log('MySQL Connected');
}));
 
module.exports = connection;