import presetHTML5 from "https://esm.sh/@bbob/preset-html5";
import { render } from "https://esm.sh/@bbob/html";
import core from "https://esm.sh/@bbob/core";
import parser from "https://esm.sh/@bbob/parser";

const PARAMS = new URLSearchParams(window.location.search);
const USERNAME = PARAMS.get("name").toUpperCase();
const ROOM = PARAMS.get("room").toUpperCase();

const socket = io();

const htmlCore = core(presetHTML5());
let curp1score = 0;
let curp2score = 0;
let elementtemp = "";

let game;

class CountdownGame extends Game{
    key;
    devices;
    questions;
    timing;
    waiting;
    cur;
    competitor;
    adminList;
    competitorNames;
    buzzed;


    constructor(room, socket, state){
        super(room, socket, state);
        this.adminList = new AdminListProperty(this, "adminList", {})
        this.key = new Property(this, "devices", {})
        this.questions = new QuestionProperty(this, "questions", {})
        this.timing = new TimingProperty(this, "timing", {})
        this.waiting = new WaitingProperty(this, "waiting", true)
        this.cur = new CurProperty(this, "cur")
        this.devices = new DeviceProperty(this, "devices", {})
        this.competitor = new CompetitorProperty(this, "competitor", {})
        this.competitorNames = new CompetitorNamesProperty(this, "competitorNames", {})
        this.buzzed = new BuzzedProperty(this, "buzzed", { competitor1: false, competitor2: false })

        this.processState(state, false)

        socket.on("roomStateUpdate", (data) => {
            console.log("update", data)
            let dataState = {}
            dataState[data.identifier] = data.data
            this.processState(dataState)
        });
    }

    processState(state, render=true){
        for (let identifier in state){
            let property = this[identifier];
            property.updateExternal(state[identifier]);
        }

        if (render){
            for (let identifier in state){
                let property = this[identifier];
                property.render()
            }
        }
    }

    renderAll() {
        for (let identifier in this){
            if (this[identifier].render){
                this[identifier].render()
            }
        }
    }

    toJSON(){
        return {
            key: this.key.toJSON(),
            devices: this.devices.toJSON(),
            questions: this.questions.toJSON(),
            timing: this.timing.toJSON(),
            waiting: this.waiting.toJSON(),
            cur: this.cur.toJSON(),
            competitor: this.competitor.toJSON()
        }
    }
}

const bbcodeRender = (code) => {
    code = code
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\n", "<br>");

    return htmlCore.process(code, { render }).html;
};
window.bbcodeRender = bbcodeRender;

socket.on("connect", async () => {
    OFFSET = await getTimeOffset();

    console.log("TIME COMPENSATION IN MILLISECONDS", OFFSET);

    socket.emit("adminJoin", {
        username: USERNAME,
        room: ROOM,
    });
});

socket.on("adminJoin", (data) => {
    game = new CountdownGame(ROOM, socket, data)
    window.game = game

    document.getElementById("toggleWaitingRoom").innerHTML =
        `${["Enable", "Disable"][Number(game.waiting.getData())]} Waiting Room`;

    document.getElementById("devices_wrapper").innerHTML = "";
    document.getElementById("status").innerHTML = `ID: ${socket.id}`;
    document.getElementById("name").innerHTML = `REGISTERED AS ${USERNAME}`;

    game.renderAll()
    setCallbacks()
});

socket.on("clientAccept", (data) => {
    try {
        document
            .querySelector(`.user_wrapper[data-id="${data.id}"]`)
            .classList.remove("pending");
    } catch {}
    let a = document.querySelector(`.accept[data-id="${data.id}"]`);
    let b = document.querySelector(`.deny[data-id="${data.id}"]`);
    if (a) {
        a.remove();
    }
    if (b) {
        b.remove();
    }
});

let renderMath = (element) => {
    renderMathInElement(element, {
        delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
        ],
    });
};

const display = (num, location = document.getElementById("display")) => {
    location.innerHTML = bbcodeRender(game.questions.getData()[num].statement);

    renderMath(location);
};

