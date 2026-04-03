import express from "express";
import cors from "cors";

const app=express();

app.use(cors());
app.use(express.json());

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

const playlists = [
    '37i9dQZF1DX58gKmCfKS2T', //most streamed rap
    '5ABHKGoOzxkaa28ttQV9sE', //top 100
    '5vjkeivnYGdxWaIlWoPU5b', //late
    '7zBtaPiTRGRRxLtp8UK6aI', //freak
]

const allTracks = (await Promise.all(
    playlists.map(async (id) => {
        const res = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        return data.items;
    })
)).flat();

// Deduplicate artists by Spotify ID
const artistMap = new Map();
for (const item of allTracks) {
    for (const artist of item.track.artists) {
        if (!artistMap.has(artist.id)) {
            artistMap.set(artist.id, { id: artist.id, name: artist.name });
        }
    }
}

