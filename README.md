# Parlay Betting League Manager

A complete web application for managing weekly parlay betting leagues with automatic game results checking.

## Features

✅ **Admin Dashboard**
- Upload weekly odds via CSV
- View all 16 participants' picks in real-time
- Lock picks before games start
- Automatic results checking from live scores
- Winner determination (3/3 picks correct)

✅ **User Interface**
- Clean, mobile-friendly pick selection
- Select exactly 3 picks from available games
- Choose between spread, over, or under for each game
- Real-time pick validation
- Instant submission confirmation

✅ **Automatic Results**
- Fetches live game scores
- Compares picks against actual results
- Identifies perfect parlays (3/3 correct)
- Displays winners with highlights

## Quick Start

### Option 1: Run Locally with Node.js

1. **Install dependencies:**
```bash
npm install react react-dom lucide-react
npm install -D vite @vitejs/plugin-react
```

2. **Create project structure:**
```
parlay-league/
├── src/
│   ├── App.jsx (the main component)
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

3. **Create main.jsx:**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import ParlayLeague from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ParlayLeague />
  </React.StrictMode>
);
```

4. **Create index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parlay League</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

5. **Create vite.config.js:**
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

6. **Start development server:**
```bash
npx vite
```

Open http://localhost:5173 in your browser.

### Option 2: Deploy to Vercel (Recommended for Production)

1. Create a GitHub repository with your code
2. Go to https://vercel.com
3. Import your repository
4. Vercel will auto-detect React and deploy
5. Share the URL with your league members

### Option 3: Deploy to Netlify

1. Create a GitHub repository
2. Go to https://netlify.com
3. Connect your repository
4. Build command: `npm run build`
5. Publish directory: `dist`

## CSV Format for Odds Upload

Create a CSV file with this exact format:

```csv
League,Home Team,Away Team,Spread,Over/Under,Time
NFL,Kansas City Chiefs,Buffalo Bills,KC -3.5,O/U 52.5,Sun 1:00 PM
NFL,San Francisco 49ers,Dallas Cowboys,SF -6,O/U 48.5,Sun 4:25 PM
NCAAF,Alabama,Georgia,ALA -2.5,O/U 55,Sat 7:00 PM
```

**Important:**
- First row must be the header
- Use commas to separate fields
- Spread format: "TEAM -X" or "TEAM +X"
- Over/Under format: "O/U XX.X"

## Adding Automatic Score Fetching

The app currently uses mock results. To integrate real scores:

### Option A: The Odds API (Recommended)

1. Sign up at https://the-odds-api.com (free tier: 500 requests/month)

2. Add this function to fetch real scores:

```javascript
const fetchGameResults = async (apiKey) => {
  const response = await fetch(
    `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores/?apiKey=${apiKey}&daysFrom=1`
  );
  const data = await response.json();
  
  return data.map(game => ({
    gameId: game.id,
    homeScore: game.scores?.find(s => s.name === game.home_team)?.score || 0,
    awayScore: game.scores?.find(s => s.name === game.away_team)?.score || 0,
    completed: game.completed
  }));
};
```

3. Replace the `checkResults` function mock with:

```javascript
const checkResults = async () => {
  const apiKey = 'YOUR_API_KEY_HERE';
  const realResults = await fetchGameResults(apiKey);
  // ... rest of winner determination logic
};
```

### Option B: ESPN API (Free, Unofficial)

```javascript
const fetchESPNScores = async () => {
  const nflResponse = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
  const cfbResponse = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard');
  
  const nflData = await nflResponse.json();
  const cfbData = await cfbResponse.json();
  
  return [...nflData.events, ...cfbData.events].map(event => ({
    homeTeam: event.competitions[0].competitors.find(c => c.homeAway === 'home').team.displayName,
    awayTeam: event.competitions[0].competitors.find(c => c.homeAway === 'away').team.displayName,
    homeScore: parseInt(event.competitions[0].competitors.find(c => c.homeAway === 'home').score),
    awayScore: parseInt(event.competitions[0].competitors.find(c => c.homeAway === 'away').score),
    completed: event.status.type.completed
  }));
};
```

## Adding Persistent Storage

To save picks and results between sessions, add a backend:

### Simple Option: Firebase

```bash
npm install firebase
```

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  // Your config from Firebase console
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Save picks
const savePicks = async (user, picks) => {
  await addDoc(collection(db, 'picks'), {
    user,
    picks,
    week,
    timestamp: new Date()
  });
};

// Load picks
const loadPicks = async (week) => {
  const querySnapshot = await getDocs(collection(db, 'picks'));
  const allPicks = {};
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.week === week) {
      allPicks[data.user] = data.picks;
    }
  });
  return allPicks;
};
```

### Advanced Option: Build a Node.js Backend

Create an Express.js API to handle:
- User authentication
- Pick storage in PostgreSQL/MongoDB
- Scheduled jobs to check results automatically
- Email notifications when results are ready

## Customization

### Change Theme Colors

Modify the CSS variables in the `<style>` section:

```css
/* Current theme: Purple/Cyan Vegas style */
/* Purple gradient: #8b5cf6, #ec4899 */
/* Cyan accent: #22d3ee */

/* To change to different colors: */
background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
```

### Add More Pick Types

Extend the pick options to include:
- Moneyline bets
- Player props
- Team totals

### Email Notifications

Add nodemailer to send:
- Pick confirmation emails
- Weekly pick summary to admin
- Winner announcements

## User Workflow

1. **Admin uploads CSV** with weekly odds (typically Thursday/Friday)
2. **Users make picks** throughout the week (deadline: before first game)
3. **Admin locks picks** when deadline hits
4. **Games are played** over the weekend
5. **Admin clicks "Fetch Game Results"** (Sunday night/Monday)
6. **App automatically determines winners** (3/3 correct picks)
7. **Winners announced** to the group

## Security Notes

For production use:
- Add user authentication (Firebase Auth, Auth0, or custom)
- Validate CSV uploads server-side
- Rate limit API requests
- Sanitize all user inputs
- Use environment variables for API keys
- Add HTTPS for deployment

## Troubleshooting

**Picks not saving:**
- Check browser console for errors
- Ensure you've entered a username
- Verify you've selected exactly 3 picks

**CSV upload not working:**
- Verify CSV format matches template exactly
- Check for extra commas or line breaks
- Ensure file encoding is UTF-8

**Results not calculating correctly:**
- Verify spread format: "TEAM -X.X"
- Check that game IDs match between odds and results
- Console.log the results object to debug

## Support

For issues or feature requests, contact the league admin or modify the code as needed!

## License

Free to use and modify for your betting league. Have fun and gamble responsibly! 🎰