renderMath(document.getElementById("display"));


document.getElementById("upload").onclick = () => {
    let code = prompt("Please upload the JSON list of your problems");
    try {
        JSON.parse(code);
    } catch {
        alert("Invalid JSON. Please try again");
        return;
    }

    if (JSON.parse(code).constructor !== Array) {
        alert("JSON is not a list");
        return;
    }

    if (JSON.parse(code).length === 0) {
        alert("Please upload questions, not an empty list");
        return;
    }

    game.questions.update(JSON.parse(code))
    game.cur.update(0)
};

document.getElementById("uploadExample").onclick = () => {
    if (!confirm("Are you sure you want to upload an example question set?")) {
        return;
    }
    game.questions.update(
        [
            { statement: "2025 AIME I\nWAMO Countdown Platform", timeMS: 0 },
            {
                statement:
                    "==Problem 1==\n\nFind the sum of all integer bases $b > 9$ for which $17_b$ is a divisor of $97_b$. ",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 0==\n\nEvaluate $1434+665+67$. ",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 2==  \n\nOn $\\triangle ABC$ points $A$, $D$, $E$, and $B$ lie in that order on side $\\overline{AB}$ \nwith $AD = 4$, $DE = 16$, and $EB = 8$. Points $A$, $F$, $G$, and $C$ lie in that order on side $\\overline{AC}$ with $AF = 13$, $FG = 52$, and $GC = 26$. Let $M$ be the reflection of $D$ through $F$, and let $N$ be the reflection of $G$ through $E$. Quadrilateral $DEGF$ has area $288$. Find the area of heptagon $AFNBCEM$.",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 3==  \n\nThe $9$ members of a baseball team went to an ice-cream parlor after their game. Each player had a single scoop cone of chocolate, vanilla, or strawberry ice cream. At least one player chose each flavor, and the number of players who chose chocolate was greater than the number of players who chose vanilla, which was greater than the number of players who chose strawberry. Let $N$ be the number of different assignments of flavors to players that meet these conditions. Find the remainder when $N$ is divided by $1000.$",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 4== \nFind the number of ordered pairs $(x,y)$, where both $x$ and $y$ are integers between $-100$ and $100$, inclusive, such that $12x^2-xy-6y^2=0$.",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 5==  \n\nThere are $8!= 40320$ eight-digit positive integers that use each of the digits $1, 2, 3, 4, 5, 6, 7, 8$ exactly once. Let $N$ be the number of these integers that are divisible by $22$. Find the difference between $N$ and $2025$.",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 6==  \n\nAn isosceles trapezoid has an inscribed circle tangent to each of its four sides. The radius of the circle is $3$, and the area of the trapezoid is $72$. Let the parallel sides of the trapezoid have lengths $r$ and $s$, with $r \\neq s$. Find $r^2 + s^2$.",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 7==  \n\nThe twelve letters $A$,$B$,$C$,$D$,$E$,$F$,$G$,$H$,$I$,$J$,$K$, and $L$ are randomly grouped into six pairs of letters. The two letters in each pair are placed next to each other in alphabetical order to form six two-letter words, and then those six words are listed alphabetically. For example, a possible result is $AB$, $CJ$, $DG$, $EK$, $FL$, $HI$. The probability that the last word listed contains $G$ is $\\frac mn$, where $m$ and $n$ are relatively prime positive integers. Find $m+n$.",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 8==  \n\nLet $k$ be a real number such that the system\n$$|25 + 20i - z| = 5$$$$|z - 4 - k| = |z - 3i - k|$$has exactly one complex solution $z$. The sum of all possible values of $k$ can be written as $\\frac{m}{n}$, where $m$ and $n$ are relatively prime positive integers. Find $m + n$. Here $i = \\sqrt{-1}$.\n",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 9==  \n\nThe parabola with equation $y = x^2 - 4$ is rotated $60^{\\circ}$ counterclockwise around the origin. The unique point in the fourth quadrant where the original parabola and its image intersect has $y$-coordinate $\\frac{a - \\sqrt{b}}{c}$, where $a$, $b$, and $c$ are positive integers, and $a$ and $c$ are relatively prime. Find $a + b + c$.",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 10==  \n\nThe $27$ cells of a $3 \\times 9$ grid are filled in using the numbers $1$ through $9$ so that each row contains $9$ different numbers, and each of the three $3 \\times 3$ blocks heavily outlined in the example below contains $9$ different numbers, as in the first three rows of a Sudoku puzzle. The number of different ways to fill such a grid can be written as $p^a \\cdot q^b \\cdot r^c \\cdot s^d$ where $p$, $q$, $r$, and $s$ are distinct prime numbers and $a$, $b$, $c$, $d$ are positive integers. Find $p \\cdot a + q \\cdot b + r \\cdot c + s \\cdot d$.",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 11==\n\nA piecewise linear function is defined by $$f(x) = \\begin{cases} x & \\operatorname{if} ~ -1 \\leq x < 1 \\\\ 2 - x & \\operatorname{if} ~ 1 \\leq x < 3\\end{cases}$$ and $f(x + 4) = f(x)$ for all real numbers $x$. The graph of $f(x)$ has the sawtooth pattern depicted below.",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 12==  \n\nThe set of points in $3$-dimensional coordinate space that lie in the plane $x+y+z=75$ whose coordinates satisfy the inequalities $$x-yz<y-zx<z-xy$$forms three disjoint convex regions. Exactly one of those regions has finite area. The area of this finite region can be expressed in the form $a\\sqrt{b},$ where $a$ and $b$ are positive integers and $b$ is not divisible by the square of any prime. Find $a+b.$",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 13==  \n\nAlex divides a disk into four quadrants with two perpendicular diameters intersecting at the center of the disk. He draws $25$ more line segments through the disk, drawing each segment by selecting two points at random on the perimeter of the disk in different quadrants and connecting these two points. Find the expected number of regions into which these $27$ line segments divide the disk.",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 14==  \n\nLet $ABCDE$ be a convex pentagon with $AB=14,$ $BC=7,$ $CD=24,$ $DE=13,$ $EA=26,$ and $\\angle B=\\angle E=60^{\\circ}.$ For each point $X$ in the plane, define $f(X)=AX+BX+CX+DX+EX.$ The least possible value of $f(X)$ can be expressed as $m+n\\sqrt{p},$ where $m$ and $n$ are positive integers and $p$ is not divisible by the square of any prime. Find $m+n+p.$",
                timeMS: 10000,
            },
            {
                statement:
                    "==Problem 15==  \n\nLet $N$ denote the number of ordered triples of positive integers $(a, b, c)$ such that $a, b, c \\leq 3^6$ and $a^3 + b^3 + c^3$ is a multiple of $3^7$. Find the remainder when $N$ is divided by $1000$.\n",
                timeMS: 10000,
            },
        ]
    );
    game.cur.update(0)
};

