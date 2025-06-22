const PARAMS = new URLSearchParams(window.location.search)
const ERRORS = {
    "0": "Invalid room name",
    "1": "Incorrect room key",
    "2": "Please enter your name"
}

window.onload = () => {
    if (PARAMS.get("err")){
        document.getElementsByClassName("error")[0].style.display = "block"
        document.getElementsByClassName("error")[0].innerText = ERRORS[PARAMS.get("err")]
    }
}