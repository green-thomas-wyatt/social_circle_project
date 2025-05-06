var express = require('express');
var router = express.Router();
var connection = require('../database/connection'); 
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
require('dotenv').config();
var functions = require('../functions/index_functions.js'); // Import functions

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
  const message = req.query.message;
  connection.query('SELECT * FROM users WHERE user_id = ?', [req.user.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error.", error: err });
    res.render('profile', {
      username: req.user.username,
      userData: results[0],
      message: message
    });
  });
});



router.post('/profile/update-password', authenticate, (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.userId;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).send("All fields are required.");
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).send("New passwords do not match.");
  }

  connection.query('SELECT password_hash FROM users WHERE user_id = ?', [userId], (err, results) => {
  if (err) {
    console.error('Database error:', err);
    return res.status(500).send("Database error occurred");
  }

  if (results.length === 0) {
    return res.status(404).send("User not found");
  }

  bcrypt.compare(currentPassword, results[0].password_hash, (err, isMatch) => {
    if (err) {
      console.error('Password comparison error:', err);
      return res.status(500).send("Error checking password");
    }
    
    if (!isMatch) {
      return res.status(400).send("Current password is incorrect");
    }

    bcrypt.hash(newPassword, 10, (err, newHash) => {
      if (err) {
        console.error('Password hashing error:', err);
        return res.status(500).send("Error hashing password");
      }

      connection.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newHash, userId], (err) => {
        if (err) {
          console.error('Database update error:', err);
          return res.status(500).send("Failed to update password");
        }
        
        res.redirect('/profile?message=Password updated successfully');
      });
    });
    });
  });
});


router.post('/profile/update-username', authenticate, (req, res) => {
  const { newUsername } = req.body;
  const userId = req.user.userId;

  if (!newUsername || newUsername.trim().length === 0) {
    return res.status(400).send("Username cannot be empty.");
  }

  connection.query('SELECT user_id FROM users WHERE username = ?', [newUsername], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send("Database error occurred.");
    }

    if (results.length > 0) {
      return res.status(400).send("Username is already taken.");
    }

    connection.query(
      'UPDATE users SET username = ? WHERE user_id = ?',
      [newUsername, userId],
      (err) => {
        if (err) {
          console.error('Update error:', err);
          return res.status(500).send("Failed to update username.");
        }

        req.user.username = newUsername;
        res.redirect('/profile?message=Username updated successfully');
      }
    );
  });
});



// Signup Route
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  console.log("📝 Signup attempt:", username);

  if (!username || !password) {
    console.error("❌ Missing username or password");
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO users (username, password_hash) VALUES (?, ?)";

    connection.query(query, [username, hashedPassword], (err, result) => {
      if (err) {
        console.error("❌ Error inserting user:", err);
        return res.status(500).json({ message: "User already exists or DB error.", error: err });
      }

      const userId = result.insertId;

      // Fetch character IDs for circle initialization
      connection.query("SELECT character_id FROM characters", (err, charResults) => {
        if (err) {
          console.error("❌ Error fetching characters:", err);
          return res.status(500).json({ message: "Error initializing user data." });
        }

        const characterIds = charResults.map(c => c.character_id);
        for (let i = characterIds.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [characterIds[i], characterIds[j]] = [characterIds[j], characterIds[i]];
        }

        const userCircleData = [];
        for (let i = 0; i < 3; i++) {
          const circleChars = characterIds.slice(i * 3, i * 3 + 3);
          circleChars.forEach(charId => {
            userCircleData.push([userId, i + 1, charId]);
          });
        }

        const insertCirclesQuery = `INSERT INTO user_circles (user_id, circle_id, character_id) VALUES ?`;
        connection.query(insertCirclesQuery, [userCircleData], (err) => {
          if (err) {
            console.error("❌ Error inserting user circles:", err);
            return res.status(500).json({ message: "Error creating circles." });
          }

          const token = jwt.sign({ userId, username, role: "logged_in" }, SECRET_KEY, { expiresIn: "1h" });

          res.cookie("token", token, { httpOnly: true, maxAge: 3600000 });
          console.log("✅ Signup and initialization complete for", username);
          res.redirect('/game');
        });
      });
    });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).json({ message: "Error hashing password.", error });
  }
});

// Login Route

router.get('/login', (req, res) => {
  res.render('index', { message: req.query.message });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  console.log("🔐 Login attempt:", username);

  if (!username || !password) {
    console.error("❌ Missing username or password");
    return res.status(400).json({ message: "Username and password required." });
  }

  const query = "SELECT * FROM users WHERE username = ?";
  connection.query(query, [username], async (err, results) => {
    if (err) {
      console.error("❌ Database error during login:", err);
      return res.status(500).json({ message: "Database error.", error: err });
    }

    if (results.length === 0) {
      console.warn("⚠️ Login failed: user not found:", username);
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const user = results[0];
    try {
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        console.warn("⚠️ Login failed: invalid password for", username);
        return res.status(401).json({ message: "Invalid username or password." });
      }

      const token = jwt.sign({ userId: user.user_id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: "1h" });

      res.cookie("token", token, { httpOnly: true, maxAge: 3600000 });
      console.log("✅ Login success for", username);
      res.json({ success: true, redirectUrl: "/game" });

    } catch (error) {
      console.error("❌ Error validating password:", error);
      res.status(500).json({ message: "Authentication failed.", error });
    }
  });
});

// Logout Route
router.get('/logout', (req, res) => {
  res.clearCookie("token");
  res.redirect('/login?message=Logged out successfully');
});