document.getElementById("download").onclick = () => {
    navigator.clipboard.writeText(JSON.stringify(game.questions.toJSON()));
    alert("Copied to clipboard");
};

document.getElementById("toggleWaitingRoom").onclick = () => {
    game.waiting.update(!game.waiting.getData())
};

document.getElementById("openQuestionEditor").onclick = () => {
    open(`/creator?data=${encodeURIComponent(JSON.stringify(game.questions.toJSON()))}`);
};

//update competitor names
document.getElementById("updateNames").onclick = () => {
    if (!confirm("Are you sure these updated names are correct?")) {
        return;
    }
    //socket.emit("updateNames", {
    game.competitorNames.update({
        name1: document.getElementById("competitor1").value,
        name2: document.getElementById("competitor2").value,
        seed1: document.getElementById("c1seed").value,
        seed2: document.getElementById("c2seed").value
    });
};

//mark answer correct - scores the player who last buzzed
document.getElementById("markCorrect").onclick = () => {
    let buzzed = game.buzzed.getData();
    if (!buzzed.lastBuzzer) {
        return;
    }
    let playernum = buzzed.lastBuzzer;
    socket.emit("updateScores", {
        room: ROOM,
        playernum: playernum,
    });
    if (playernum === 1) {
        curp1score = curp1score + 1;
        document.getElementById(`bar1${curp1score}`).style.backgroundColor = "#5cb85c";
        document.getElementById(`bar1${curp1score}`).style.color = "#5cb85c";
    } else {
        curp2score = curp2score + 1;
        document.getElementById(`bar2${curp2score}`).style.backgroundColor = "#5cb85c";
        document.getElementById(`bar2${curp2score}`).style.color = "#5cb85c";
    }
    // Clear buzz
    document.getElementById("p1").style.backgroundColor = "white";
    document.getElementById("p2").style.backgroundColor = "white";
    socket.emit("clearbuzz", { room: ROOM });
};

