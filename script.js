const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let img = new Image();

// =========================
// STATE
// =========================
let zoom = 1;
let angle = 0;

let outer = {};
let inner = {};

let dragging = null;

const hitRange = 10;

// =========================
// ROTATION
// =========================
document.getElementById("rotate").oninput = function(e){
    angle = parseFloat(e.target.value) * Math.PI / 180;
    document.getElementById("angleLabel").innerText =
        parseFloat(e.target.value).toFixed(2) + "°";

    draw();
    updateCentering();
};

function nudgeRotate(amount){

    let slider = document.getElementById("rotate");

    let val = parseFloat(slider.value) + amount;
    val = Math.max(-45, Math.min(45, val));

    slider.value = val;

    angle = val * Math.PI / 180;

    document.getElementById("angleLabel").innerText =
        val.toFixed(2) + "°";

    draw();
    updateCentering();
}

// =========================
// ZOOM
// =========================
document.getElementById("zoom").oninput = function(e){
    zoom = parseFloat(e.target.value);
    updateZoomLabel();

    draw();
    updateCentering();
};

function nudgeZoom(amount){

    let slider = document.getElementById("zoom");

    let val = parseFloat(slider.value) + amount;
    val = Math.max(0.5, Math.min(3.0, val));

    slider.value = val;

    zoom = val;

    updateZoomLabel();

    draw();
    updateCentering();
}

function updateZoomLabel(){
    document.getElementById("zoomLabel").innerText =
        zoom.toFixed(3) + "x";
}

// =========================
// IMAGE LOAD
// =========================
document.getElementById("upload").onchange = function(e){

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event){

        img.onload = function(){

            const maxWidth = 900;
            let scale = img.width > maxWidth ? maxWidth / img.width : 1;

            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            outer = {
                left: canvas.width * 0.05,
                right: canvas.width * 0.95,
                top: canvas.height * 0.05,
                bottom: canvas.height * 0.95
            };

            inner = {
                left: canvas.width * 0.15,
                right: canvas.width * 0.85,
                top: canvas.height * 0.15,
                bottom: canvas.height * 0.85
            };

            draw();
            updateCentering();
        };

        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
};

// =========================
// DRAW
// =========================
function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.save();

    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);
    ctx.rotate(angle);

    ctx.drawImage(img, -cx, -cy, canvas.width, canvas.height);

    ctx.restore();

    drawGuides();
}

// =========================
// GUIDES
// =========================
function drawGuides(){

    ctx.strokeStyle = "rgb(0, 170, 255)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);

    drawLine(outer.left, "v");
    drawLine(outer.right, "v");
    drawLine(outer.top, "h");
    drawLine(outer.bottom, "h");

    ctx.strokeStyle = "rgb(255, 60, 60)";

    drawLine(inner.left, "v");
    drawLine(inner.right, "v");
    drawLine(inner.top, "h");
    drawLine(inner.bottom, "h");

    ctx.setLineDash([]);
}

function drawLine(pos, type){

    ctx.beginPath();

    if(type === "v"){
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
    } else {
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
    }

    ctx.stroke();
}

