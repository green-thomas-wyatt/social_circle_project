var express = require('express');
var router = express.Router();
var connection = require('../database/connection'); 
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

// Home Page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// Signup Route
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO users (username, password_hash) VALUES (?, ?)";

    connection.query(query, [username, hashedPassword], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "User already exists or DB error.", error: err });
      }
      res.status(201).json({ message: "User created successfully." });
    });
  } catch (error) {
    res.status(500).json({ message: "Error hashing password.", error });
  }
});

// Login Route
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required." });
  }

  const query = "SELECT * FROM users WHERE username = ?";
  connection.query(query, [username], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error.", error: err });
    if (results.length === 0) return res.status(401).json({ message: "Invalid username or password." });

    const user = results[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const token = jwt.sign({ userId: user.user_id, username: user.username, role: user.role }, SECRET_KEY, {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful.", token });
  });
});



module.exports = router;
