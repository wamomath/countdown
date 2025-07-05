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
        questions: ["2025 AIME I\nWAMO Countdown Platform","==Problem 1==\n\nFind the sum of all integer bases $b > 9$ for which $17_b$ is a divisor of $97_b$. ","==Problem 2==  \n\nOn $\\triangle ABC$ points $A$, $D$, $E$, and $B$ lie in that order on side $\\overline{AB}$ \nwith $AD = 4$, $DE = 16$, and $EB = 8$. Points $A$, $F$, $G$, and $C$ lie in that order on side $\\overline{AC}$ with $AF = 13$, $FG = 52$, and $GC = 26$. Let $M$ be the reflection of $D$ through $F$, and let $N$ be the reflection of $G$ through $E$. Quadrilateral $DEGF$ has area $288$. Find the area of heptagon $AFNBCEM$.","==Problem 3==  \n\nThe $9$ members of a baseball team went to an ice-cream parlor after their game. Each player had a single scoop cone of chocolate, vanilla, or strawberry ice cream. At least one player chose each flavor, and the number of players who chose chocolate was greater than the number of players who chose vanilla, which was greater than the number of players who chose strawberry. Let $N$ be the number of different assignments of flavors to players that meet these conditions. Find the remainder when $N$ is divided by $1000.$","==Problem 4== \nFind the number of ordered pairs $(x,y)$, where both $x$ and $y$ are integers between $-100$ and $100$, inclusive, such that $12x^2-xy-6y^2=0$.","==Problem 5==  \n\nThere are $8!= 40320$ eight-digit positive integers that use each of the digits $1, 2, 3, 4, 5, 6, 7, 8$ exactly once. Let $N$ be the number of these integers that are divisible by $22$. Find the difference between $N$ and $2025$.","==Problem 6==  \n\nAn isosceles trapezoid has an inscribed circle tangent to each of its four sides. The radius of the circle is $3$, and the area of the trapezoid is $72$. Let the parallel sides of the trapezoid have lengths $r$ and $s$, with $r \\neq s$. Find $r^2 + s^2$.","==Problem 7==  \n\nThe twelve letters $A$,$B$,$C$,$D$,$E$,$F$,$G$,$H$,$I$,$J$,$K$, and $L$ are randomly grouped into six pairs of letters. The two letters in each pair are placed next to each other in alphabetical order to form six two-letter words, and then those six words are listed alphabetically. For example, a possible result is $AB$, $CJ$, $DG$, $EK$, $FL$, $HI$. The probability that the last word listed contains $G$ is $\\frac mn$, where $m$ and $n$ are relatively prime positive integers. Find $m+n$.","==Problem 8==  \n\nLet $k$ be a real number such that the system\n$$|25 + 20i - z| = 5$$$$|z - 4 - k| = |z - 3i - k|$$has exactly one complex solution $z$. The sum of all possible values of $k$ can be written as $\\frac{m}{n}$, where $m$ and $n$ are relatively prime positive integers. Find $m + n$. Here $i = \\sqrt{-1}$.\n","==Problem 9==  \n\nThe parabola with equation $y = x^2 - 4$ is rotated $60^{\\circ}$ counterclockwise around the origin. The unique point in the fourth quadrant where the original parabola and its image intersect has $y$-coordinate $\\frac{a - \\sqrt{b}}{c}$, where $a$, $b$, and $c$ are positive integers, and $a$ and $c$ are relatively prime. Find $a + b + c$.","==Problem 10==  \n\nThe $27$ cells of a $3 \\times 9$ grid are filled in using the numbers $1$ through $9$ so that each row contains $9$ different numbers, and each of the three $3 \\times 3$ blocks heavily outlined in the example below contains $9$ different numbers, as in the first three rows of a Sudoku puzzle. The number of different ways to fill such a grid can be written as $p^a \\cdot q^b \\cdot r^c \\cdot s^d$ where $p$, $q$, $r$, and $s$ are distinct prime numbers and $a$, $b$, $c$, $d$ are positive integers. Find $p \\cdot a + q \\cdot b + r \\cdot c + s \\cdot d$.","==Problem 11==\n\nA piecewise linear function is defined by $$f(x) = \\begin{cases} x & \\operatorname{if} ~ -1 \\leq x < 1 \\\\ 2 - x & \\operatorname{if} ~ 1 \\leq x < 3\\end{cases}$$ and $f(x + 4) = f(x)$ for all real numbers $x$. The graph of $f(x)$ has the sawtooth pattern depicted below.","==Problem 12==  \n\nThe set of points in $3$-dimensional coordinate space that lie in the plane $x+y+z=75$ whose coordinates satisfy the inequalities $$x-yz<y-zx<z-xy$$forms three disjoint convex regions. Exactly one of those regions has finite area. The area of this finite region can be expressed in the form $a\\sqrt{b},$ where $a$ and $b$ are positive integers and $b$ is not divisible by the square of any prime. Find $a+b.$","==Problem 13==  \n\nAlex divides a disk into four quadrants with two perpendicular diameters intersecting at the center of the disk. He draws $25$ more line segments through the disk, drawing each segment by selecting two points at random on the perimeter of the disk in different quadrants and connecting these two points. Find the expected number of regions into which these $27$ line segments divide the disk.","==Problem 14==  \n\nLet $ABCDE$ be a convex pentagon with $AB=14,$ $BC=7,$ $CD=24,$ $DE=13,$ $EA=26,$ and $\\angle B=\\angle E=60^{\\circ}.$ For each point $X$ in the plane, define $f(X)=AX+BX+CX+DX+EX.$ The least possible value of $f(X)$ can be expressed as $m+n\\sqrt{p},$ where $m$ and $n$ are positive integers and $p$ is not divisible by the square of any prime. Find $m+n+p.$","==Problem 15==  \n\nLet $N$ denote the number of ordered triples of positive integers $(a, b, c)$ such that $a, b, c \\leq 3^6$ and $a^3 + b^3 + c^3$ is a multiple of $3^7$. Find the remainder when $N$ is divided by $1000$.\n"],
        cur: 1
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

        ROOMS[room].devices[id].status = true
    })

    socket.on("clientDeny", (data) => {
        let id = data.id
        let room = data.room

        io.to(room + "_ADMIN").emit("clientDeny", data)
        io.to(id).emit("clientDeny", data)
        delete ROOMS[room].devices[id]
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
    let room = req.query.room.toUpperCase()
    let key = req.query.key

    if (!ROOMS.hasOwnProperty(room)){
        res.redirect('/?err=0')
        return
    }

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

app.get("/scripts/creator.js", (req, res) => {
    res.sendFile(__dirname + "/scripts/creator.js")
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