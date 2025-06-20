const PARAMS = new URLSearchParams(window.location.search)
const USERNAME = PARAMS.get("name").toUpperCase()

window.onload = () => {
    document.getElementById("name").innerText = `PLAYING AS "${USERNAME}"`
}