import presetHTML5 from "https://esm.sh/@bbob/preset-html5";
import { render } from "https://esm.sh/@bbob/html";
import core from "https://esm.sh/@bbob/core";
import parser from "https://esm.sh/@bbob/parser";
import {} from "https://esm.sh/hacktimer";

const PARAMS = new URLSearchParams(window.location.search);
const ROOM = PARAMS.get("room").toUpperCase();
const socket = io();

let questions;
const htmlCore = core(presetHTML5());
let progressBarCounter = 0;
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

const applyTheme = (theme) => {
    if (theme === "dark") document.body.classList.add("dark-theme");
    else document.body.classList.remove("dark-theme");
};

// NEW: Function to force the Observer out of the waiting room
const revealBoard = () => {
    document.getElementById("waiting").style.display = "none";
    document.getElementById("questions").style.display = "block";
    document.getElementById("timer").style.display = "block";
    document.getElementById("vsbar").style.display = "flex";
};

socket.on("connect", async () => {
    document.getElementById("status").innerText = `CONNECTED`;
    OFFSET = await getTimeOffset();
    socket.emit("observerJoin", { room: ROOM });
});

socket.on("observerSync", (data) => {
    questions = data.questions;
    applyTheme(data.theme);

    // If the admin has already moved the slide or set names, bypass waiting room!
    let matchStarted =
        data.cur > 0 || (data.names && data.names.competitor1 !== "");

    if (data.waiting && !matchStarted) {
        document.getElementById("waiting").style.display = "block";
        document.getElementById("questions").style.display = "none";
        document.getElementById("timer").style.display = "none";
        document.getElementById("vsbar").style.display = "none";
    } else {
        revealBoard();
        display(Number(data.cur));
    }

    if (data.names && data.names.competitor1) {
        document.getElementById("p1name").innerHTML =
            `[${data.names.c1seed}] ${data.names.competitor1}`;
        document.getElementById("p2name").innerHTML =
            `${data.names.competitor2} [${data.names.c2seed}]`;
    }

    if (data.scores) {
        curp1score = data.scores.p1;
        curp2score = data.scores.p2;
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`bar1${i}`).style.backgroundColor =
                i <= curp1score ? "#5cb85c" : "rgb(217, 83, 79)";
            document.getElementById(`bar2${i}`).style.backgroundColor =
                i <= curp2score ? "#5cb85c" : "rgb(217, 83, 79)";
        }
    }
});

socket.on("toggleWaitingRoom", (data) => {
    if (data.waiting) {
        document.getElementById("waiting").style.display = "block";
        document.getElementById("questions").style.display = "none";
        document.getElementById("timer").style.display = "none";
        document.getElementById("vsbar").style.display = "none";
    } else {
        revealBoard();
        display(Number(data.cur));
    }
});

socket.on("themeUpdate", (data) => applyTheme(data.theme));

// Auto-reveal if admin does anything to prepare the match
socket.on("clientSwitch", (data) => {
    revealBoard();
    display(Number(data.cur));
});
socket.on("updateNames", (data) => {
    revealBoard();
    document.getElementById("p1name").innerHTML =
        `[${data.c1seed}] ${data.competitor1}`;
    document.getElementById("p2name").innerHTML =
        `${data.competitor2}[${data.c2seed}]`;
});
socket.on("assignCompetitors", () => {
    revealBoard();
});
socket.on("startTimer", (data) => {
    revealBoard();
    setProgressBar(data.duration, getSyncedServerTime() - data.start);
});

socket.on("clientUpload", (data) => {
    questions = data.code;
    display(0);
});

socket.on("updateScores", (data) => {
    if (data.playernum == 1) {
        curp1score++;
        document.getElementById(`bar1${curp1score}`).style.backgroundColor =
            "#5cb85c";
    } else if (data.playernum == 2) {
        curp2score++;
        document.getElementById(`bar2${curp2score}`).style.backgroundColor =
            "#5cb85c";
    }
});

