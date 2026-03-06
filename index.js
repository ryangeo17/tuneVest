import express from "express"; 
import fs from "fs"; 
import cors from "cors";
import artists from "./seed.js";
const app= express();
const port =3000;
app.use(cors());
app.use(express.json());

const users =[];
const trades = [];


function search(array, string) {
    return array.find(item => item.name === string);
}


let currentArtistID =() =>{
    let max = 0;
    for (const a of artists) {
        if (a.id > max) max = a.id;
    }
    return max;
}
let currentUserID =() =>{
    let max = 0;
    for (const a of artists) {
        if (a.id > max) max = a.id;
    }
    return max;
}
let currentTradeID =() =>{
    let max = 0;
    for (const a of artists) {
        if (a.id > max) max = a.id;
    }
    return max;
}

//GETs
app.get("/", (req, res)=>{
    res.send("Welcome to TuneVest!");
});

app.get("/artists", (req, res)=>{
    res.json(artists);
});
app.get("/users", (req, res)=>{
    res.json(users);
});
app.get("/trades", (req, res)=>{
    res.json(trades);
});

//POSTs

app.post("/artists", (req, res)=>{
    const {name, price, genre}=req.body;
    if(!name||!price||!genre){
        return res.status(400).json({error:"name, price, and category are required"});
    }
    const newItem={
        id: currentArtistID,
        name,
        price,
        genre
    };

    artists.push(newItem);
    currentArtistID+=1;
    res.status(201).json({message:'Added!', item: newItem});
});

app.post("/users", (req, res)=>{
    const {name}=req.body;
    if(!name){
        return res.status(400).json({error:"name required"});
    }
    const newItem={
        id: currentUserID,
        name,
    };

    users.push(newItem);
    currentUserID+=1;
    res.status(201).json({message:'Added!', item: newItem});
});
app.post("/trades", (req, res)=>{
    const{userName, artistName, quantity}=req.body;
    const userID=search(userName, users);
    const artistID=search(artistName, artists);
    const newItem={
        id:currentTradeID,
        userID,
        artistID,
        quantity,
    };
    trades.push(newItem);
    currentTradeID+=1;
    res.status(201).json({message:'Added!', item: newItem});
});


app.listen(3000,'localhost', ()=>{
    console.log('Server running at http://localhost:3000/');
});