//mark answer incorrect - no point, clear buzz and continue timer
document.getElementById("markIncorrect").onclick = () => {
    // Clear buzz
    document.getElementById("p1").style.backgroundColor = "white";
    document.getElementById("p2").style.backgroundColor = "white";
    socket.emit("clearbuzz", { room: ROOM });
    // Continue timer so the other player can buzz
    let timing = game.timing.getData();
    if (timing.state === "paused") {
        game.timing.update({
            start: getSyncedServerTime(),
            duration: timing.duration,
            elapsed: timing.elapsed,
            state: "running"
        });
    }
};

//scores are reset
document.getElementById("resetscores").onclick = () => {
    if (!confirm("Are you sure the match is over?")) {
        return;
    }
    socket.emit("resetScores", {
        room: ROOM,
    });
    document.getElementById("bar11").style.backgroundColor = "rgb(217, 83, 79)";
    document.getElementById("bar12").style.backgroundColor = "rgb(217, 83, 79)";
    document.getElementById("bar13").style.backgroundColor = "rgb(217, 83, 79)";
    document.getElementById("bar21").style.backgroundColor = "rgb(217, 83, 79)";
    document.getElementById("bar22").style.backgroundColor = "rgb(217, 83, 79)";
    document.getElementById("bar23").style.backgroundColor = "rgb(217, 83, 79)";
    document.getElementById("bar11").style.color = "rgb(217, 83, 79)";
    document.getElementById("bar12").style.color = "rgb(217, 83, 79)";
    document.getElementById("bar13").style.color = "rgb(217, 83, 79)";
    document.getElementById("bar21").style.color = "rgb(217, 83, 79)";
    document.getElementById("bar22").style.color = "rgb(217, 83, 79)";
    document.getElementById("bar23").style.color = "rgb(217, 83, 79)";
};

//competitor computers are set

//clears buzz
document.getElementById("clearBuzz").onclick = () => {
    document.getElementById("p1").style.backgroundColor = "white";
    document.getElementById("p2").style.backgroundColor = "white";
    socket.emit("clearbuzz", { room: ROOM });
};


const prepWindows = () => {
    document.getElementById("preview").scrollTo(228 * game.cur.getData(), 0);

    let i = 0;

    document.querySelectorAll(".window").forEach((e) => {
        e.classList.remove("cur");

        let j = i;
        e.onclick = () => {
            if (!confirm("Are you sure you want to move to slide " + j + "?")) {
                return;
            }

            game.cur.update(j)
        };

        i++;
    });
    document.querySelector(`.window[data-id="${game.cur.getData()}"]`).classList.add("cur");
}
let timerInterval;

const startTimer = (duration, start) => {
    let target = duration + start;

    clearInterval(timerInterval);

    document.getElementById("timer").style.background = "#d1fae5";

    timerInterval = setInterval(() => {
        document.getElementById("timer").innerText = (
            Math.max(0, target - getSyncedServerTime()) / 1000
        ).toFixed(2);

        if (target < getSyncedServerTime()) {
            document.getElementById("timer").style.background = "#fff1f2";

            game.timing.update({
                start: 0,
                duration: 0,
                elapsed: 0,
                state: "stopped"
            });

            clearInterval(timerInterval);
        }
    }, 10);
};



