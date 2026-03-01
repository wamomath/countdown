const PARAMS = new URLSearchParams(window.location.search);
const ERRORS = {
    0: "Invalid room name",
    1: "Incorrect room key",
    2: "Please enter your name",
    3: "The host denied you access",
};

window.onload = () => {
    if (PARAMS.get("err")) {
        document.getElementsByClassName("error")[0].style.display = "block";
        document.getElementsByClassName("error")[0].innerText =
            ERRORS[PARAMS.get("err")];
    }
};

document.getElementById("observeBtn").onclick = () => {
    let room = document.querySelector("input[name='room']").value;
    let key = document.querySelector("input[name='key']").value;
    if (room && key) {
        window.location.href = `/observe?room=${encodeURIComponent(room)}&key=${encodeURIComponent(key)}`;
    } else {
        alert("Please enter both Room Name and Room Key to observe.");
    }
};
