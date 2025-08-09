const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require("fs")
const jwt = require('jsonwebtoken');

const app = express();
const server = createServer(app);
const io = new Server(server);

let ROOMS = {
    "WAMO": {
        key: "countdown",
        devices: {},
        questions: [
            {"statement": "Slide 1", "timeMS": 0},
            {"statement": "Slide 2", "timeMS": 0}
        ],
        timing: {
            start: 0,
            duration: 0,
        },
        cur: 0
    }
} // Room Name : Room Key

io.on("connection", (socket) => {
    // ...

    socket.on("clientJoin", (data) => {
        socket.join(data.room)
        io.to(data.room + "_ADMIN").emit("clientJoin", {
            ...data,
            id: socket.id
        })
        ROOMS[data.room].devices[socket.id] = {
            name: data.name,
            status: false
        }
    })

    socket.on("adminJoin", (data) => {
        socket.join([data.room, data.room + "_ADMIN"])
        socket.emit("adminJoin", ROOMS[data.room])
        socket.emit("startTimer", ROOMS[data.room].timing)
    })

    socket.on("disconnect", (reason) => {
        for (let room in ROOMS){
            if (ROOMS[room].devices.hasOwnProperty(socket.id)){
                delete ROOMS[room].devices[socket.id]
            }
        }

        io.emit("userDisconnect", socket.id)
    })

    socket.on("clientAccept", (data) => {
        let id = data.id
        let room = data.room

        io.to(room + "_ADMIN").emit("clientAccept", data)
        io.to(id).emit("clientAccept", {
            questions: ROOMS[room].questions,
            cur: ROOMS[room].cur
        })
        io.to(id).emit("startTimer", ROOMS[room].timing)

        ROOMS[room].devices[id].status = true
    })

    socket.on("clientDeny", (data) => {
        let id = data.id
        let room = data.room

        io.to(room + "_ADMIN").emit("clientDeny", data)
        io.to(id).emit("clientDeny", data)
        delete ROOMS[room].devices[id]
    })

    socket.on("clientSwitch", (data) => {
        let room = data.room

        ROOMS[room].cur = data.cur

        io.to(room + "_ADMIN").emit("clientSwitch", data)
        io.to(room).emit("clientSwitch", data)

        ROOMS[room].timing.start = Date.now()
        ROOMS[room].timing.duration = ROOMS[room].questions[data.cur].timeMS

        io.to(room).to(room + "_ADMIN").emit("startTimer", ROOMS[room].timing)
    })

    socket.on("clientUpload", (data) => {
        let room = data.room

        ROOMS[room].cur = 0

        ROOMS[room].questions = data.code

        io.to(room + "_ADMIN").emit("adminJoin", ROOMS[room])
        io.to(room).emit("clientUpload", data)

        ROOMS[room].timing.start = Date.now()
        ROOMS[room].timing.duration = ROOMS[room].questions[0].timeMS

        io.to(room).to(room + "_ADMIN").emit("startTimer", ROOMS[room].timing)
    })
});



app.get("/", (req, res) => {
    res.sendFile(__dirname + "/lander.html")
})

app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/admin.html")
})

app.get("/creator", (req, res) => {
    res.sendFile(__dirname + "/creator.html")
})

app.get("/play", (req, res) => {
    let name = req.query.name
    let key = req.query.key

    if (!ROOMS.hasOwnProperty(req.query.room)){
        res.redirect('/?err=0')
        return
    }

    let room = req.query.room.toUpperCase()

    if (ROOMS[room].key !== key){
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

app.get("/scripts/admin.js", (req, res) => {
    res.sendFile(__dirname + "/scripts/admin.js")
})

app.get("/styles/admin.css", (req, res) => {
    res.sendFile(__dirname + "/styles/admin.css")
})

app.get("/styles/p.css", (req, res) => {
    res.sendFile(__dirname + "/styles/p.css")
})

app.get("/scripts/creator.js", (req, res) => {
    res.sendFile(__dirname + "/scripts/creator.js")
})

app.get("/assets/alarmred.svg", (req, res) => {
    res.sendFile(__dirname + "/assets/alarmred.svg")
})

app.get("/assets/alarmgreen.svg", (req, res) => {
    res.sendFile(__dirname + "/assets/alarmgreen.svg")
})

app.get("/styles/creator.css", (req, res) => {
    res.sendFile(__dirname + "/styles/creator.css")
})
app.get("/assets/logo.png", (req, res) => {
    res.sendFile(__dirname + "/assets/logo.png")
})

app.get("/styles/cmu.css", (req, res) => {
    res.sendFile(__dirname + "/styles/cmu.css")
})

app.get("/fonts/CMUSerif-Roman.woff2", (req, res) => {
    res.sendFile(__dirname + "/fonts/CMUSerif-Roman.woff2")
})

app.get("/fonts/CMUSerif-Bold.woff2", (req, res) => {
    res.sendFile(__dirname + "/fonts/CMUSerif-Bold.woff2")
})

app.get("/fonts/CMUSerif-Italic.woff2", (req, res) => {
    res.sendFile(__dirname + "/fonts/CMUSerif-Italic.woff2")
})

app.get("/fonts/CMUSerif-BoldItalic.woff2", (req, res) => {
    res.sendFile(__dirname + "/fonts/CMUSerif-BoldItalic.woff2")
})

server.listen(8000, () => {
    console.log("Server online at port *:8000")
});