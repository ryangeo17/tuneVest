import puppeteer from "puppeteer";
import pool from "./tuneVest-backend/db.js";

async function fetchMonthlyListeners(spotifyArtistId) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`https://open.spotify.com/artist/${spotifyArtistId}`, {
      waitUntil: "networkidle2",
    });

    await page.waitForFunction(() => {
      return document.body.innerText.toLowerCase().includes("monthly listeners");
    });

    const rawText = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.toLowerCase().includes("monthly listeners")) {
          return walker.currentNode.textContent.trim();
        }
      }
      return null;
    });

    if (!rawText) return null;
    return parseInt(rawText.replace(/[^0-9]/g, ""), 10);
  } finally {
    await browser.close();
  }
}

async function updatePrices() {
  console.log("Starting price update...");
  const { rows: artists } = await pool.query(
    "SELECT id, name, price, monthly_listeners, spotify_artist_id FROM artists"
  );

  let updated = 0;

  for (const artist of artists) {
    if (!artist.spotify_artist_id || !artist.monthly_listeners || artist.monthly_listeners === 0) {
      console.log(`Skipping ${artist.name} — no baseline listener data`);
      continue;
    }

    try {
      const newListeners = await fetchMonthlyListeners(artist.spotify_artist_id);

      if (newListeners === null) {
        console.log(`Skipping ${artist.name} — failed to fetch listeners`);
        continue;
      }

      const percentChange = (newListeners - artist.monthly_listeners) / artist.monthly_listeners;
      let newPrice = Number(artist.price) * (1 + 2 * percentChange);
      newPrice = Math.max(0.01, Math.round(newPrice * 100) / 100);

      await pool.query(
        "UPDATE artists SET price = $1, monthly_listeners = $2 WHERE id = $3",
        [newPrice, newListeners, artist.id]
      );

      await pool.query(
        "INSERT INTO price_history (artist_id, price, monthly_listeners) VALUES ($1, $2, $3)",
        [artist.id, newPrice, newListeners]
      );

      console.log(
        `${artist.name}: listeners ${artist.monthly_listeners} → ${newListeners}, price $${artist.price} → $${newPrice}`
      );

      updated++;
    } catch (err) {
      console.log(`Error updating ${artist.name}: ${err.message}`);
    }

    // 2500ms delay between artists to avoid Spotify blocking
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  console.log(`Price update complete. Updated ${updated} of ${artists.length} artists.`);
}

export { fetchMonthlyListeners, updatePrices };
