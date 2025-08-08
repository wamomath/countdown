import presetHTML5 from "https://esm.sh/@bbob/preset-html5";
import { render } from "https://esm.sh/@bbob/html"
import core from "https://esm.sh/@bbob/core"
import parser from "https://esm.sh/@bbob/parser"

const PARAMS = new URLSearchParams(window.location.search)
const USERNAME = PARAMS.get("name").toUpperCase()
const ROOM = PARAMS.get("room").toUpperCase()

const socket = io();

const htmlCore = core(presetHTML5())
let questions;
let roomData;
let cur;
let waitingRoom = false;

const bbcodeRender = (code) => {
    code = code.replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\n", "<br>")

    return htmlCore.process(code, { render }).html
}
window.bbcodeRender=bbcodeRender

socket.on("connect", () => {
    socket.emit("adminJoin", {
        username: USERNAME,
        room: ROOM
    })
})

socket.on("adminJoin", (data) => {
    document.getElementById("devices_wrapper").innerHTML = ""
    document.getElementById("preview").innerHTML = ""

    prepQuestions(data)

})

const join = (data) => {
    let template = document.getElementById("user").content.cloneNode(true)
    template.querySelector(".head").innerText = data.name
    template.querySelector(".id").innerText = data.id
    template.querySelector(".user_wrapper").id = `USER_${data.id}`
    template.querySelector(".accept").setAttribute("data-id", data.id);
    template.querySelector(".deny").setAttribute("data-id", data.id);
    template.querySelector(".device").setAttribute("data-id", data.id);

    if (data.status){
        console.log(data.status)
        template.querySelector(".accept").remove();
        template.querySelector(".deny").remove()
        template.querySelector(`.user_wrapper`).classList.remove("pending")
    }

    document.getElementById("devices_wrapper").appendChild(template)

    document.querySelectorAll(".accept, .deny").forEach(e => {
        e.onclick = () => {
            let id = e.getAttribute("data-id")

            if (e.classList.contains("deny")){
                socket.emit("clientDeny", {"room": ROOM, "id": id})
                return
            }

            socket.emit("clientAccept", {"room": ROOM, "id": id})

            let a = document.querySelector(`.accept[data-id="${data.id}"]`);
            let b = document.querySelector(`.deny[data-id="${data.id}"]`);
            a.remove();
            b.remove();
        }
    })

    document.querySelector(".user_wrapper:last-of-type .device").onclick = (e) => {
        if (!confirm("Are you sure you want to kick this user?")){
            return;
        }
        socket.emit("clientDeny", {"room": ROOM, "id": e.currentTarget.getAttribute("data-id")})
    }

    if (!waitingRoom){
        let obj = document.querySelector(".user_wrapper:last-of-type .accept")
        if (obj){
            obj.click()
        }
    }

}

socket.on("clientJoin", join)

socket.on("clientAccept", (data) => {
    document.querySelector(`.user_wrapper[data-id="${data.id}"]`).classList.remove("pending")
    let a = document.querySelector(`.accept[data-id="${data.id}"]`);
    let b = document.querySelector(`.deny[data-id="${data.id}"]`);
    if (a){
        a.remove();
    }
    if (b){
        b.remove();
    }
})

socket.on("clientDeny", (data) => {
    document.querySelector(`#USER_${data.id}`).remove()
})

socket.on("userDisconnect", (id) => {
    if (document.getElementById(`USER_${id}`)){
        document.getElementById(`USER_${id}`).remove()
    }
})

let renderMath = (element) => {
    renderMathInElement(element,{delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false}]})
}

const display = (num, location = document.getElementById("display")) => {
    location.innerHTML = bbcodeRender(questions[num].statement)

    renderMath(location)
}

renderMath(document.getElementById("display"))

document.getElementById("move_left").onclick = () => {
    if (!confirm("Are you sure you want to move back?")){
        return;
    }

    cur = Math.max(0, cur - 1)

    socket.emit("clientSwitch", {
        room: ROOM,
        cur: cur
    })
}

document.getElementById("move_right").onclick = () => {
    if (!confirm("Are you sure you want to move forward?")){
        return;
    }

    cur = Math.min(questions.length - 1, cur + 1)

    socket.emit("clientSwitch", {
        room: ROOM,
        cur: cur
    })

}

socket.on("clientSwitch", (data) => {
    display(Number(data.cur))
    cur = data.cur
    prepWindows()
})

socket.on("startTimer", (data) => {
    startTimer(data.duration, data.start)
})

