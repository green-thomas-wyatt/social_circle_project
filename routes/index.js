var express = require('express');
var router = express.Router();
var connection = require('../database/connection'); 
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

// Middleware to check authentication
const authenticate = (req, res, next) => {
  const token = req.cookies.token; // Read token from cookies
  if (!token) return res.redirect('/login'); // Redirect to login if no token

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.redirect('/login'); // Invalid token -> go to login
    req.user = decoded; // Attach user info to request
    next();
  });
};

// Home Route
router.get('/', (req, res) => {
  res.render('index');  // Render the home page (index.ejs)
});


// Home Page
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

// Store Page Route
router.get('/store', authenticate, (req, res) => {
  // Fetch store items from the database
  connection.query('SELECT * FROM store_items', (err, results) => {
    if (err) return res.status(500).json({ message: "Database error.", error: err });
    res.render('store', { username: req.user.username, storeItems: results });
  });
});

// Leaderboard Page Route
router.get('/leaderboard', authenticate, (req, res) => {
  const query = `
  SELECT username, points AS total_points
  FROM users
  ORDER BY points DESC
  LIMIT 10
`;


  connection.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send("An error occurred while fetching leaderboard data.");
    }

    res.render('leaderboard', {
      username: req.user.username,
      leaderboard: results
    });
  });
});


// Characters Page Route
router.get('/characters', authenticate, (req, res) => {
  // Fetch characters from the database
  connection.query('SELECT * FROM characters', (err, results) => {
    if (err) return res.status(500).json({ message: "Database error.", error: err });
    res.render('characters', { username: req.user.username, characters: results });
  });
});

// Profile Page Route
router.get('/profile', authenticate, (req, res) => {
  // Fetch user's profile data from the database
  connection.query('SELECT * FROM users WHERE user_id = ?', [req.user.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error.", error: err });
    res.render('profile', { username: req.user.username, userData: results[0] });
  });
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

      // Automatically log in after signing up
      const token = jwt.sign({ userId: result.insertId, username, role: "logged_in" }, SECRET_KEY, { expiresIn: "1h" });

      res.cookie("token", token, { httpOnly: true, maxAge: 3600000 }); // Securely store token in a cookie
      res.redirect('/game'); // Redirect to main game page
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

    const token = jwt.sign({ userId: user.user_id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: "1h" });

    res.cookie("token", token, { httpOnly: true, maxAge: 3600000 }); // Securely store token in a cookie
    
    // ✅ Fix: Send JSON response instead of redirecting
    res.json({ success: true, redirectUrl: "/game" });
  });
});


// Logout Route
router.get('/logout', (req, res) => {
  res.clearCookie("token");  // Clear the JWT token from the cookie
  res.redirect('/');  // Redirect to the home page (index.ejs)
});



// **Game Page - Protected Route**
router.get('/game', authenticate, (req, res) => {
  // Fetch current circles and characters
  const query = `
    SELECT c.circle_id, ch.character_id, ch.name, ch.likes_compliment, ch.likes_help, ch.likes_invite
    FROM circles c
    JOIN characters ch ON ch.character_id IN (c.character_1, c.character_2, c.character_3)
    ORDER BY c.circle_id;
  `;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error.", error: err });

    // Group characters by circle
    let circles = {};
    results.forEach(row => {
      if (!circles[row.circle_id]) {
        circles[row.circle_id] = { circle_id: row.circle_id, characters: [] };
      }
      circles[row.circle_id].characters.push(row);
    });

    res.render('game', { username: req.user.username, circles: Object.values(circles) });
  });
});

// **Handle User Action (Compliment, Help, Invite)**
router.post('/game/action', authenticate, (req, res) => {
  const { circle_id, action_type } = req.body;
  if (!circle_id || !action_type) {
    return res.status(400).json({ message: "Missing parameters." });
  }

  // Fetch characters in the circle
  const query = `
    SELECT ch.character_id, ch.likes_compliment, ch.likes_help, ch.likes_invite
    FROM circles c
    JOIN characters ch ON ch.character_id IN (c.character_1, c.character_2, c.character_3)
    WHERE c.circle_id = ?;
  `;

  connection.query(query, [circle_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error.", error: err });

    let updates = [];
    results.forEach(character => {
      let happinessChange = 0;
      if (action_type === 'compliment') happinessChange = character.likes_compliment;
      if (action_type === 'help') happinessChange = character.likes_help;
      if (action_type === 'invite') happinessChange = character.likes_invite;

      updates.push([character.character_id, req.user.userId, circle_id, action_type, happinessChange]);
    });

    // Insert actions and update happiness scores
    const actionQuery = "INSERT INTO user_actions (user_id, circle_id, action_type) VALUES ?";
    const happinessQuery = `
      INSERT INTO happiness_scores (character_id, round_number, happiness)
      VALUES ?
      ON DUPLICATE KEY UPDATE happiness = happiness + VALUES(happiness);
    `;

    connection.query(actionQuery, [updates.map(u => [req.user.userId, u[1], u[3]])], (err) => {
      if (err) return res.status(500).json({ message: "Error recording action.", error: err });

      connection.query(happinessQuery, [updates.map(u => [u[0], 1, u[4]])], (err) => {
        if (err) return res.status(500).json({ message: "Error updating happiness.", error: err });

        res.json({ message: "Action recorded successfully." });
      });
    });
  });
});



//UPDATE POINTS
router.post('/updatePoints', authenticate, (req, res) => {
  const { average } = req.body;
  console.log('Received Average:', average);
  console.log('Authenticated User:', req.user);



  // Extract userId from JWT (from req.user)
  const userId = req.user.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User not logged in' });
  }
  
  // Convert average to a number
  const avgPoints = Number(average);

  // Check if average is a valid number
  if (isNaN(avgPoints)) {
    return res.status(400).json({ message: 'Invalid points value' });
  }

  // SQL query to update the user's points
  const query = `
    UPDATE users 
    SET points = points + ? 
    WHERE user_id = ?
  `;

  connection.query(query, [avgPoints, userId], (err, result) => {
    if (err) {
      console.error('Error updating points:', err); // Log the actual error here
      return res.status(500).json({ message: 'Server error', error: err.message });
    }

    // If no rows were affected, something went wrong (e.g., no user found)
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    res.json({ message: 'Points updated successfully' });
  });
});









module.exports = router;
