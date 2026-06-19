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
// ROTATION CONTROLS
// =========================
document.getElementById("rotate").oninput = function(e){
    angle = parseFloat(e.target.value) * Math.PI / 180;
    document.getElementById("angleLabel").innerText =
        parseFloat(e.target.value).toFixed(2) + "°";
    draw();
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
}

// =========================
// ZOOM CONTROLS
// =========================
document.getElementById("zoom").oninput = function(e){
    zoom = parseFloat(e.target.value);
    updateZoomLabel();
    draw();
};

function nudgeZoom(amount){

    let slider = document.getElementById("zoom");

    let val = parseFloat(slider.value) + amount;

    val = Math.max(0.5, Math.min(3.0, val));

    slider.value = val;

    zoom = val;

    updateZoomLabel();
    draw();
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
        };

        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
};

// =========================
// DRAW PIPELINE
// =========================
function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // =========================
    // IMAGE (ZOOM + ROTATE)
    // =========================
    ctx.save();

    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);
    ctx.rotate(angle);

    ctx.drawImage(img, -cx, -cy, canvas.width, canvas.height);

    ctx.restore();

    // =========================
    // CROSSHAIR GUIDES
    // =========================
    drawGuides();
}

// =========================
// CROSSHAIR LINES
// =========================
function drawGuides(){

    // OUTER (blue)
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;

    drawLine(outer.left, "v");
    drawLine(outer.right, "v");
    drawLine(outer.top, "h");
    drawLine(outer.bottom, "h");

    // INNER (red)
    ctx.strokeStyle = "red";

    drawLine(inner.left, "v");
    drawLine(inner.right, "v");
    drawLine(inner.top, "h");
    drawLine(inner.bottom, "h");
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
// MOUSE
// =========================
function getMouse(e){

    const rect = canvas.getBoundingClientRect();

    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

// =========================
// HIT DETECTION
// =========================
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
// DRAG START
// =========================
canvas.onmousedown = (e) => {

    const pos = getMouse(e);

    dragging = getLine(pos.x, pos.y);
};

// =========================
// DRAG MOVE
// =========================
window.onmousemove = (e) => {

    if(!dragging) return;

    const {x,y} = getMouse(e);

    const minGap = 10;

    // OUTER
    if(dragging === "ol")
        outer.left = Math.min(x, outer.right - minGap);

    if(dragging === "or")
        outer.right = Math.max(x, outer.left + minGap);

    if(dragging === "ot")
        outer.top = Math.min(y, outer.bottom - minGap);

    if(dragging === "ob")
        outer.bottom = Math.max(y, outer.top + minGap);

    // INNER
    if(dragging === "il")
        inner.left = Math.min(x, inner.right - minGap);

    if(dragging === "ir")
        inner.right = Math.max(x, inner.left + minGap);

    if(dragging === "it")
        inner.top = Math.min(y, inner.bottom - minGap);

    if(dragging === "ib")
        inner.bottom = Math.max(y, inner.top + minGap);

    draw();
};

// =========================
// STOP DRAG
// =========================
window.onmouseup = () => {
    dragging = null;
};

// =========================
// CENTERING CALC
// =========================
function calculate(){

    let leftBorder = inner.left - outer.left;
    let rightBorder = outer.right - inner.right;

    let topBorder = inner.top - outer.top;
    let bottomBorder = outer.bottom - inner.bottom;

    let horizontal = leftBorder + rightBorder;
    let vertical = topBorder + bottomBorder;

    if(horizontal === 0 || vertical === 0){
        document.getElementById("result").innerHTML = "Invalid guide setup";
        return;
    }

    let leftPercent = (leftBorder / horizontal) * 100;
    let rightPercent = 100 - leftPercent;

    let topPercent = (topBorder / vertical) * 100;
    let bottomPercent = 100 - topPercent;

    document.getElementById("result").innerHTML = `
        Horizontal: ${leftPercent.toFixed(2)}% L / ${rightPercent.toFixed(2)}% R<br>
        Vertical: ${topPercent.toFixed(2)}% T / ${bottomPercent.toFixed(2)}% B
    `;
}