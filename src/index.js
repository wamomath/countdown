const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require("fs")

const app = express();
const server = createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
    // ...
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/lander.html")
})

app.get("/play", (req, res) => {
    res.sendFile(__dirname + "/play.html")
})


app.get("/styles/lander.css", (req, res) => {
    res.sendFile(__dirname + "/styles/lander.css")
})

app.get("/assets/logo.png", (req, res) => {
    res.sendFile(__dirname + "/assets/logo.png")
})

server.listen(3000, () => {
    console.log("Server online at port *:3000")
});