document.getElementById("upload").onclick = () => {
    let code = prompt("Please upload the JSON list of your problems")
    try{
        JSON.parse(code)
    }catch{
        alert("Invalid JSON. Please try again")
        return;
    }

    if (JSON.parse(code).constructor !== Array){
        alert("JSON is not a list")
        return;
    }

    if (JSON.parse(code).length === 0){
        alert("Please upload questions, not an empty list")
        return;
    }

    socket.emit("clientUpload", {
        room: ROOM,
        code: JSON.parse(code)
    })
}

document.getElementById("uploadExample").onclick= () => {
    if (!confirm("Are you sure you want to upload an example question set?")){
        return;
    }
    socket.emit("clientUpload", {
        room: ROOM,
        code: [
            {statement: "2025 AIME I\nWAMO Countdown Platform", timeMS: 0},
            {statement: "==Problem 1==\n\nFind the sum of all integer bases $b > 9$ for which $17_b$ is a divisor of $97_b$. ", timeMS: 10000},
            {statement: "==Problem 2==  \n\nOn $\\triangle ABC$ points $A$, $D$, $E$, and $B$ lie in that order on side $\\overline{AB}$ \nwith $AD = 4$, $DE = 16$, and $EB = 8$. Points $A$, $F$, $G$, and $C$ lie in that order on side $\\overline{AC}$ with $AF = 13$, $FG = 52$, and $GC = 26$. Let $M$ be the reflection of $D$ through $F$, and let $N$ be the reflection of $G$ through $E$. Quadrilateral $DEGF$ has area $288$. Find the area of heptagon $AFNBCEM$.", timeMS: 10000},
            {statement: "==Problem 3==  \n\nThe $9$ members of a baseball team went to an ice-cream parlor after their game. Each player had a single scoop cone of chocolate, vanilla, or strawberry ice cream. At least one player chose each flavor, and the number of players who chose chocolate was greater than the number of players who chose vanilla, which was greater than the number of players who chose strawberry. Let $N$ be the number of different assignments of flavors to players that meet these conditions. Find the remainder when $N$ is divided by $1000.$", timeMS: 10000},
            {statement: "==Problem 4== \nFind the number of ordered pairs $(x,y)$, where both $x$ and $y$ are integers between $-100$ and $100$, inclusive, such that $12x^2-xy-6y^2=0$.", timeMS: 10000},
            {statement: "==Problem 5==  \n\nThere are $8!= 40320$ eight-digit positive integers that use each of the digits $1, 2, 3, 4, 5, 6, 7, 8$ exactly once. Let $N$ be the number of these integers that are divisible by $22$. Find the difference between $N$ and $2025$.", timeMS: 10000},
            {statement: "==Problem 6==  \n\nAn isosceles trapezoid has an inscribed circle tangent to each of its four sides. The radius of the circle is $3$, and the area of the trapezoid is $72$. Let the parallel sides of the trapezoid have lengths $r$ and $s$, with $r \\neq s$. Find $r^2 + s^2$.", timeMS: 10000},
            {statement: "==Problem 7==  \n\nThe twelve letters $A$,$B$,$C$,$D$,$E$,$F$,$G$,$H$,$I$,$J$,$K$, and $L$ are randomly grouped into six pairs of letters. The two letters in each pair are placed next to each other in alphabetical order to form six two-letter words, and then those six words are listed alphabetically. For example, a possible result is $AB$, $CJ$, $DG$, $EK$, $FL$, $HI$. The probability that the last word listed contains $G$ is $\\frac mn$, where $m$ and $n$ are relatively prime positive integers. Find $m+n$.", timeMS: 10000},
            {statement: "==Problem 8==  \n\nLet $k$ be a real number such that the system\n$$|25 + 20i - z| = 5$$$$|z - 4 - k| = |z - 3i - k|$$has exactly one complex solution $z$. The sum of all possible values of $k$ can be written as $\\frac{m}{n}$, where $m$ and $n$ are relatively prime positive integers. Find $m + n$. Here $i = \\sqrt{-1}$.\n", timeMS: 10000},
            {statement: "==Problem 9==  \n\nThe parabola with equation $y = x^2 - 4$ is rotated $60^{\\circ}$ counterclockwise around the origin. The unique point in the fourth quadrant where the original parabola and its image intersect has $y$-coordinate $\\frac{a - \\sqrt{b}}{c}$, where $a$, $b$, and $c$ are positive integers, and $a$ and $c$ are relatively prime. Find $a + b + c$.", timeMS: 10000},
            {statement: "==Problem 10==  \n\nThe $27$ cells of a $3 \\times 9$ grid are filled in using the numbers $1$ through $9$ so that each row contains $9$ different numbers, and each of the three $3 \\times 3$ blocks heavily outlined in the example below contains $9$ different numbers, as in the first three rows of a Sudoku puzzle. The number of different ways to fill such a grid can be written as $p^a \\cdot q^b \\cdot r^c \\cdot s^d$ where $p$, $q$, $r$, and $s$ are distinct prime numbers and $a$, $b$, $c$, $d$ are positive integers. Find $p \\cdot a + q \\cdot b + r \\cdot c + s \\cdot d$.", timeMS: 10000},
            {statement: "==Problem 11==\n\nA piecewise linear function is defined by $$f(x) = \\begin{cases} x & \\operatorname{if} ~ -1 \\leq x < 1 \\\\ 2 - x & \\operatorname{if} ~ 1 \\leq x < 3\\end{cases}$$ and $f(x + 4) = f(x)$ for all real numbers $x$. The graph of $f(x)$ has the sawtooth pattern depicted below.", timeMS: 10000},
            {statement: "==Problem 12==  \n\nThe set of points in $3$-dimensional coordinate space that lie in the plane $x+y+z=75$ whose coordinates satisfy the inequalities $$x-yz<y-zx<z-xy$$forms three disjoint convex regions. Exactly one of those regions has finite area. The area of this finite region can be expressed in the form $a\\sqrt{b},$ where $a$ and $b$ are positive integers and $b$ is not divisible by the square of any prime. Find $a+b.$", timeMS: 10000},
            {statement: "==Problem 13==  \n\nAlex divides a disk into four quadrants with two perpendicular diameters intersecting at the center of the disk. He draws $25$ more line segments through the disk, drawing each segment by selecting two points at random on the perimeter of the disk in different quadrants and connecting these two points. Find the expected number of regions into which these $27$ line segments divide the disk.", timeMS: 10000},
            {statement: "==Problem 14==  \n\nLet $ABCDE$ be a convex pentagon with $AB=14,$ $BC=7,$ $CD=24,$ $DE=13,$ $EA=26,$ and $\\angle B=\\angle E=60^{\\circ}.$ For each point $X$ in the plane, define $f(X)=AX+BX+CX+DX+EX.$ The least possible value of $f(X)$ can be expressed as $m+n\\sqrt{p},$ where $m$ and $n$ are positive integers and $p$ is not divisible by the square of any prime. Find $m+n+p.$", timeMS: 10000},
            {statement: "==Problem 15==  \n\nLet $N$ denote the number of ordered triples of positive integers $(a, b, c)$ such that $a, b, c \\leq 3^6$ and $a^3 + b^3 + c^3$ is a multiple of $3^7$. Find the remainder when $N$ is divided by $1000$.\n", timeMS: 10000}
        ],
    })
}

