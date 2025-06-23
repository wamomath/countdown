const PARAMS = new URLSearchParams(window.location.search)
const USERNAME = PARAMS.get("name").toUpperCase()
const ROOM = PARAMS.get("room").toUpperCase()

const socket = io();

window.onload = () => {
    document.getElementById("name").innerText = `PLAYING AS "${USERNAME}"`
}

socket.on("connect", () => {
    console.log(socket.id)
})