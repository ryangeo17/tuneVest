
import pool from "./tuneVest-backend/db.js";
import { fetchMonthlyListeners } from "./priceEngine.js";

const clientID=process.env.SPOTIFY_CLIENT_ID;
const clientSecret=process.env.SPOTIFY_CLIENT_SECRET;

const auth = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');

const res= await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'grant_type=client_credentials'
});
const data = await res.json();
const token = data.access_token;
console.log('Token:', token ? 'OK' : 'FAILED', data.error || '');



const artistMap = new Map();

async function populateArtistMap() {
    const genres = ['pop', 'hip-hop', 'rock', 'r-n-b', 'latin', 'country', 'indie', 'electronic', 'rap', 'k-pop'];

    for (const genre of genres) {
        for (const offset of [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]) {
            try {
                const searchRes = await fetch(
                    `https://api.spotify.com/v1/search?q=genre%3A${encodeURIComponent(genre)}&type=artist&limit=10&offset=${offset}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                const searchData = await searchRes.json();

                if (searchData.error) {
                    console.error(`Search error for "${genre}" offset ${offset}:`, searchData.error.message);
                    continue;
                }

                const artists = searchData.artists?.items || [];
                for (const artist of artists) {
                    if (artist && artist.id && !artistMap.has(artist.id)) {
                        artistMap.set(artist.id, { name: artist.name, spotify_artist_id: artist.id });
                    }
                }

                await new Promise(r => setTimeout(r, 300));
            } catch (err) {
                console.error(`Failed searching genre "${genre}" offset ${offset}:`, err.message);
            }
        }
        console.log(`Genre "${genre}" done — ${artistMap.size} unique artists so far`);
    }

    console.log(`\nPopulated artistMap with ${artistMap.size} unique artists total\n`);
}

await populateArtistMap();

// Get montly listeners and add artist data into database
for (const [spotifyId, artist] of artistMap) {
    try {
        const listeners = await fetchMonthlyListeners(spotifyId);
        if (!listeners) {
            console.log(`Skipping ${artist.name} — couldn't get listener count`);
            continue;
        }
        const price = listeners / 1000;
        await pool.query(
            `INSERT INTO artists (name, price, spotify_artist_id, monthly_listeners)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (spotify_artist_id) DO NOTHING`,
            [artist.name, price, spotifyId, listeners]
        );
        console.log(`Inserted ${artist.name}: ${listeners} listeners, $${price.toFixed(2)}`);
    } catch (err) {
        console.error(`Failed on ${artist.name}:`, err.message);
    }
    // delay to avoid Spotify blocking you
    await new Promise(r => setTimeout(r, 2500));
}

pool.end();


