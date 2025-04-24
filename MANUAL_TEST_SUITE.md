# Social Circles Web App – Manual Testing Suite

This file outlines a set of manual test cases that should be executed to validate key functionality.

---

## 1. Authentication

### ✅ Test: Signup with valid credentials
- Page: `/`
- Steps: Fill in both fields, click "Signup"
- Expected: Redirect to `/game`, user appears in DB
- Outcome:

### ⛔ Test: Signup with missing password
- Steps: Leave password blank, submit
- Expected: Error alert
- Outcome:

### ✅ Test: Login with valid credentials
- Steps: Enter correct login, click "Login"
- Expected: Redirect to `/game`, personalized greeting
- Outcome:

### ⛔ Test: Login with wrong password
- Steps: Enter correct username + wrong pass
- Expected: Login failure alert
- Outcome:

### ⛔ Test: Access /game without logging in
- Steps: Go directly to `/game` in incognito
- Expected: Redirect to login page
- Outcome:

---

## 2. Game Page

### ✅ Test: View 3 circles
- Page: `/game`
- Steps: Log in, view 3 circles with characters
- Outcome:

### ✅ Test: Use compliment/help/invite
- Steps: Try each button per circle
- Expected: Page reload, characters reshuffled, scores update
- Outcome:

### ✅ Test: Reset Happiness
- Steps: Click "Reset Happiness"
- Expected: All happiness values reset to 0
- Outcome:

---

## 3. Store + Profile

### ✅ Test: View Store
- Page: `/store`
- Steps: View item list, confirm formatting
- Outcome:

### ✅ Test: Purchase item with enough points
- Steps: Buy item, confirm style updates
- Outcome:

### ⛔ Test: Try to buy item without enough points
- Steps: Attempt purchase
- Expected: Error alert
- Outcome:

### ✅ Test: View Profile
- Page: `/profile`
- Steps: Confirm correct username and points displayed
- Outcome:

---

## 4. Leaderboard

### ✅ Test: View leaderboard
- Page: `/leaderboard`
- Expected: Top 10 users shown, ordered by points
- Outcome:

---

## 5. Database Validation (Optional)

- Check new user in `users` table
- Verify `user_circles` inserted on signup
- Confirm points are updated in `users`
- Check `purchases`, `user_actions`, `happiness_scores` populated