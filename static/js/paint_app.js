let canvas;
let ctx;
let canvas_2;
let ctx_2;
let save_image;
let dragging = false;
let line_width = 8;
let strokeColor = 'black';
let fillColor = 'black';
let current_tool = "brush";
let canvas_width = 280;
let canvas_height = 280;

class Points{
    constructor(x,y){
        this.x=x;
        this.y=y;
    }
}

let mousedown = new Points(0,0);
let loc = new Points(0,0);

let usingBrush = false;
// Stores line x & ys used to make brush lines
let brushXPoints = new Array();
let brushYPoints = new Array();
// Stores whether mouse is down
let brushDownPos = new Array();//holds 'one' path
//array of every path holds array of arrays
let paths = new Array();


document.addEventListener('DOMContentLoaded',setupCanvas);

function setupCanvas(){
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext('2d');
    canvas_2 = document.getElementById("afterPreprocessing");
    ctx_2 = canvas_2.getContext('2d');
    ctx.strokeStytle = strokeColor;
    ctx.lineWidth = line_width;
    canvas.addEventListener("mousedown",ReactToMouseDown);
    canvas.addEventListener("mousemove", ReactToMouseMove);
    canvas.addEventListener("mouseup", ReactToMouseup);
    console.log("setup canvas");
}

function changeTool(toolClicked){
    document.getElementById('brush').className = "";
    document.getElementById('eraser').className = "";
    document.getElementById(toolClicked).className = "selected";
    current_tool = toolClicked;
}

//get mouse position
function getMousePosition(x,y){
    let canvas_data = canvas.getBoundingClientRect();
    return {
        x: (x - canvas_data.left) * (canvas.width / canvas_data.width),
        y: (y - canvas_data.top) * (canvas.height / canvas_data.height)};
}

//save canvas image
function saveCanvasimage(){
    save_image = ctx.getImageData(0,0,canvas.width,canvas.height);
}

// redraw canvas
function redrawCanvasImage(){
    ctx.putImageData(save_image,0,0);
}

//react to mouse down 
function ReactToMouseDown(e){
    canvas.style.cursor = "crosshair";
    loc = getMousePosition(e.clientX,e.clientY);
    saveCanvasimage();
    mousedown.x = loc.x;
    mousedown.y = loc.y;
    dragging = true;
    //handel brush
    if (current_tool === 'brush') {
        usingBrush = true;
        AddBrushPoint(loc.x, loc.y,true);
        Draw();
    }else{
        usingBrush = true;
        AddBrushPoint(loc.x, loc.y, true);
        Draw();
    }
}
//react to mouse up
function ReactToMouseup(e){
    canvas.style.cursor = "default";
    loc = getMousePosition(e.clientX, e.clientY);
    //redrawCanvasImage();
    deagging=false;
    usingBrush = false;
    Draw();
    paths.push([brushXPoints,brushYPoints]);
    resetArray();
}
//react to mouse move
function ReactToMouseMove(e){
    canvas.style.cursor = "crosshair";
    loc = getMousePosition(e.clientX, e.clientY);

    if (dragging && usingBrush) {
        // Throw away brush drawings that occur outside of the canvas
        if (loc.x >= 0 && loc.x <= canvas_width && loc.y >= 0 && loc.y <= canvas_height) {
            AddBrushPoint(loc.x, loc.y, true);
        }
        Draw();
    } else {
        if (dragging) {
            Draw()
        }
    }
}



function saveImage(){
    save_image = ctx.getImageData(0, 0, canvas_width, canvas_height);
    ctx.drawImage(save_image.data, 0, 0, 28, 28);
    //let result = JSON.stringify(save_image);
    //download(save_image.data.toString(), 'json.txt', 'text/plain');
    //console.log(result);
}

//clear image
function clear_canvas(){
    resetArray();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx_2.clearRect(0, 0, canvas.width, canvas.height);
}

function AddBrushPoint(x, y, mouseDown) {
    brushXPoints.push(x);
    brushYPoints.push(y);
    // Store true that mouse is down
    //console.log('here in add points');
    brushDownPos.push(mouseDown);
}
let i = 1;
function DrawBrush() {
    for (; i < brushXPoints.length; i++) {
        ctx.beginPath();
        // Check if the mouse button was down at this point
        // and if so continue drawing
        if (brushDownPos[i]) {
            ctx.moveTo(brushXPoints[i - 1], brushYPoints[i - 1]);
        } else {
            ctx.moveTo(brushXPoints[i] - 1, brushYPoints[i]);
        }
        //ctx.arc(brushXPoints[i], brushYPoints[i], line_width, 0, 2 * Math.PI);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(brushXPoints[i], brushYPoints[i]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    ctx.closePath();
}

function resetArray(){
    brushXPoints = new Array();
    brushYPoints = new Array();
    // Stores whether mouse is down
    brushDownPos = new Array();
    i = 1;
}

function Draw(){
    if (current_tool === "brush") {
        // Create paint brush
        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = fillColor;
        DrawBrush();
    } else if (current_tool === "eraser"){
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = '#fff';
        DrawBrush();
    }
}


// pre processing image
//decrease image resolution and convert to gray scale image before sending to server
//============================================================================
// computes center of mass of digit, for centering
// note 1 stands for black (0 white) so we have to invert.
function centerImage(img) {
    var meanX = 0;
    var meanY = 0;
    var rows = img.length;
    var columns = img[0].length;
    var sumPixels = 0;
    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < columns; x++) {
            var pixel = (1 - img[y][x]);
            sumPixels += pixel;
            meanY += y * pixel;
            meanX += x * pixel;
        }
    }
    meanX /= sumPixels;
    meanY /= sumPixels;

    var dY = Math.round(rows / 2 - meanY);
    var dX = Math.round(columns / 2 - meanX);
    return { transX: dX, transY: dY };
}