socket.on("resetScores", () => {
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`bar1${i}`).style.backgroundColor =
            "rgb(217, 83, 79)";
        document.getElementById(`bar2${i}`).style.backgroundColor =
            "rgb(217, 83, 79)";
    }
    curp1score = 0;
    curp2score = 0;
});

socket.on("buzz", (data) => {
    if (data.playernum == 1)
        document.getElementById("p1").style.backgroundColor = "lightgreen";
    else if (data.playernum == 2)
        document.getElementById("p2").style.backgroundColor = "lightgreen";
});

socket.on("clearbuzz", () => {
    document.getElementById("p1").style.backgroundColor = "";
    document.getElementById("p2").style.backgroundColor = "";
    document.getElementById("progress").style.backgroundColor = "#5cb85c";
    document.getElementById("timer").style.backgroundColor = "#020617";
});

socket.on("pauseTimer", () => {
    document.getElementById("favicon").href = "/assets/alarmred.svg";
    setProgressBar(0, 0);
    document.getElementById("progress").style.backgroundColor = "lightgreen";
    document.getElementById("timer").style.backgroundColor = "lightgreen";
});

socket.on("continueTimer", (data) => {
    document.getElementById("favicon").href = "/assets/alarmgreen.svg";
    document.getElementById("progress").style.backgroundColor = "#5cb85c";
    document.getElementById("timer").style.backgroundColor = "#020617";
    setProgressBar(data.duration, data.elapsed);
});

socket.on("endTimer", () => {
    document.getElementById("favicon").href = "/assets/alarmred.svg";
    document.getElementById("progress").style.backgroundColor = "#5cb85c";
    document.getElementById("timer").style.backgroundColor = "#020617";
    setProgressBar(0, 0);
});

const display = (num) => {
    if (questions && questions[num]) {
        document.getElementById("questions_inner").innerHTML = bbcodeRender(
            questions[num].statement,
        );
        renderMath(document.getElementById("questions"));
    }
};

const renderMath = (element) => {
    renderMathInElement(element, {
        delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
        ],
    });
};

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    let transition = Math.min(100, timeAlloted);
    let clock = performance.now();
    let animation;
    for (let i = 0; i <= iterations; i++) {
        await timeout(timeAlloted - transition);
        if (me !== progressBarCounter) return;
        animation = progressBar.animate(
            [
                { width: `${spacing * i + offset}px` },
                { width: `${spacing * (i + 1) + offset}px` },
            ],
            { fill: "forwards", duration: transition, easing: "linear" },
        );
        // Hello, it's andrew
        // I've been working on making the good better for the sake of less bugs
        // I've been migrating the codebase to a better way to sync values across devices
        // I didn't realize you guys were writing code here
        // It's a bit of a mess because the code needs to be merged now
        // it's fine just ignore the code i added
        // an observer view + light/dark mode 
        // wesley also added the converter thing
        // kaiyuan
        // np
        // also
        // can u add like a current standings thing in the observer view
        // cuz for our mathcounts mock its supposed to be ladder and we only have one screen
        // like for the top 10 in the countdown round 
        // alright thanks, maybe add it as a column on the left
        // bye ok 
        // Oh, I can try
        //Okay, I got to go now. Bye. Try not to touch admin.js, index.js, or play.js since I've been working on those.
        // oh you mean for scores?
        // what did you add btw? Is it just the observer view? 
        // Oh that's not bad then. Then it should be a very easy merge then

        // Who am I talking to btw?
        // okay, cool
        // Thanks for working on the website btw, really appreciate the dedication :)
        await timeout(
            Math.max(clock + timeAlloted * (i + 1) - performance.now(), 0),
        );
    }
    if (animation) animation.cancel();
    progressBar.animate(
        [{ width: `0px` }, { width: progressBarWidth + "px" }],
        { fill: "forwards", duration: 0, easing: "linear" },
    );
    progressBar.style.backgroundColor = "#d9534f";
    document.getElementById("favicon").href = "/assets/alarmred.svg";
};
window.setProgressBar = setProgressBar;
