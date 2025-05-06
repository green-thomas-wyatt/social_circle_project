async function purchaseItem(userId, itemId, connection) {
    if (!itemId) {
        return {status: 400, send: "Item ID is required"};
    }

    let ret = {status: 400, send: "need more time"};

    // Get item info (price and item_name)
    connection.query('SELECT item_name, price FROM store_items WHERE item_id = ?', [itemId], (err, results) => {
        if (err) ret = {status: 500, send: "Database error fetching item"};
        else {
            if (results.length === 0) {
                ret = {status: 404, send: "Item not found"};
            } else {
                const { item_name, price } = results[0];

                // Get user points
                connection.query('SELECT points FROM users WHERE user_id = ?', [userId], (err, userResults) => {
                    if (err) return {status: 500, send: "Database error fetching user points"};

                    const userPoints = userResults[0].points;

                    if (userPoints < price) {
                        ret = {status: 302, send: "<script>alert('Not enough points to purchase!'); window.location.href='/store';</script>"};
                    } else {
                        // Deduct points and apply style
                        connection.beginTransaction(err => {
                            if (err) ret = {status: 500, send: "Database transaction error"};

                            connection.query('UPDATE users SET points = points - ?, current_style = ? WHERE user_id = ?', [price, item_name, userId], (err) => {
                                if (err) ret = {status: 500, send: "Error updating user"};

                                connection.query('INSERT INTO purchases (user_id, item_id) VALUES (?, ?)', [userId, itemId], (err) => {
                                    if (err) ret = {status: 500, send: "Error recording purchase"};

                                    connection.commit(err => {
                                        if (err) ret = {status: 500, send: "Commit error"};
                                        ret = {status: 302, send: "<script>alert('Style applied successfully!'); window.location.href='/store';</script>"};
                                    });
                                });
                            });
                        });
                    }
                });
            }
        }
  });
  await new Promise(r => setTimeout(r, 240));

  return ret;
}

module.exports = {
    purchaseItem
};