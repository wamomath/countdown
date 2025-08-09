import presetHTML5 from "https://esm.sh/@bbob/preset-html5";
import { render } from "https://esm.sh/@bbob/html"
import core from "https://esm.sh/@bbob/core"
import parser from "https://esm.sh/@bbob/parser"

const htmlCore = core(presetHTML5())
const problem = document.getElementById("problem_template")

const PARAMS = new URLSearchParams(window.location.search)
const DATA = PARAMS.get("data")

let elements = []

const bbcodeRender = (code) => {
    code = code.replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\n", "<br>")

    return htmlCore.process(code, { render }).html
}

const renderMath = (element) => {
    renderMathInElement(element,{delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false}], throwOnError: false})
}
window.addEventListener("beforeunload", function (e) {
    (e || window.event).returnValue = "stop!"; //Gecko + IE
    return "stop!"; //Gecko + Webkit, Safari, Chrome etc.
});

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const add_problem = (data) => {
    let p = problem.content.cloneNode(true);

    let id = makeid(5)

    p.querySelector("textarea").setAttribute("data-id", id)
    p.querySelector(".rendered").id = "render" + id
    p.querySelector(".problem_wrapper").id = "wrapper" + id
    p.querySelector("input").setAttribute("data-id", id)
    p.querySelector("button").setAttribute("data-id", id)

    if (data && data.statement){
        p.querySelector("textarea").value = data.statement
    }

    if (data && data.timeMS !== undefined){
        p.querySelector("input").value = data.timeMS
    }

    document.getElementById("wrapper").appendChild(p)

    document.querySelectorAll("textarea").forEach(e => {
        e.onkeyup = () => {
            document.getElementById(`render${e.getAttribute("data-id")}`).innerHTML = bbcodeRender(e.value)
            renderMath(document.getElementById(`render${e.getAttribute("data-id")}`))
        }
    })

    document.querySelectorAll(".problem_wrapper button").forEach(e => {
        e.onclick = () => {
            if (!confirm("Are you sure?")){
                return;
            }
            let id = e.getAttribute("data-id")

            elements.splice(elements.indexOf(id), 1)

            document.getElementById("wrapper"+id).remove()
        }
    })

    elements.push(id)
}

const parse = () => {
    console.log(elements)
    let res = []

    for (let id of elements){
        res.push({
            statement: document.querySelector(`textarea[data-id="${id}"]`).value,
            timeMS: Number(document.querySelector(`input[data-id="${id}"]`).value),
        })
    }

    return res
}

if (DATA){
    try {
        let parsedData = JSON.parse(DATA)

        for (let problem of parsedData){
            add_problem(problem)
        }

        document.querySelectorAll("textarea").forEach(e=>{e.onkeyup()})
    }catch{
        add_problem()
    }
}else{
    add_problem()
}



document.getElementById("copy").onclick = () => {
    let parsed = parse();
    parsed = JSON.stringify(parsed);
    navigator.clipboard.writeText(parsed)
}

document.getElementById("copy").onmouseover = () => {
    let parsed = parse();
    parsed = JSON.stringify(parsed);
    document.getElementById("export").href = "data:text/json;charset=utf-8," + encodeURIComponent(parsed)
}

window.parse = parse

document.getElementById("new").onclick = add_problem