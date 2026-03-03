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

let game;

const buzz1 = new Audio('assets/buzzerlow.mp3');
const buzz2 = new Audio('assets/buzzerhigh.mp3');

window.buzz1 = buzz1; window.buzz2 = buzz2

class CountdownGame extends Game{
    key;
    questions;
    timing;
    waiting;
    cur;
    competitor;
    competitorNames;
    buzzed;
    scores;


    constructor(room, socket, state){
        super(room, socket, state);
        this.key = new Property(this, "key", {})
        this.questions = new QuestionsProperty(this, "questions", {})
        this.timing = new TimingProperty(this, "timing", {})
        this.waiting = new Property(this, "waiting", true)
        this.cur = new CurProperty(this, "cur")
        this.competitor = new CompetitorProperty(this, "competitor", true)
        this.competitorNames = new CompetitorNamesProperty(this, "competitorNames", {})
        this.buzzed = new BuzzedProperty(this, "buzzed", { competitor1: false, competitor2: false })
        this.scores = new ScoresProperty(this, "scores", { player1: 0, player2: 0 })

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

    console.log("RECEIVING DATA", data)

    game = new CountdownGame(ROOM, socket, data)
    window.game = game
    game.renderAll()
});

socket.on("clientSwitch", (data) => {
    if (!accepted) {
        return;
    }
    display(Number(data.cur));
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
        console.log(this.isCompetitor1(), this.isCompetitor2(), this.data)
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

class CompetitorNamesProperty extends Property{
    renderInternal() {
        document.getElementById("p1name").innerHTML = `[${this.data.seed1}] ${this.data.name1}`;
        document.getElementById("p2name").innerHTML = `${this.data.name2} [${this.data.seed2}]`;

    }
}

class TimingProperty extends Property{
    renderInternal(){
        let data = this.getData();
        if (data.state === "running") {
            document.getElementById("favicon").href = "/assets/alarmgreen.svg";
            document.getElementById("progress").style.backgroundColor = "#5cb85c";
            document.getElementById("timer").style.backgroundColor = "#020617";
            let currentElapsed = data.elapsed + (getSyncedServerTime() - data.start);
            setProgressBar(data.duration, currentElapsed);
        } else if (data.state === "paused") {
            document.getElementById("favicon").href = "/assets/alarmred.svg";
            progressBarCounter++;
            document.getElementById("progress").style.backgroundColor = "lightgreen";
            document.getElementById("timer").style.backgroundColor = "lightgreen";
        } else if (data.state === "reading") {
            document.getElementById("favicon").href = "/assets/alarmred.svg";
            document.getElementById("progress").style.backgroundColor = "#5cb85c";
            document.getElementById("timer").style.backgroundColor = "#020617";
            setProgressBar(0, 0);
        } else {
            document.getElementById("favicon").href = "/assets/alarmred.svg";
            document.getElementById("progress").style.backgroundColor = "#5cb85c";
            document.getElementById("timer").style.backgroundColor = "#020617";
            setProgressBar(0, 0);
        }
    }
}

class BuzzedProperty extends Property{
    renderInternal() {
        console.log("RENDERING BUZZING")
        if (this.data.competitor1){
            document.getElementById("p1").style.background = (this.data.lastBuzzer === 1 ? "lightgreen" : "#e2e8f0");
        }else{
            document.getElementById("p1").style.background = "none";
        }
        if (this.data.competitor2){
            document.getElementById("p2").style.background = (this.data.lastBuzzer === 2 ? "lightgreen" : "#e2e8f0");
        }else{
            document.getElementById("p2").style.background = "none";
        }
        let hasLastBuzzer = !!this.data.lastBuzzer;
    }
}

class ScoresProperty extends Property{
    renderInternal() {
        let scores = this.data;
        for (let i = 1; i <= 3; i++){
            document.getElementById(`bar1${i}`).style.backgroundColor = i <= scores.player1 ? "#5cb85c" : "rgb(217, 83, 79)";
            document.getElementById(`bar1${i}`).style.color = i <= scores.player1 ? "#5cb85c" : "rgb(217, 83, 79)";
            document.getElementById(`bar2${i}`).style.backgroundColor = i <= scores.player2 ? "#5cb85c" : "rgb(217, 83, 79)";
            document.getElementById(`bar2${i}`).style.color = i <= scores.player2 ? "#5cb85c" : "rgb(217, 83, 79)";
        }
    }
}

//keydown for the buzzers
document.addEventListener('keydown', function(event) {
    if (!game){
        return;
    }
    let timing = game.timing.getData();
    let buzzed = game.buzzed.getData();
    let isReading = timing.state === "reading";
    let timeRemaining = (timing.start + timing.duration - timing.elapsed) - getSyncedServerTime();
    let canBuzz = (timing.state === "running" && timeRemaining > 0) || isReading;

    if (event.key === ' ' && game.competitor.isCompetitor1() && canBuzz && !buzzed.competitor1){
        console.log("buzzing c1")
        buzz1.play()
        document.getElementById("p1").style.backgroundColor = "lightgreen";
        game.buzzed.update({ competitor1: true, competitor2: buzzed.competitor2, lastBuzzer: 1 });
        game.timing.update({
            start: isReading ? getSyncedServerTime() : timing.start,
            duration: timing.duration,
            elapsed: isReading ? 0 : timing.elapsed + getSyncedServerTime() - timing.start,
            state: "paused"
        });
    } else if (event.key === ' ' && game.competitor.isCompetitor2() && canBuzz && !buzzed.competitor2){
        console.log("buzzing c2")
        buzz2.play()
        document.getElementById("p2").style.backgroundColor = "lightgreen";
        game.buzzed.update({ competitor1: buzzed.competitor1, competitor2: true, lastBuzzer: 2 });
        game.timing.update({
            start: isReading ? getSyncedServerTime() : timing.start,
            duration: timing.duration,
            elapsed: isReading ? 0 : timing.elapsed + getSyncedServerTime() - timing.start,
            state: "paused"
        });
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
    progressBar.animate([{ width: `0px` }, { width: `0px` }], {
        fill: "forwards",
        duration: 0,
        easing: "linear",
    });


    progressBar.style.backgroundColor = "#5cb85c";
    let spacing = 25;
    let progressBarWidth = document.getElementById("timer").scrollWidth - 10;
    let offset = (elapsedTime / durationMS) * progressBarWidth;

    progressBar.animate([{ width: `${offset}px` }, { width: `${offset}px` }], {
        fill: "forwards",
        duration: 0,
        easing: "linear",
    });

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
};

window.setProgressBar = setProgressBar;