// Game Page - Protected Route
router.get('/game', authenticate, (req, res) => {
  const userId = req.user.userId;
  connection.query('SELECT username, current_style FROM users WHERE user_id = ?', [userId], (err, userResults) => {
    if (err) return res.status(500).json({ message: "Database error.", error: err });

    const { username, current_style } = userResults[0];
    const decoratedUsername = applyStyle(username, current_style);

    return res.render('game', {
      username: decoratedUsername,
      hasStyle: !!current_style //  true if they have a style, false if null
    });
  });
  //const vals = getCircle(userId);  // Fetch circles
  //res.render('game', vals);
});

router.get('/game/values', authenticate, (req, res) => {
  const query = `
    SELECT uc.circle_id, ch.character_id, ch.name, ch.likes_compliment, ch.likes_help, ch.likes_invite,
          IFNULL(hs.happiness, 0) AS happiness
    FROM user_circles uc
    JOIN characters ch ON uc.character_id = ch.character_id
    LEFT JOIN happiness_scores hs 
      ON hs.character_id = ch.character_id AND hs.user_id = ? AND hs.round_number = 1
    WHERE uc.user_id = ?
    ORDER BY uc.circle_id;
  `;

  const userId = req.user.userId;
  connection.query(query, [userId, userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error.", error: err });

    let circles = {};
    results.forEach(row => {
      if (!circles[row.circle_id]) {
        circles[row.circle_id] = { circle_id: row.circle_id, characters: [] };
      }
      circles[row.circle_id].characters.push(row);
    });
    console.log("Circles data:", circles);
    return res.render('game_data', {
        circles: Object.values(circles)
      });
  });

});

// Helper function
function applyStyle(username, style) {
  switch (style) {
    case '⭐ Starred Name':
      return `⭐${username}⭐`;
    case '🔥 Fire Name':
      return `🔥${username}🔥`;
    case '💎 Diamond Name':
      return `💎${username}💎`;
    case '👑 Crown Name':
      return `👑${username}`;
    case '🌈 Rainbow Name':
      return `🌈${username}🌈`;
    default:
      return username;
  }
}

router.post('/game/action', authenticate, (req, res) => {
  const { circle_id, action_type } = req.body;
  const userId = req.user.userId;

  if (!circle_id || !action_type) {
    return res.status(400).json({ message: "Missing parameters." });
  }

  const fetchCharactersQuery = `
    SELECT ch.character_id, ch.likes_compliment, ch.likes_help, ch.likes_invite
    FROM user_circles uc
    JOIN characters ch ON uc.character_id = ch.character_id
    WHERE uc.user_id = ? AND uc.circle_id = ?;
  `;

  connection.query(fetchCharactersQuery, [userId, circle_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching characters.", error: err });

    const updates = results.map(character => {
      let happinessChange = 0;
      if (action_type === 'compliment') happinessChange = character.likes_compliment;
      if (action_type === 'help') happinessChange = character.likes_help;
      if (action_type === 'invite') happinessChange = character.likes_invite;
      return [userId, character.character_id, 1, happinessChange];
    });

    const actionQuery = `
      INSERT INTO user_actions (user_id, circle_id, action_type)
      VALUES (?, ?, ?)
    `;

    connection.query(actionQuery, [userId, circle_id, action_type], (err) => {
      if (err) return res.status(500).json({ message: "Error recording action.", error: err });

      const happinessQuery = `
        INSERT INTO happiness_scores (user_id, character_id, round_number, happiness)
        VALUES ?
        ON DUPLICATE KEY UPDATE happiness = happiness + VALUES(happiness)
      `;

      connection.query(happinessQuery, [updates], (err) => {
        if (err) {
          console.error("🔥 Error in happiness insert:", err.sqlMessage || err.message);
          return res.status(500).json({ message: "Error updating happiness.", error: err });
        }

        // Now shuffle characters and save new layout
        connection.query("SELECT character_id FROM characters", (err, charResults) => {
          if (err) return res.status(500).json({ message: "Error fetching characters for shuffle." });

          const allCharIds = charResults.map(c => c.character_id);
          for (let i = allCharIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCharIds[i], allCharIds[j]] = [allCharIds[j], allCharIds[i]];
          }

          const userCircleData = [];
          for (let i = 0; i < 3; i++) {
            const circleChars = allCharIds.slice(i * 3, i * 3 + 3);
            circleChars.forEach(charId => {
              userCircleData.push([userId, i + 1, charId]);
            });
          }

          // Delete old layout and insert new one
          connection.query("DELETE FROM user_circles WHERE user_id = ?", [userId], (err) => {
            if (err) return res.status(500).json({ message: "Failed to clear old circles." });

            connection.query(
              "INSERT INTO user_circles (user_id, circle_id, character_id) VALUES ?",
              [userCircleData],
              (err) => {
                if (err) return res.status(500).json({ message: "Failed to save new layout." });

                res.json({ message: "Action recorded and circles shuffled." });
              }
            );
          });
        });
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


router.post('/resetHappiness', authenticate, (req, res) => {
  const userId = req.user.userId;
  const query = `UPDATE happiness_scores SET happiness = 0 WHERE user_id = ? AND round_number = 1`;

  connection.query(query, [userId], (err) => {
    if (err) return res.status(500).json({ message: "Error resetting happiness", error: err });
    res.json({ message: "Your happiness scores have been reset." });
  });
});


//Purchase Route
router.post('/purchase', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const { itemId } = req.body;
  const val = await functions.purchaseItem(userId, itemId,connection);
  console.log("val " + val);
  const {status, send} = val;
  console.log("status" + status);
  console.log("send" + send);
  return res.status(Number(status)).send(send);
});

module.exports = router;
