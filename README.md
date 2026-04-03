# TuneVest

TuneVest is a fantasy stock market for music artists. Users invest virtual currency in their favorite artists, track portfolio value, and trade shares — all driven by real artist data pulled from Spotify.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 5
- **Database**: PostgreSQL (via `pg` connection pool)
- **External API**: Spotify Web API (artist/track data)
- **Other**: `dotenv`, `cors`, `puppeteer`

---

## Current Features

### Artists
- `GET /artists` — list all artists
- `GET /artists/:id` — get a single artist by ID
- `POST /artists` — add a new artist (name, price, genre)
- `PATCH /artists/:id` — update an artist's share price

### Users
- `GET /users` — list all users
- `GET /users/:id` — get a single user by ID
- `POST /users` — create a new user
- `DELETE /users/:id` — delete a user and all associated trades/holdings

### Trades
- `GET /trades` — list all trades
- `GET /trades/:id` — get a single trade
- `GET /trades/user/:userId` — get all trades for a specific user
- `POST /trades` — execute a buy trade (validates balance, updates holdings)

### Holdings & Portfolio
- `GET /holdings/:userId` — get all holdings for a user
- `GET /portfolio/:userId` — calculate total portfolio value for a user

### Data Seeding
- `seedArtists.js` pulls tracks from curated Spotify playlists and deduplicates artists by Spotify ID

---

## Coming Soon

- **Sell trades** — allow users to sell shares back to the market
- **Price engine** (`priceEngine.js`) — dynamic artist pricing based on streaming data, popularity, or market activity
- **Leaderboard** — rank users by portfolio value
- **Authentication** — user login and session management
- **Frontend** — UI for browsing artists, trading, and viewing portfolios
- **Price history** — track artist price changes over time

---

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with:
   ```
   DATABASE_URL=your_postgres_connection_string
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```

3. Start the server:
   ```bash
   node index.js
   ```

Server runs at `http://localhost:3000`
