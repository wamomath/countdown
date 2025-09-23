import presetHTML5 from "https://esm.sh/@bbob/preset-html5";
import { render } from "https://esm.sh/@bbob/html";
import core from "https://esm.sh/@bbob/core";
import parser from "https://esm.sh/@bbob/parser";
import {} from "https://esm.sh/hacktimer";

const PARAMS = new URLSearchParams(window.location.search);
const USERNAME = PARAMS.get("name").toUpperCase();
const ROOM = PARAMS.get("room").toUpperCase();

const socket = io();

let questions;

const htmlCore = core(presetHTML5());

let progressBarCounter = 0;

let accepted = false;

let curp1score = 0;
let curp2score = 0;

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

socket.on("connect", () => {
    document.getElementById("status").innerText = `ID: ${socket.id}`;

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

    questions = data.questions;

    document.getElementById("questions").style.display = "block";
    document.getElementById("timer").style.display = "block";
    document.getElementById("vsbar").style.display = "flex";

    display(Number(data.cur));
});

socket.on("clientSwitch", (data) => {
    if (!accepted) {
        return;
    }
    display(Number(data.cur));
});

socket.on("clientUpload", (data) => {
    if (!accepted) {
        return;
    }
    questions = data.code;

    display(Number(0));
});

socket.on("startTimer", (data) => {
    if (!accepted) {
        return;
    }
    setProgressBar(data.duration, Date.now() - data.start);
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
});

//keydown for the buzzers
document.addEventListener('keydown', function(event) {
    console.log('Key pressed:', event.key);//google ai
    if (event.key === '1'){
        document.getElementById("main").style.backgroundColor = "rgb(217, 83, 79) !important";
    }
});

const display = (num) => {
    document.getElementById("questions_inner").innerHTML = bbcodeRender(
        questions[num].statement,
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
};

window.setProgressBar = setProgressBar;
