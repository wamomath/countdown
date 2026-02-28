import presetHTML5 from "https://esm.sh/@bbob/preset-html5";
import { render } from "https://esm.sh/@bbob/html";
import core from "https://esm.sh/@bbob/core";
import parser from "https://esm.sh/@bbob/parser";
import {} from "https://esm.sh/hacktimer";

const PARAMS = new URLSearchParams(window.location.search);
const USERNAME = PARAMS.get("name").toUpperCase();
const ROOM = PARAMS.get("room").toUpperCase();

const socket = io();

const htmlCore = core(presetHTML5());

let progressBarCounter = 0;

let accepted = false;

let curp1score = 0;
let curp2score = 0;


let hasbuzzed = true;
let hasbuzzedtoggle = false;

let game;

class CountdownGame extends Game{
    key;
    questions;
    timing;
    waiting;
    cur;
    competitor;


    constructor(room, socket, state){
        super(room, socket, state);
        this.key = new Property(this, "devices", {})
        this.questions = new QuestionsProperty(this, "questions", {})
        this.timing = new Property(this, "timing", {})
        this.waiting = new Property(this, "waiting", true)
        this.cur = new CurProperty(this, "cur")
        this.competitor = new CompetitorProperty(this, "competitor", true)
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
            if (!this.hasOwnProperty(identifier)){
                continue;
            }
            let property = this[identifier];
            property.updateExternal(state[identifier]);
        }

