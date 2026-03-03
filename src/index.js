const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require('path');

const fs = require("fs")
const jwt = require('jsonwebtoken');

const app = express();
const server = createServer(app);
const io = new Server(server);

class RoomManager{
    rooms;
    
    constructor(){
        this.rooms = {}
    }
    
    has(room){
        return this.rooms.hasOwnProperty(room.toUpperCase())
    }
    
    get(room){
        if (!this.has(room.toUpperCase())){
            this.create(room.toUpperCase())
        }
        
        return this.rooms[room.toUpperCase()]
    }
    
    create(name){
        this.rooms[name.toUpperCase()] = RoomManager.getRoomTemplate()
    }
    
    static getRoomTemplate = () => {
        return {
            adminList: {},
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
                elapsed: 0,
                state: "stopped"
            },
            waiting: true,
            cur: 0,
            competitor: {
                competitor1: null,
                competitor2: null
            },
            competitorNames: {},
            buzzed: {
                competitor1: false,
                competitor2: false,
                lastBuzzer: null
            },
            scores: {
                player1: 0,
                player2: 0
            }
        }
    }
}

let ROOMS = new RoomManager()
ROOMS.create("WAMO")

io.on("connection", (socket) => {
    // ...

    socket.on("clientJoin", (data) => {
        socket.join(data.room)
        ROOMS.get(data.room).devices[socket.id] = {
            name: data.name,
            status: false,
        }

        io.to(data.room + "_ADMIN").emit("roomStateUpdate", {
            room: data.room,
            identifier: "devices",
            data: ROOMS.get(data.room).devices
        })

    })

    socket.on("adminJoin", (data) => {
        socket.join([data.room, data.room + "_ADMIN"])
        socket.emit("adminJoin", ROOMS.get(data.room))

        ROOMS.get(data.room).adminList[socket.id] = data.username
        io.to(data.room + "_ADMIN").emit("roomStateUpdate", {
            room: data.room,
            identifier: "adminList",
            data: ROOMS.get(data.room).adminList
        })
    })

    socket.on("disconnecting", (reason) => {
        let curRoom = "";
        for (let room of socket.rooms){
            if (!ROOMS.has(room)){
                continue;
            }


            if (ROOMS.get(room).devices.hasOwnProperty(socket.id)){
                delete ROOMS.get(room).devices[socket.id]
                curRoom = room
            }

            if (ROOMS.get(room).adminList.hasOwnProperty(socket.id)){
                delete ROOMS.get(room).adminList[socket.id]
                io.to(room + "_ADMIN").emit("roomStateUpdate", {
                    room: room,
                    identifier: "adminList",
                    data: ROOMS.get(room).adminList
                })
            }


            if (socket.id === ROOMS.get(room).competitor.competitor1){
                ROOMS.get(room).competitor.competitor1 = null
            }

            if (socket.id === ROOMS.get(room).competitor.competitor2) {
                ROOMS.get(room).competitor.competitor2 = null
            }
        }


        if (!ROOMS.has(curRoom)){
            return;
        }


        io.to(curRoom).emit("roomStateUpdate", {
            room: curRoom,
            identifier: 'competitor',
            data: ROOMS.get(curRoom).competitor
        })

        io.to(curRoom).emit("roomStateUpdate", {
            room: curRoom,
            identifier: 'devices',
            data: ROOMS.get(curRoom).devices
        })
    })

    socket.on("clientAccept", (data) => {
        let id = data.id
        let room = data.room

        io.to(room + "_ADMIN").emit("clientAccept", data)
        io.to(id).emit("clientAccept", ROOMS.get(room))

        ROOMS.get(room).devices[id].status = true

        io.to(room + "_ADMIN").emit("roomStateUpdate", {
            room: room,
            identifier: 'devices',
            data: ROOMS.get(room).devices
        })

    })

    socket.on("clientDeny", (data) => {
        let id = data.id
        let room = data.room

        io.to(room + "_ADMIN").emit("clientDeny", data)
        io.to(id).emit("clientDeny", data)
        delete ROOMS.get(room).devices[id]

        io.to(room + "_ADMIN").emit("roomStateUpdate", {
            room: room,
            identifier: 'devices',
            data: ROOMS.get(room).devices
        })
    })

    socket.on("clientSwitch", (data) => {
        let room = data.room

        ROOMS.get(room).cur = data.cur

        io.to(room + "_ADMIN").emit("clientSwitch", data)
        io.to(room).emit("clientSwitch", data)
    })

    socket.on("clientUpload", (data) => {
        let room = data.room

        ROOMS.get(room).cur = 0

        ROOMS.get(room).questions = data.code

        io.to(room + "_ADMIN").emit("adminJoin", ROOMS.get(room))
        io.to(room).emit("clientUpload", data)
    })

    socket.on("updateNames", (data) => {
        let room = data.room

        io.to(room).emit("updateNames", data)
    })


    socket.on("assignCompetitors", (data) => {
        let room = data.room

        io.to(room).emit("assignCompetitors", data)
    })

    socket.on("buzz", (data) => {
        let room = data.room

        io.to(room).emit("buzz", data)
    })



    socket.on("toggleWaitingRoom", (data) => {
        let room = data.room

        ROOMS.get(room).waiting = !ROOMS.get(room).waiting

        io.to(room).emit("toggleWaitingRoom", ROOMS.get(room))
    })

    socket.on("roomStateUpdate", (payload) => {
        let room = payload.room
        let data = payload.data
        let identifier = payload.identifier

        ROOMS.get(room)[identifier] = data


        io.to(room).emit("roomStateUpdate", payload)

        if (identifier === "cur" && ROOMS.get(room).questions){
            ROOMS.get(room)["timing"] = {
                start: 0,
                duration: ROOMS.get(room).questions[Number(data)].timeMS,
                elapsed: 0,
                state: ROOMS.get(room).questions[Number(data)].timeMS ? "reading" : "running"
            }

            ROOMS.get(room)["buzzed"] = {
                competitor1: false,
                competitor2: false,
                lastBuzzer: null
            }

            io.to(room).emit("roomStateUpdate", {
                room: room,
                identifier: "timing",
                data: ROOMS.get(room)["timing"]
            })

            io.to(room).emit("roomStateUpdate", {
                room: room,
                identifier: "buzzed",
                data: ROOMS.get(room)["buzzed"]
            })
        }
    })

    socket.on("adminRoomStateUpdate", (payload) => {
        let room = payload.room
        let data = payload.data
        let identifier = payload.identifier

        ROOMS.get(room)[identifier] = data


        io.to(room + "_ADMIN").emit("roomStateUpdate", payload)
    })
});



app.get("/", (req, res) => {
    res.sendFile(__dirname + "/lander.html")
})

app.get("/admin", (req, res) => {

    let name = req.query.name
    let key = req.query.key
    let room = req.query.room

    if (ROOMS.get(room).key !== key){
        res.redirect('/?err=1')
        return
    }

    if (!name){
        res.redirect('/?err=2')
        return
    }

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

    if (!req.query.room || !ROOMS.has(req.query.room)){
        res.redirect('/?err=0')
        return
    }

    let room = req.query.room.toUpperCase()

    if (ROOMS.get(room).key !== key){
        res.redirect('/?err=1')
        return
    }

    if (!name){
        res.redirect('/?err=2')
        return
    }
    res.sendFile(__dirname + "/play.html")
})

app.get("/converter", (req, res) => {
    res.sendFile(__dirname + "/converter.html")
})

app.use('/styles', express.static(path.join(__dirname, 'styles')));

app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

app.use(express.json({ limit: "100kb" }));

server.listen(8000,() => {
    console.log("Server online at port *:8000")
});