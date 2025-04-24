
# 🎉 Social Circles Game

A web-based social strategy game where you interact with characters in dynamic social circles to earn points and rise up the leaderboard.

---

## 🧠 Project Overview

Social Circles lets users:
- Create accounts
- Join a game with randomly assigned character circles
- Take actions (compliment, help, invite) that affect character happiness
- Earn points and climb the leaderboard
- Use points to buy name upgrades in the store

---

## 🚀 Tech Stack

- **Frontend:** EJS + HTML/CSS + jQuery
- **Backend:** Node.js + Express
- **Database:** MySQL
- **Authentication:** JWT
- **Deployment:** Azure Web App

---

## 🔧 Developer Setup Guide

1. **Clone the repo**
   ```bash
   git clone https://github.com/green-thomas-wyatt/social_circle_project.git
   cd social_circle_project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the environment**
   Create a `.env` file with:
   ```env
   JWT_SECRET=your_jwt_secret_here
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=Social_Game
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Run automated tests**
   ```bash
   npm test
   ```

---

## 🎮 User How-To Guide

1. **Sign Up**
   - Enter username and password on the home page

2. **Log In**
   - Use credentials to enter the game

3. **Game Page**
   - Visit `/game`
   - Choose an action for each circle
   - Happiness scores update
   - Click “Reset Happiness” to reset everything

4. **Store**
   - Visit `/store` and use points to buy effects like ⭐, 💎, 🔥

5. **Leaderboard**
   - `/leaderboard` shows top users by total points

6. **Profile**
   - `/profile` shows your username and current point total

---

## ☁️ Azure Deployment Notes

This app is deployed on Microsoft Azure.

- **Azure Web App** hosts the Node.js service
- **MySQL DB** runs locally or remotely

To deploy or edit:
- Use the Azure portal (App Service → Configuration for ENV settings)
- Link to GitHub or use FTP to push changes
- Access logs and restarts from Azure dashboard

---

## 🧪 Testing Suite (Mocha + Chai + Supertest)

Automated tests are located in the `/test` folder.

### Run all tests:
```bash
npm test
```

### Includes:
- Authentication: Signup, login validation
- Route access protection (game, store, leaderboard)
- More tests can be added for in-game actions and purchases

---

## 🐞 Known Issues & TODOs

- [ ] Reset happiness only works for round 1
- [ ] No account edit features
- [ ] No admin view or global analytics
- [ ] Store purchases not yet auto-tested
- [ ] Logout redirects but doesn’t give a “You’ve been logged out” message

---

## 🤝 Team

- **Wyatt Green** – CS Junior, Triniteers, Football
- **Cole Conway** – CS Sophomore, Triniteers, Football
- **Trevor Truesdell** – CS Junior, Phi Sig

---

Built for Spring 2025 Software Project 🚀