// =========================
// MOUSE HELPERS
// =========================
function getMouse(e){

    const rect = canvas.getBoundingClientRect();

    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function getLine(x,y){

    const lines = [
        ["ol","v",outer.left],
        ["or","v",outer.right],
        ["ot","h",outer.top],
        ["ob","h",outer.bottom],

        ["il","v",inner.left],
        ["ir","v",inner.right],
        ["it","h",inner.top],
        ["ib","h",inner.bottom],
    ];

    for(let l of lines){

        if(l[1] === "v" && Math.abs(x - l[2]) < hitRange)
            return l[0];

        if(l[1] === "h" && Math.abs(y - l[2]) < hitRange)
            return l[0];
    }

    return null;
}

// =========================
// DRAGGING
// =========================
canvas.onmousedown = (e) => {

    const pos = getMouse(e);

    dragging = getLine(pos.x, pos.y);
};

window.onmousemove = (e) => {

    const mouse = getMouse(e);

    // =========================
    // LIVE CURSOR HOVER
    // =========================
    const hoverLine = getLine(mouse.x, mouse.y);

    canvas.style.cursor = "crosshair";

    if(hoverLine){

        if(
            hoverLine === "ol" ||
            hoverLine === "or" ||
            hoverLine === "il" ||
            hoverLine === "ir"
        ){
            canvas.style.cursor = "ew-resize";
        }

        if(
            hoverLine === "ot" ||
            hoverLine === "ob" ||
            hoverLine === "it" ||
            hoverLine === "ib"
        ){
            canvas.style.cursor = "ns-resize";
        }
    }

    // =========================
    // DRAG UPDATE
    // =========================
    if(!dragging) return;

    const {x,y} = mouse;

    const minGap = 10;

    if(dragging === "ol")
        outer.left = Math.min(x, outer.right - minGap);

    if(dragging === "or")
        outer.right = Math.max(x, outer.left + minGap);

    if(dragging === "ot")
        outer.top = Math.min(y, outer.bottom - minGap);

    if(dragging === "ob")
        outer.bottom = Math.max(y, outer.top + minGap);

    if(dragging === "il")
        inner.left = Math.min(x, inner.right - minGap);

    if(dragging === "ir")
        inner.right = Math.max(x, inner.left + minGap);

    if(dragging === "it")
        inner.top = Math.min(y, inner.bottom - minGap);

    if(dragging === "ib")
        inner.bottom = Math.max(y, inner.top + minGap);

    draw();
    updateCentering();
};

window.onmouseup = () => {
    dragging = null;
};

// =========================
// LIVE CENTERING + PSA ESTIMATE
// =========================
function updateCentering(){

    let leftBorder = inner.left - outer.left;
    let rightBorder = outer.right - inner.right;

    let topBorder = inner.top - outer.top;
    let bottomBorder = outer.bottom - inner.bottom;

    let horizontal = leftBorder + rightBorder;
    let vertical = topBorder + bottomBorder;

    if(horizontal === 0 || vertical === 0){
        document.getElementById("result").innerHTML =
            "Invalid guide setup";
        return;
    }

    let leftPercent = (leftBorder / horizontal) * 100;
    let rightPercent = 100 - leftPercent;

    let topPercent = (topBorder / vertical) * 100;
    let bottomPercent = 100 - topPercent;


    // =========================
    // FIND WORST SIDE
    // =========================
    let horizontalOffset = Math.max(leftPercent, rightPercent);
    let verticalOffset = Math.max(topPercent, bottomPercent);

    // PSA uses the worst centering direction
    let worstCentering = Math.max(
        horizontalOffset,
        verticalOffset
    );


    // =========================
    // PSA ESTIMATE
    // =========================
    let grade;
    let gradeColor;


    if(worstCentering <= 55){
        grade = "PSA 10 (Gem Mint)";
        gradeColor = "#16a34a"; // green
    }
    else if(worstCentering <= 60){
        grade = "PSA 9 (Mint)";
        gradeColor = "#65a30d";
    }
    else if(worstCentering <= 65){
        grade = "PSA 8.5 (NM-MT+)";
        gradeColor = "#ca8a04";
    }
    else if(worstCentering <= 70){
        grade = "PSA 8 (NM-MT)";
        gradeColor = "#f59e0b";
    }
    else if(worstCentering <= 75){
        grade = "PSA 7.5 (EX-MT+)";
        gradeColor = "#ea580c";
    }
    else{
        grade = "PSA 7 or below";
        gradeColor = "#dc2626";
    }


    // =========================
    // DISPLAY RESULT
    // =========================
    const result = document.getElementById("result");

    result.style.backgroundColor = gradeColor;
    result.style.color = "white";


    result.innerHTML = `
        <div>
            Horizontal:
            ${leftPercent.toFixed(2)}% L /
            ${rightPercent.toFixed(2)}% R
        </div>

        <div>
            Vertical:
            ${topPercent.toFixed(2)}% T /
            ${bottomPercent.toFixed(2)}% B
        </div>

        <hr>

        <div style="font-size:26px;">
            Estimated ${grade}
        </div>
    `;
}