// New framework

const setCallbacks = () => {
    document.getElementById("move_left").onclick = () => {
        if (!confirm("Are you sure you want to move back?")) {
            return;
        }

        game.cur.update(Math.max(0, game.cur.getData() - 1));
    };

    document.getElementById("move_right").onclick = () => {
        if (!confirm("Are you sure you want to move forward?")) {
            return;
        }

        game.cur.update(Math.min(game.questions.getData().length - 1, game.cur.getData() + 1));
    };

    document.getElementById("startTimer").onclick = () => {
        game.timing.update({
            start: game.getTime(),
            duration: game.questions.getData()[game.cur.getData()].timeMS,
            elapsed: 0,
            state: "running"
        });
    };

    document.getElementById("continueTimer").onclick = () => {
        let timing = game.timing.getData();
        if (timing.state === "paused") {
            game.timing.update({
                start: game.getTime(),
                duration: timing.duration,
                elapsed: timing.elapsed,
                state: "running"
            });
        }else if (timing.state === "stopped"){
            game.timing.update({
                start: game.getTime(),
                duration: game.questions.getData()[game.cur.getData()].timeMS,
                elapsed: 0,
                state: "running"
            });
        }else{
            game.timing.update({
                start: timing.start,
                duration: timing.duration,
                elapsed: timing.elapsed + getSyncedServerTime() - timing.start,
                state: "paused"
            });
        }
    };

    document.getElementById("endTimer").onclick = () => {
        game.timing.update({
            start: 0,
            duration: 0,
            elapsed: 0,
            state: "stopped"
        });
    };
}

class TimingProperty extends Property{
    renderInternal(){
        let data = this.getData();
        if (data.state === "running") {
            startTimer(data.duration - data.elapsed, data.start);
            document.querySelector("#continueTimer i").className = "fa-solid fa-circle-pause"
        } else if (data.state === "paused") {
            document.getElementById("timer").style.background = "#fff1f2";
            clearInterval(timerInterval);
            document.querySelector("#continueTimer i").className = "fa-solid fa-circle-play"
        } else {
            document.getElementById("timer").style.background = "#fff1f2";
            clearInterval(timerInterval);
            document.getElementById("timer").innerText = "0.00";
            document.querySelector("#continueTimer i").className = "fa-solid fa-circle-play"
        }
    }
}

class CurProperty extends Property{
    renderInternal(){
        console.log(this)
        display(this.getData());
        prepWindows();
    }
}

class QuestionProperty extends Property{
    renderInternal(){

        let questions = this.data;
        document.getElementById("preview").innerHTML = "";
        console.log(questions, game)

        for (let i = 0; i < questions.length; i++) {
            let element = document.createElement("DIV");
            element.classList.add("window");
            element.classList.add("pwrapper");
            element.setAttribute("data-id", i);

            let inner = document.createElement("DIV");
            inner.classList.add("p");

            element.appendChild(inner);
            document.getElementById("preview").appendChild(element);

            display(i, inner);
        }

        prepWindows();
    }
}

class DeviceProperty extends AdminProperty{
    renderInternal(){
        document.getElementById("devices_wrapper").innerHTML = ""
        for (let user in this.data) {
            this.join({
                room: this.game.room,
                name: this.data[user].name,
                id: user,
                status: this.data[user].status,
            });
        }
    }

