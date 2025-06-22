const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require("fs")

const app = express();
const server = createServer(app);
const io = new Server(server);

let ROOMS = {
    "WAMO": "countdown"
} // Room Name : Room Key

io.on("connection", (socket) => {
    // ...
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/lander.html")
})

app.get("/play", (req, res) => {
    let name = req.query.name
    let room = req.query.room.toUpperCase()
    let key = req.query.key

    if (!ROOMS.hasOwnProperty(room)){
        res.redirect('/?err=0')
        return
    }

    if (ROOMS[room] !== key){
        res.redirect('/?err=1')
        return
    }

    if (!name){
        res.redirect('/?err=2')
        return
    }
    res.sendFile(__dirname + "/play.html")
})


app.get("/styles/lander.css", (req, res) => {
    res.sendFile(__dirname + "/styles/lander.css")
})

app.get("/scripts/play.js", (req, res) => {
    res.sendFile(__dirname + "/scripts/play.js")
})

app.get("/scripts/lander.js", (req, res) => {
    res.sendFile(__dirname + "/scripts/lander.js")
})

app.get("/styles/play.css", (req, res) => {
    res.sendFile(__dirname + "/styles/play.css")
})
app.get("/assets/logo.png", (req, res) => {
    res.sendFile(__dirname + "/assets/logo.png")
})

server.listen(3000, () => {
    console.log("Server online at port *:3000")
});