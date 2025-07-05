const PARAMS = new URLSearchParams(window.location.search)
const USERNAME = PARAMS.get("name").toUpperCase()
const ROOM = PARAMS.get("room").toUpperCase()

const socket = io();

socket.on("connect", () => {
    socket.emit("adminJoin", {
        username: USERNAME,
        room: ROOM
    })
})

socket.on("adminJoin", (data) => {
    for (let user in data.devices){
        join({
            room: ROOM,
            name: data.devices[user].name,
            id: user,
            status: data.devices[user].status
        })
    }
})

const join = (data) => {
    let template = document.getElementById("user").content.cloneNode(true)
    template.querySelector(".head").innerText = data.name
    template.querySelector(".id").innerText = data.id
    template.querySelector(".user_wrapper").id = `USER_${data.id}`
    template.querySelector(".accept").setAttribute("data-id", data.id);
    template.querySelector(".deny").setAttribute("data-id", data.id);

    if (data.status){
        console.log(data.status)
        template.querySelector(".accept").remove();
        template.querySelector(".deny").remove()
    }

    document.getElementById("devices_wrapper").appendChild(template)

    document.querySelectorAll(".accept, .deny").forEach(e => {
        e.onclick = () => {
            let id = e.getAttribute("data-id")

            if (e.classList.contains("deny")){
                socket.emit("clientDeny", {"room": ROOM, "id": id})
                return
            }

            socket.emit("clientAccept", {"room": ROOM, "id": id})

            let a = document.querySelector(`.accept[data-id="${data.id}"]`);
            let b = document.querySelector(`.deny[data-id="${data.id}"]`);
            a.remove();
            b.remove();
        }
    })
}

socket.on("clientJoin", join)

socket.on("clientAccept", (data) => {
    let a = document.querySelector(`.accept[data-id="${data.id}"]`);
    let b = document.querySelector(`.deny[data-id="${data.id}"]`);
    if (a){
        a.remove();
    }
    if (b){
        b.remove();
    }
})

socket.on("clientDeny", (data) => {
    document.querySelector(`#USER_${data.id}`).remove()
})

socket.on("userDisconnect", (id) => {
    if (document.getElementById(`USER_${id}`)){
        document.getElementById(`USER_${id}`).remove()
    }
})

let render = (element) => {
    renderMathInElement(element,{delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false}]})
}

render(document.getElementById("display"))