    join = (data) => {
        let template = document.getElementById("user").content.cloneNode(true);
        template.querySelector(".head").innerText = data.name;
        template.querySelector(".id").innerText = data.id;
        template.querySelector(".user_wrapper").id = `USER_${data.id}`;
        template.querySelector(".accept").setAttribute("data-id", data.id);
        template.querySelector(".deny").setAttribute("data-id", data.id);
        template.querySelector(".device").setAttribute("data-id", data.id);

        let type = 0;

        if (game.competitor.getData().competitor1 === data.id){
            type = 1;
        }else if (game.competitor.getData().competitor2 === data.id){
            type = 2;
        }

        template.querySelector(".user_type").classList.add(['spectator', 'one', 'two'][type])
        template.querySelector(".user_type").innerHTML = (['S', '1', '2'][type])
        template.querySelector(".user_type").setAttribute("data-id", data.id);
        template.querySelector(".user_type").setAttribute("data-type", type);

        if (data.status) {
            console.log(data.status);
            template.querySelector(".accept").remove();
            template.querySelector(".deny").remove();
            template.querySelector(`.user_wrapper`).classList.remove("pending");
        }

        document.getElementById("devices_wrapper").appendChild(template);

        document.querySelectorAll(".accept, .deny").forEach((e) => {
            e.onclick = () => {
                let id = e.getAttribute("data-id");

                if (e.classList.contains("deny")) {
                    socket.emit("clientDeny", { room: ROOM, id: id });
                    return;
                }

                socket.emit("clientAccept", { room: ROOM, id: id });

                // let a = document.querySelector(`.accept[data-id="${data.id}"]`);
                // let b = document.querySelector(`.deny[data-id="${data.id}"]`);
                // console.log(a);
                // console.log(b);
                // a.remove();
                // b.remove();
            };
        });

        document.querySelector(".user_wrapper:last-of-type .device").onclick = (
            e,
        ) => {
            if (!confirm("Are you sure you want to kick this user?")) {
                return;
            }
            socket.emit("clientDeny", {
                room: ROOM,
                id: e.currentTarget.getAttribute("data-id"),
            });

        };

        if (!data.status && !game.waiting.getData()) {
            let obj = document.querySelector(".user_wrapper:last-of-type .accept");
            if (obj) {
                obj.click();
            }
        }

        document.querySelectorAll('.user_type').forEach(a=>a.onclick = (e) => {
            let id = e.currentTarget.getAttribute("data-id")
            let type = Number(e.currentTarget.getAttribute("data-type"))

            console.log(id, type)

            if (type === 0 && game.competitor.getData().competitor1 && game.competitor.getData().competitor2){
                return;
            }

            if (type === 1){
                game.competitor.updateCompetitor1(null)
                if (!game.competitor.getData().competitor2){
                    game.competitor.updateCompetitor2(id)
                }
            }else if (type === 2){
                game.competitor.updateCompetitor2(null)
            }else{
                if (game.competitor.getData().competitor1){
                    game.competitor.updateCompetitor2(id)
                }else{
                    game.competitor.updateCompetitor1(id)
                }
            }
        })
    };
}

class WaitingProperty extends Property{
    renderInternal() {
        document.getElementById("toggleWaitingRoom").innerHTML =
            `${["Enable", "Disable"][Number(this.data)]} Waiting Room`;
    }
}

class AdminListProperty extends Property{
    renderInternal() {
        let content = []
        for (let key in this.data){
            content.push(this.data[key])
        }

        document.getElementById("adminList").innerText = `Connected Admins: ${content.join(", ")}`
    }
}

class CompetitorProperty extends Property{
    renderInternal() {}

    update(data){
        console.log("UPDATING COMPETITORS")
        this.data = data
        this.game.update(this)
        this.game.devices.update(this.game.devices.getData())
    }

    updateCompetitor1(id){
        this.data.competitor1  = id
        this.update(this.data)
    }

    updateCompetitor2(id){
        this.data.competitor2 = id
        this.update(this.data)
    }
}

class CompetitorNamesProperty extends Property{
    renderInternal() {
        document.getElementById("p1name").innerHTML = `[${this.data.seed1}] ${this.data.name1}`;
        document.getElementById("p2name").innerHTML = `${this.data.name2} [${this.data.seed2}]`;

    }
}

class BuzzedProperty extends Property{
    renderInternal() {
        console.log("RENDERING BUZZING")
        if (this.data.competitor1){
            document.getElementById("p1").style.background = "lightgreen";
        }else{
            document.getElementById("p1").style.background = "none";
        }
        if (this.data.competitor2){
            document.getElementById("p2").style.background = "lightgreen";
        }else{
            document.getElementById("p2").style.background = "none";
        }
    }
}