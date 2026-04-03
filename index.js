import 'dotenv/config';
import express from "express"; 
import cors from "cors";
import pool from "./tuneVest-backend/db.js";

const app= express();
const port =3000;
app.use(cors());
app.use(express.json());


//GETs
app.get("/", (req, res)=>{
    res.send("Welcome to TuneVest!");
});

app.get("/artists", async (req, res)=>{
    const result = await pool.query("SELECT * FROM artists");
    res.json(result.rows);
});

app.get("/artists/:id", async (req, res)=>{
    const result = await pool.query("SELECT* FROM artists WHERE id = $1",[req.params.id]);
    if (result.rows.length>0) {
        res.json(result.rows[0]);
    } 
    else {
        res.status(404).json({error: "Artist not found"});
    }
});

app.get("/users", async (req, res)=>{
    const result= await pool.query("SELECT* FROM users");
    res.json(result.rows);
});

app.get("/users/:id", async (req, res)=>{
    const result = await pool.query("SELECT* FROM users WHERE id = $1", [req.params.id]);
    if (result.rows.length>0) {
        res.json(result.rows[0]);
    } 
    else {
        res.status(404).json({error: "User not found"});
    }
});

app.get("/trades", async (req, res)=>{
    const result= await pool.query("SELECT * FROM trades");
    res.json(result.rows);
});
//gets all the trades one user has
app.get("/trades/user/:userId", async (req, res) => {
    const result = await pool.query("SELECT * FROM trades WHERE user_id = $1", [req.params.userId]);
    res.json(result.rows);
});

app.get("/trades/:id", async (req, res)=>{
    const result = await pool.query("SELECT* FROM trades WHERE id = $1", [req.params.id]);
     if (result.rows.length>0) {
        res.json(result.rows[0]);
    } 
    else {
        res.status(404).json({error: "Trade not found"});
    }
});

app.get("/holdings/:userId", async (req, res) => {
    const result = await pool.query("SELECT * FROM holdings WHERE user_id = $1", [req.params.userId]);
    res.json(result.rows);
});


app.get("/portfolio/:userId", async  (req, res) => {
    const result = await pool.query(
        `SELECT h.shares, a.price 
         FROM holdings h 
         JOIN artists a ON h.artist_id = a.id 
         WHERE h.user_id = $1`,
        [req.params.userId]
    );
    let portfolioValue=0;
    for (const holding of result.rows){
        portfolioValue += holding.shares * holding.price;
    }
    res.json({ userId: req.params.userId, portfolioValue });
});

//POSTs

app.post("/artists", async (req, res)=>{
    const {name, price, genre}=req.body;
    if(!name||!price||!genre){
        return res.status(400).json({error:"name, price, and genre are required"});
    }
    const result = await pool.query(
        "INSERT INTO artists (name, price, genre) VALUES ($1, $2, $3) RETURNING*",
        [name,price,genre]
    );

    res.status(201).json({message:'Added!', item: result.rows[0]});
});

app.post("/users", async (req, res)=>{
    const {name}=req.body;
    if(!name){
        return res.status(400).json({error:"name required"});
    }
    const result = await pool.query(
        "INSERT INTO users (name) VALUES ($1) RETURNING*",
        [name]
    );
    res.status(201).json({message:'Added!', item: result.rows[0]});
});

app.post("/trades", async (req, res)=>{
    const{userName, artistName, quantity}=req.body;

    if (!userName||!artistName||!quantity){
        return res.status(400).json({error:"userName, artistName, and quantity are required"});
    }
    
    const userResult = await pool.query("SELECT * FROM users WHERE name = $1",[userName]);
    const user=userResult.rows[0];

    const artistResult = await pool.query("SELECT * FROM artists WHERE name = $1",[artistName]);
    const artist=artistResult.rows[0];

    if (!user) return res.status(404).json({ error: "User not found" });
    if (!artist) return res.status(404).json({ error: "Artist not found" });

    const totalPrice = artist.price * quantity;  
    if (totalPrice > user.balance){
        return res.status(409).json({error:"Insufficient balance"});
    }

    const tradeResult = await pool.query(
        "INSERT INTO trades (user_id, artist_id, quantity, price_purchased) VALUES ($1, $2, $3, $4) RETURNING *",
        [user.id, artist.id, quantity, artist.price]
    );
    
    await pool.query(
        "UPDATE users SET balance = balance-$1 WHERE id = $2",
        [totalPrice, user.id]
    )
    
    await pool.query(`
        INSERT INTO holdings (user_id, artist_id, shares)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, artist_id) DO UPDATE SET shares = holdings.shares + $3
    `, [user.id, artist.id, quantity]);
    
    res.status(201).json({message:'Added!', item: tradeResult.rows[0]});
});


//DELETEs
app.delete("/users/:id", async (req, res) => {
    const { id } = req.params;
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (user.rows.length === 0) return res.status(404).json({ error: "User not found" });

    await pool.query("DELETE FROM holdings WHERE user_id = $1", [id]);
    await pool.query("DELETE FROM trades WHERE user_id = $1", [id]);
    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    res.json({ message: "User deleted" });
});


//PATCHs
app.patch("/artists/:id", async (req, res) => {
    const { id } = req.params;
    const { price } = req.body;
    if (price === undefined) return res.status(400).json({ error: "price is required" });

    const result = await pool.query(
        "UPDATE artists SET price = $1 WHERE id = $2 RETURNING *",
        [price, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Artist not found" });

    res.json({ message: "Artist updated", artist: result.rows[0] });
});





app.listen(port,'localhost', ()=>{
    console.log(`Server running at http://localhost:${port}/`);
});