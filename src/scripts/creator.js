import presetHTML5 from "https://esm.sh/@bbob/preset-html5";
import { render } from "https://esm.sh/@bbob/html"
import core from "https://esm.sh/@bbob/core"
import parser from "https://esm.sh/@bbob/parser"

const htmlCore = core(presetHTML5())
const problem = document.getElementById("problem_template")

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

const add_problem = () => {
    let p = problem.content.cloneNode(true);

    let id = makeid(5)

    p.querySelector("textarea").setAttribute("data-id", id)
    p.querySelector(".rendered").id = "render" + id

    document.getElementById("wrapper").appendChild(p)

    document.querySelectorAll("textarea").forEach(e => {
        e.onkeyup = () => {
            document.getElementById(`render${e.getAttribute("data-id")}`).innerHTML = bbcodeRender(e.value)
            renderMath(document.getElementById(`render${e.getAttribute("data-id")}`))

            let parsed = parse();

            parsed = JSON.stringify(parsed);

            document.getElementById("copy").onclick = () => {navigator.clipboard.writeText(parsed)}
            document.getElementById("export").href = "data:text/json;charset=utf-8," + encodeURIComponent(parsed)
        }
    })

}

const parse = () => {
    let res = []

    document.querySelectorAll("textarea").forEach((e) => {
        res.push(e.value)
    })

    return res
}

add_problem()

document.getElementById("new").onclick = add_problem