// given grayscale image, find bounding rectangle of digit defined
// by above-threshold surrounding
function getBoundingRectangle(img, threshold) {
    var rows = img.length;
    var columns = img[0].length;
    var minX = columns;
    var minY = rows;
    var maxX = -1;
    var maxY = -1;
    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < columns; x++) {
            if (img[y][x] < threshold) {
                if (minX > x) minX = x;
                if (maxX < x) maxX = x;
                if (minY > y) minY = y;
                if (maxY < y) maxY = y;
            }
        }
    }
    return { minY: minY, minX: minX, maxY: maxY, maxX: maxX };
}

// take canvas image and convert to grayscale. Mainly because my
// own functions operate easier on grayscale, but some stuff like
// resizing and translating is better done with the canvas functions
function imageDataToGrayscale(imgData) {
    var grayscaleImg = [];
    for (var y = 0; y < imgData.height; y++) {
        grayscaleImg[y] = [];
        for (var x = 0; x < imgData.width; x++) {
            var offset = y * 4 * imgData.width + 4 * x;
            var alpha = imgData.data[offset + 3];
            // weird: when painting with stroke, alpha == 0 means white;
            // alpha > 0 is a grayscale value; in that case I simply take the R value
            if (alpha == 0) {
                imgData.data[offset] = 255;
                imgData.data[offset + 1] = 255;
                imgData.data[offset + 2] = 255;
            }
            imgData.data[offset + 3] = 255;
            // simply take red channel value. Not correct, but works for
            // black or white images.
            grayscaleImg[y][x] = imgData.data[y * 4 * imgData.width + x * 4 + 0] / 255;
        }
    }
    return grayscaleImg;
}
// takes the image in the canvas, centers & resizes it, then puts into 10x10 px bins
// to give a 28x28 grayscale image; then, computes class probability via neural network

function prepareImageForPrediction() {
    console.log("prepareImageForPrediction");
    // convert RGBA image to a grayscale array, then compute bounding rectangle and center of mass  
    //var imgData = ctx.getImageData(0, 0, 280, 280);
    
    // now bin image into 10x10 blocks (giving a 28x28 image)
    imgData = ctx.getImageData(0, 0, 280, 280);
    grayscaleImg = imageDataToGrayscale(imgData);
    var nnInput = new Array(784);
    for (var y = 0; y < 28; y++) {
        for (var x = 0; x < 28; x++) {
            var mean = 0;
            for (var v = 0; v < 10; v++) {
                for (var h = 0; h < 10; h++) {
                    mean += grayscaleImg[y * 10 + v][x * 10 + h];
                }
            }
            mean = (1 - mean / 100); // average and invert
            nnInput[x * 28 + y] = (mean - .5) / .5;
        }
    }

    // for visualization/debugging: paint the input to the neural net.

    ctx_2.clearRect(0, 0, canvas.width, canvas.height);
    ctx_2.drawImage(ctx.canvas, 0, 0);
    for (var y = 0; y < 28; y++) {
        for (var x = 0; x < 28; x++) {
            var block = ctx_2.getImageData(x * 10, y * 10, 10, 10);
            var newVal = 255 * (0.5 - nnInput[x * 28 + y] / 2);
            for (var i = 0; i < 4 * 10 * 10; i += 4) {
                block.data[i] = newVal;
                block.data[i + 1] = newVal;
                block.data[i + 2] = newVal;
                block.data[i + 3] = 255;
            }
            ctx_2.putImageData(block, x * 10, y * 10);
        }
    }

    let str = array_to_csv(nnInput);
    console.log(str);
    //download(str, "nnIn.txt", "text");
    get_result(nnInput);
    //send to server
}

function array_to_csv(array){
    let str = array.toString();
    return str;
}

function get_result(nnInput){

    var xhr = new XMLHttpRequest();
    var url = "http://127.0.0.1:5000/regonize";
    xhr.open("POST", url, true);
    console.log("here in get result");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var json = JSON.parse(xhr.responseText);
            console.log(json.pred);
        }
    };
    var data = JSON.stringify({'in_image': nnInput });
    
    xhr.send(data);
}

function block_mean(img,x,y){
    let mean = 0;
    for (let i = 0; i < 4 * 10 * 10; i+=4) {
        mean += img.data[y * (10 * 4) + x * 4+i];
        //console.log(img.data[i]);
    }
    return mean/100; 
}

// draws a line from (x1, y1) to (x2, y2) with nice rounded caps
function draw(ctx, color, lineWidth, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
}

//Run-length encoding image to array
/* def rle_encoding(x):
    dots = np.where(x.T.flatten() == 1)[0]
    run_lengths = []
    prev = -2
    for b in dots:
        if (b > prev + 1): run_lengths.extend((b + 1, 0))
    run_lengths[-1] += 1
    prev = b
    return run_length */

function RL_encode(){

}

//============================================================================

// download file
function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}