document.getElementById("download").onclick = () => {
    navigator.clipboard.writeText(JSON.stringify(questions))
    alert("Copied to clipboard")
}

document.getElementById("toggleWaitingRoom").onclick = () => {
    waitingRoom = !waitingRoom
    document.getElementById("toggleWaitingRoom").innerHTML = `${['Enable', 'Disable'][Number(waitingRoom)]} Waiting Room`
}

const prepWindows = () => {
    document.getElementById("preview").scrollTo(228*cur,0)

    let i = 0;

    document.querySelectorAll(".window").forEach(e=>{
        e.classList.remove("cur")

        let j = i
        e.onclick = () => {
            if (!confirm("Are you sure you want to move to slide " + j + "?")){
                return;
            }

            cur = j

            socket.emit("clientSwitch", {
                room: ROOM,
                cur: cur
            })
        }

        i++;
    })
    document.querySelector(`.window[data-id="${cur}"]`).classList.add("cur")
}

const prepQuestions = (data) => {
    roomData = data
    for (let user in data.devices){
        join({
            room: ROOM,
            name: data.devices[user].name,
            id: user,
            status: data.devices[user].status
        })
    }
    questions = data.questions
    display(Number(data.cur))

    cur = data.cur

    for (let i = 0; i < questions.length; i++){
        let element = document.createElement("DIV")
        element.classList.add("window")
        element.classList.add("pwrapper")
        element.setAttribute("data-id", i)

        let inner = document.createElement("DIV")
        inner.classList.add("p")

        element.appendChild(inner)
        document.getElementById("preview").appendChild(element)

        display(i, inner)
    }

    prepWindows();
}

let timerInterval;

const startTimer = (duration, start) => {
    let target = duration + start

    clearInterval(timerInterval)

    timerInterval = setInterval(() => {
        document.getElementById("timer").innerText = (Math.max(0, target - Date.now())/1000).toFixed(2)

        if (target < Date.now()){
            clearInterval(timerInterval)
        }
    }, 10)
}
