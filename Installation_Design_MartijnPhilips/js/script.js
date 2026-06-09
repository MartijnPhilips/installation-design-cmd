const GRID_SIZE = 16;

let isDrawing = false;
let activePointerId = null;

const ERASER = "eraser";
const colors = [
    "#121212", //done
    "#79756A", //done
    "#FFFFFF", //done
    "#782017", //done
    "#BC2034", //done
    "#E91E3C", //done
    "#46802C", //done
    "#00A388", //done
    "#84BC68", //done
    "#005784", //done
    "#00A2CD", //done
    "#69C2C1", //done
    "#C68037", //done
    "#FF8324", //done
    "#EAB809", //done
    "#7A1C4D", //done
    "#F76E98", //done
    "#E2A7C0", //done
];

let selectedColor = colors[0];

const grid = document.getElementById("grid");
const palette = document.getElementById("palette");
const exportBtn = document.getElementById("exportBtn");

const pixels = [];

/* ---------- Palette ---------- */

colors.forEach((color, index) => {
    const el = document.createElement("div");
    el.className = "color";
    el.style.background = color;

    if(index === 0){
        el.classList.add("selected");
    }

    el.addEventListener("click", () => {
        document
            .querySelectorAll(".color")
            .forEach(c => c.classList.remove("selected"));

        el.classList.add("selected");
        selectedColor = color;
    });

    palette.appendChild(el);
});

/* ---------- Grid ---------- */

for(let y=0;y<GRID_SIZE;y++){
    for(let x=0;x<GRID_SIZE;x++){

        const pixel = document.createElement("div");

        pixel.className = "pixel";
        pixel.dataset.x = x;
        pixel.dataset.y = y;
        pixel.dataset.color = "";

        pixel.addEventListener("pointerdown", (e) => {

            activePointerId = e.pointerId;

            pixel.setPointerCapture(e.pointerId);

            paintPixel(pixel);
            e.preventDefault();
        });

        pixel.addEventListener("pointermove", (e) => {

            if (activePointerId !== e.pointerId) return;

            const el = document.elementFromPoint(e.clientX, e.clientY);

            if (el && el.classList.contains("pixel")) {
                paintPixel(el);
            }
        });

        grid.appendChild(pixel);
        pixels.push(pixel);
    }
}

/* ---------- Validatie ---------- */

function getColoredPixels(){

    return pixels.filter(
        p => p.dataset.color !== ""
    );
}

function validateShape() {
    const info = document.querySelector(".export-wrapper .info");
    pixels.forEach(p => p.classList.remove("invalid"));

    const colored = getColoredPixels();

    if (colored.length === 0) {
        exportBtn.disabled = true;
        return;
    }

    const visitedGlobal = new Set();
    const clusters = [];

    function floodFill(start) {

        const queue = [start];
        const visited = new Set([start]);

        while (queue.length) {

            const current = queue.shift();

            const x = Number(current.dataset.x);
            const y = Number(current.dataset.y);

            const neighbors = [
                [x + 1, y],
                [x - 1, y],
                [x, y + 1],
                [x, y - 1]
            ];

            for (const [nx, ny] of neighbors) {

                const neighbor = pixels.find(p =>
                    Number(p.dataset.x) === nx &&
                    Number(p.dataset.y) === ny
                );

                if (
                    neighbor &&
                    neighbor.dataset.color !== "" &&
                    !visited.has(neighbor)
                ) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        return visited;
    }

    // clusters bouwen
    for (const pixel of colored) {

        if (visitedGlobal.has(pixel)) continue;

        const cluster = floodFill(pixel);

        cluster.forEach(p => visitedGlobal.add(p));
        clusters.push(cluster);
    }

    // grootste cluster vinden
    let largest = null;

    for (const c of clusters) {
        if (!largest || c.size > largest.size) {
            largest = c;
        }
    }

    let hasInvalid = false;

    // kleine clusters rood maken
    for (const cluster of clusters) {

        if (cluster !== largest) {
            cluster.forEach(p => {
                p.classList.add("invalid");
                hasInvalid = true;
            });
        }
    }

    // export alleen als 1 cluster EN geen invalid
    exportBtn.disabled = !(clusters.length === 1 && !hasInvalid);
    info.style.opacity = clusters.length === 1 && !hasInvalid ? "0" : "1";
}

/* ---------- PNG Export ---------- */

exportBtn.addEventListener("click", () => {

    const scale = 32;

    const canvas = document.createElement("canvas");
    canvas.width = GRID_SIZE * scale;
    canvas.height = GRID_SIZE * scale;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    pixels.forEach(pixel => {

        const color = pixel.dataset.color;

        if(color === "") return;

        const x = Number(pixel.dataset.x);
        const y = Number(pixel.dataset.y);

        ctx.fillStyle = color;

        ctx.fillRect(
            x * scale,
            y * scale,
            scale,
            scale
        );
    });

    const link = document.createElement("a");

    link.download = "sticker.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

document.addEventListener("pointerup", (e) => {
    activePointerId = null;
    isDrawing = false;
});

document.addEventListener("pointercancel", () => {
    activePointerId = null;
    isDrawing = false;
});
function paintPixel(pixel){

    if(selectedColor === ERASER){

        pixel.dataset.color = "";
        pixel.style.background = "transparent";
        pixel.classList.remove("invalid");

        validateShape(); // <-- BELANGRIJK
        return;
    }

    pixel.dataset.color = selectedColor;
    pixel.style.background = selectedColor;

    validateShape();
}
const resetBtn = document.getElementById("resetBtn");
const resetModal = document.getElementById("resetModal");
const cancelReset = document.getElementById("cancelReset");
const confirmReset = document.getElementById("confirmReset");

/* Open popup */
resetBtn.addEventListener("click", () => {
    resetModal.classList.remove("hidden");
});

/* Cancel */
cancelReset.addEventListener("click", () => {
    resetModal.classList.add("hidden");
});

/* Confirm reset */
confirmReset.addEventListener("click", () => {

    pixels.forEach(pixel => {
        pixel.dataset.color = "";
        pixel.style.background = "transparent";
        pixel.classList.remove("invalid");
    });

    exportBtn.disabled = true;

    resetModal.classList.add("hidden");
});

/* klik buiten box = sluiten */
resetModal.addEventListener("click", (e) => {
    if (e.target === resetModal) {
        resetModal.classList.add("hidden");
    }
});

const eraserBtn = document.querySelector(".eraser");

eraserBtn.addEventListener("click", () => {
    document
        .querySelectorAll(".color")
        .forEach(c => c.classList.remove("selected"));

    eraserBtn.classList.add("selected");
    selectedColor = ERASER;
});