        if (render){
            for (let identifier in state){
                if (!this.hasOwnProperty(identifier)) {
                    continue;
                }
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
            cur: this.cur.toJSON()
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

window.onload = () => {
    document.getElementById("name").innerText = `PLAYING AS ${USERNAME}`;
};

socket.on("connect", async () => {
    document.getElementById("status").innerText = `ID: ${socket.id}`;

    OFFSET = await getTimeOffset()

    console.log("TIME COMPENSATION IN MILLISECONDS", OFFSET)

    socket.emit("clientJoin", {
        name: USERNAME,
        room: ROOM,
    });
});

socket.on("clientDeny", () => {
    location.href = "/?err=3";
});

socket.on("clientAccept", (data) => {
    accepted = true;
    document.getElementById("waiting").style.display = "none";

    document.getElementById("questions").style.display = "block";
    document.getElementById("timer").style.display = "block";
    document.getElementById("vsbar").style.display = "flex";

    console.log("RECEIVING DATA")

    game = new CountdownGame(ROOM, socket, data)
    window.game = game
    game.renderAll()
});

socket.on("clientSwitch", (data) => {
    if (!accepted) {
        return;
    }
    display(Number(data.cur));
    hasbuzzed = false;
    hasbuzzedtoggle = false;
});

class CurProperty extends Property{
    renderInternal(){
        display(Number(this.data));
    }
}

class QuestionsProperty extends Property{
    renderInternal() {
        console.log("New Question Set Uploaded!")
    }
}

class CompetitorProperty extends Property{
    renderInternal() {
        document.querySelector("footer").classList.remove("one")
        document.querySelector("footer").classList.remove("two")
        if (this.isCompetitor1()){
            document.querySelector("footer").classList.add("one")
        }else if (this.isCompetitor2()){
            document.querySelector("footer").classList.add("two")
        }
    }

    isCompetitor1(){
        return socket.id === this.data.competitor1
    }

    isCompetitor2() {
        return socket.id === this.data.competitor2
    }
}

socket.on("startTimer", (data) => {
    if (!accepted) {
        return;
    }
    setProgressBar(data.duration, getSyncedServerTime() - data.start);
});

//socket updates names and displays them
socket.on("updateNames", (data) => {
    //if (!accepted){return} commented because the text should still change
    document.getElementById("p1name").innerHTML =
        `[${data.c1seed}] ${data.competitor1}`;
    document.getElementById("p2name").innerHTML =
        `${data.competitor2} [${data.c2seed}]`;
});

//socket updates scores and displays them
socket.on("updateScores", (data) => {
    if (!accepted) {
        return;
    }
    let playernum = data.playernum;
    if (playernum == 1) {
        curp1score = curp1score + 1;
        document.getElementById(`bar1${curp1score}`).style.backgroundColor =
            "#5cb85c";
        document.getElementById(`bar1${curp1score}`).style.color = "#5cb85c";
    } else if (playernum == 2) {
        curp2score = curp2score + 1;
        document.getElementById(`bar2${curp2score}`).style.backgroundColor =
            "#5cb85c";
        document.getElementById(`bar2${curp2score}`).style.color = "#5cb85c";
    } else {
        console.log("what the hell is going on");
    }
});

//socket sets scores to 0
socket.on("resetScores", (data) => {
    if (!accepted) {
        return;
    }
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
    curp1score = 0;
    curp2score = 0;
});


//upon buzz shade buzzing side
socket.on("buzz", (data) => {
    if (data.playernum == 1){
        document.getElementById("p1").style.backgroundColor = "lightgreen";
    } else if (data.playernum == 2){
        document.getElementById("p2").style.backgroundColor = "lightgreen";
    }
})

//clearbuzz removes the buzz
socket.on("clearbuzz", (data) =>{
    document.getElementById("p1").style.backgroundColor = "white";
    document.getElementById("p2").style.backgroundColor = "white";
    document.getElementById("progress").style.backgroundColor = "#5cb85c"
    document.getElementById("timer").style.backgroundColor = "#020617"
    if (!hasbuzzedtoggle) {
        hasbuzzed = false;
    }
})

//pause animation for timer
socket.on("pauseTimer", (data) => {
    document.getElementById("favicon").href = "/assets/alarmred.svg";
    setProgressBar(0,0);
    document.getElementById("progress").style.backgroundColor = "lightgreen"
    document.getElementById("timer").style.backgroundColor = "lightgreen"
    hasbuzzed = true;
})

//continue animation for timer
socket.on("continueTimer", (data) => {
    document.getElementById("favicon").href = "/assets/alarmgreen.svg";
    document.getElementById("progress").style.backgroundColor = "#5cb85c"
    document.getElementById("timer").style.backgroundColor = "#020617"
    setProgressBar(data.duration, data.elapsed);
    if (!hasbuzzedtoggle) {
        hasbuzzed = false;
    }
})

//end animation for timer
socket.on("endTimer", (data) => {
    document.getElementById("favicon").href = "/assets/alarmred.svg";
    document.getElementById("progress").style.backgroundColor = "#5cb85c"
    document.getElementById("timer").style.backgroundColor = "#020617"
    setProgressBar(0,0);
    hasbuzzed = true;
})

//keydown for the buzzers
document.addEventListener('keydown', function(event) {
    if (!game){
        return;
    }
    console.log("BUZING AT", event.key === ' ', game.competitor.isCompetitor1(), !hasbuzzed)
    if (event.key === ' ' && game.competitor.isCompetitor1() && !hasbuzzed){
        console.log("buzzing c1")
        document.getElementById("p1").style.backgroundColor = "lightgreen";
        socket.emit("buzz", {
            room: ROOM,
            playernum: 1
        })
        socket.emit("pauseTimer", {
            room: ROOM
        })
        hasbuzzed = true;
        hasbuzzedtoggle = true;
    } else if (event.key === ' ' && game.competitor.isCompetitor2() && !hasbuzzed){
        console.log("buzzing c2")
        document.getElementById("p2").style.backgroundColor = "lightgreen";
        socket.emit("buzz", {
            room: ROOM,
            playernum: 2
        })
        socket.emit("pauseTimer", {
            room: ROOM
        })
        hasbuzzed = true
        hasbuzzedtoggle = true;
    }
});

const display = (num) => {
    document.getElementById("questions_inner").innerHTML = bbcodeRender(
        game.questions.getData()[num].statement,
    );

    renderMath(document.getElementById("questions"));
};

const renderMath = (element) => {
    renderMathInElement(element, {
        delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
        ],
    });
};

const timeout = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

const setProgressBar = async (durationMS, elapsedTime = 0) => {
    let me = ++progressBarCounter;
    let progressBar = document.getElementById("progress");

    progressBar.animate([{ width: `0px` }, { width: "0px" }], {
        fill: "forwards",
        duration: 0,
        easing: "linear",
    });

    progressBar.style.backgroundColor = "#5cb85c";
    let spacing = 25;
    let progressBarWidth = document.getElementById("timer").scrollWidth - 10;
    let offset = (elapsedTime / durationMS) * progressBarWidth;

    document.getElementById("favicon").href = "/assets/alarmgreen.svg";

    progressBar.style.backgroundPositionX = `${offset}px`;

    let iterations = (progressBarWidth - offset) / spacing;
    progressBar.style.width = "0px";

    let timeAlloted = (durationMS - elapsedTime) / (iterations + 1);
    let transition = Math.min(100, timeAlloted); // 2% of a second

    console.time("PROGRESS BAR " + me);
    let clock = performance.now();
    let animation;
    for (let i = 0; i <= iterations; i++) {
        // <= is intentional to allow the full progress bar
        // We wish to be at iteration i at time clock + timeAlloted*(i)
        let startTarget = clock + timeAlloted * i;
        await timeout(timeAlloted - transition);
        if (me !== progressBarCounter) {
            console.log("NEW TIMER DETECTED. ABORTING");
            return;
        }
        animation = progressBar.animate(
            [
                { width: `${spacing * i + offset}px` },
                { width: `${spacing * (i + 1) + offset}px` },
            ],
            {
                fill: "forwards",
                duration: transition,
                easing: "linear",
            },
        );
        let endTarget = clock + timeAlloted * (i + 1);
        await timeout(Math.max(endTarget - performance.now(), 0));
    }
    console.timeEnd("PROGRESS BAR " + me);

    if (animation) {
        animation.cancel();
    }
    progressBar.animate(
        [{ width: `0px` }, { width: progressBarWidth + "px" }],
        {
            fill: "forwards",
            duration: 0,
            easing: "linear",
        },
    );

    progressBar.style.backgroundColor = "#d9534f";
    document.getElementById("favicon").href = "/assets/alarmred.svg";
    hasbuzzed = true;
};

window.setProgressBar = setProgressBar;
