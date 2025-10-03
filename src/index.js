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
            {"statement": "WAMO Countdown Platform", "timeMS": 0},
            {"statement": "Test Slide (the answer is 1434)", "timeMS": 10000},
            {"statement": "Answer: 1434", "timeMS": 0}
        ],
        timing: {
            start: 0,
            duration: 0,
            elapsed: 0
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
    })

    socket.on("clientUpload", (data) => {
        let room = data.room

        ROOMS[room].cur = 0

        ROOMS[room].questions = data.code

        io.to(room + "_ADMIN").emit("adminJoin", ROOMS[room])
        io.to(room).emit("clientUpload", data)
    })

    socket.on("updateNames", (data) => {
        let room = data.room

        io.to(room).emit("updateNames", data)
    })

    socket.on("updateScores", (data) => {
        let room = data.room

        io.to(room).emit("updateScores", data)
    })

    socket.on("resetScores", (data) => {
        let room = data.room

        io.to(room).emit("resetScores", data)
    })

    socket.on("assignCompetitors", (data) => {
        let room = data.room

        io.to(room).emit("assignCompetitors", data)
    })

    socket.on("buzz", (data) => {
        let room = data.room

        io.to(room).emit("buzz", data)
    })

    socket.on("clearbuzz", (data) =>{
        let room = data.room

        io.to(room).emit("clearbuzz", data)
    })

    socket.on("pauseTimer", (data) => {
        let room = data.room

        ROOMS[room].timing.elapsed = ROOMS[room].timing.elapsed + Date.now() - ROOMS[room].timing.start

        io.to(room).emit("pauseTimer", data)
    })

    socket.on("startTimer", (data) => {
        let room = data.room

        ROOMS[room].timing.start = Date.now()
        ROOMS[room].timing.duration = ROOMS[room].questions[data.cur].timeMS
        ROOMS[room].timing.elapsed = 0

        io.to(room).to(room + "_ADMIN").emit("startTimer", ROOMS[room].timing)
    })

    socket.on("continueTimer", (data) => {
        let room = data.room

        ROOMS[room].timing.start = Date.now()

        io.to(room).emit("continueTimer", ROOMS[room].timing)
    })

    socket.on("endTimer", (data) => {
        let room = data.room

        ROOMS[room].timing.start = 0
        ROOMS[room].timing.duration = 0
        ROOMS[room].timing.elapsed = 0

        io.to(room).emit("endTimer", data)
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

app.get("/sync", (req, res) => {
    let client_time = req.query.client_time;
    let server_time = Date.now();

    let server_client_request_diff_time = server_time - client_time;

    return res.json({diff: server_client_request_diff_time, server_time: server_time})
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

app.get("/scripts/utils.js", (req, res) => {
    res.sendFile(__dirname + "/scripts/utils.js")
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