import presetHTML5 from "https://esm.sh/@bbob/preset-html5";
import { render } from "https://esm.sh/@bbob/html"
import core from "https://esm.sh/@bbob/core"
import parser from "https://esm.sh/@bbob/parser"

const PARAMS = new URLSearchParams(window.location.search)
const USERNAME = PARAMS.get("name").toUpperCase()
const ROOM = PARAMS.get("room").toUpperCase()

const socket = io();

let questions;

const htmlCore = core(presetHTML5())

const bbcodeRender = (code) => {
    code = code.replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\n", "<br>")

    return htmlCore.process(code, { render }).html
}
window.bbcodeRender=bbcodeRender

window.onload = () => {
    document.getElementById("name").innerText = `PLAYING AS ${USERNAME}`
}

socket.on("connect", () => {
    document.getElementById("status").innerText = `ID: ${socket.id}`

    socket.emit("clientJoin", {
        "name": USERNAME,
        "room": ROOM,
    })
})

socket.on("clientDeny", () => {
    location.href = "/?err=3"
})

socket.on("clientAccept", (data) => {
    document.getElementById("waiting").style.display = "none"

    questions = data.questions

    document.getElementById("questions").style.display = "block"

    display(Number(data.cur))
})

socket.on("clientSwitch", (data) => {
    display(Number(data.cur))
})

socket.on("clientUpload", (data) => {
    questions = data.code

    display(Number(0))
})


const display = (num) => {
    document.getElementById("questions_inner").innerHTML = bbcodeRender(questions[num])

    renderMath(document.getElementById("questions"))
}

const renderMath = (element) => {
    renderMathInElement(element,{delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false}]})
}