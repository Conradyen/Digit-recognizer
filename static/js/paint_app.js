let canvas;
let ctx;
let canvas_2;
let ctx_2;
let save_image;
let dragging = false;
let line_width = 10;
let strokeColor = "black";
let fillColor = "black";
let current_tool = "brush";
let canvas_width = 280;
let canvas_height = 280;
let canvas_3;
let ctx_3;
class Points {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

let mousedown = new Points(0, 0);
let loc = new Points(0, 0);

let usingBrush = false;
// Stores line x & ys used to make brush lines
let brushXPoints = new Array();
let brushYPoints = new Array();
// Stores whether mouse is down
let brushDownPos = new Array(); //holds 'one' path
//array of every path holds array of arrays
let paths = new Array();
let colormap = new Map([
  [0, "#767f79"],
  [1, "#6a8573"],
  [2, "#5e8b6e"],
  [3, "#529269"],
  [4, "#469863"],
  [5, "#3b9f5e"],
  [6, "#2fa559"],
  [7, "#23ab53"],
  [8, "#17b241"],
  [9, "#0bb849"]
]);

var touchAvailable = "createTouch" in document || "ontouchstart" in window;

document.addEventListener("DOMContentLoaded", setupCanvas);

function setupCanvas() {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");
  //canvas_2 = document.getElementById("afterPreprocessing");
  //ctx_2 = canvas_2.getContext('2d');
  //canvas_3 = document.getElementById("resultCanvas");
  //ctx_3 = canvas_3.getContext("2d");
  ctx.strokeStytle = strokeColor;
  ctx.lineWidth = line_width;
  console.log("setup canvas");

  if (touchAvailable) {
    canvas.addEventListener("touchstart", draw, false);
    canvas.addEventListener("touchmove", draw, false);
    canvas.addEventListener("touchend", draw, false);
  }
  // attach the mousedown, mousemove, mouseup event listeners.
  else {
    canvas.addEventListener("mousedown", ReactToMouseDown);
    canvas.addEventListener("mousemove", ReactToMouseMove);
    canvas.addEventListener("mouseup", ReactToMouseup);
  }

  // prevent elastic scrolling
  document.body.addEventListener(
    "touchmove",
    function(event) {
      event.preventDefault();
    },
    false
  );
}

function changeTool(toolClicked) {
  document.getElementById("brush").className = "";
  document.getElementById("eraser").className = "";
  document.getElementById(toolClicked).className = "selected";
  current_tool = toolClicked;
}

//get mouse position
function getMousePosition(x, y) {
  let canvas_data = canvas.getBoundingClientRect();
  return {
    x: (x - canvas_data.left) * (canvas.width / canvas_data.width),
    y: (y - canvas_data.top) * (canvas.height / canvas_data.height)
  };
}

function getTouchPos(e) {
  if (!e) var e = event;

  if (e.touches) {
    if (e.touches.length == 1) {
      // Only deal with one finger
      var touch = e.touches[0]; // Get the information for finger #1
      touchX = touch.pageX - touch.target.offsetLeft;
      touchY = touch.pageY - touch.target.offsetTop;
    }
  }
}

//save canvas image
function saveCanvasimage() {
  save_image = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// redraw canvas
function redrawCanvasImage() {
  ctx.putImageData(save_image, 0, 0);
}

//react to mouse down
function ReactToMouseDown(e) {
  canvas.style.cursor = "crosshair";
  loc = getMousePosition(e.clientX, e.clientY);
  saveCanvasimage();
  mousedown.x = loc.x;
  mousedown.y = loc.y;
  dragging = true;
  //handel brush
  if (current_tool === "brush") {
    usingBrush = true;
    AddBrushPoint(loc.x, loc.y, true);
    Draw();
  } else {
    usingBrush = true;
    AddBrushPoint(loc.x, loc.y, true);
    Draw();
  }
}
//react to mouse up
function ReactToMouseup(e) {
  canvas.style.cursor = "default";
  loc = getMousePosition(e.clientX, e.clientY);
  //redrawCanvasImage();
  dragging = false;
  usingBrush = false;
  Draw();
  paths.push([brushXPoints, brushYPoints]);
  resetArray();
  get_result();
}
//react to mouse move
function ReactToMouseMove(e) {
  canvas.style.cursor = "crosshair";
  loc = getMousePosition(e.clientX, e.clientY);

  if (dragging && usingBrush) {
    // Throw away brush drawings that occur outside of the canvas
    if (
      loc.x >= 0 &&
      loc.x <= canvas_width &&
      loc.y >= 0 &&
      loc.y <= canvas_height
    ) {
      AddBrushPoint(loc.x, loc.y, true);
    } else {
      dragging = false;
      usingBrush = false;
      paths.push([brushXPoints, brushYPoints]);
      resetArray();
      get_result();
    }
    Draw();
  } else {
    if (dragging) {
      Draw();
    }
  }
}

function saveImage() {
  save_image = ctx.getImageData(0, 0, canvas_width, canvas_height);
  ctx.drawImage(save_image.data, 0, 0, 28, 28);
  //let result = JSON.stringify(save_image);
  //download(save_image.data.toString(), 'json.txt', 'text/plain');
  //console.log(result);
}

//clear image
function clear_canvas() {
  resetArray();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //ctx_3.clearRect(0, 0, canvas_3.width, canvas_3.height);
  //ctx_2.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i <= 9; i++) {
    let res = "result".concat(i.toString(10));
    document.getElementById(res).style.color = "#fff";
    document.getElementById(res).style.backgroundColor = "#969292";
    document.getElementById(res).style.fontWeight = "500";
    document.getElementById(res).style.WebkitAnimation = null;
  }
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
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(brushXPoints[i], brushYPoints[i]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.closePath();
}

function resetArray() {
  brushXPoints = new Array();
  brushYPoints = new Array();
  // Stores whether mouse is down
  brushDownPos = new Array();
  i = 1;
}

function Draw() {
  if (current_tool === "brush") {
    // Create paint brush
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    DrawBrush();
  } else if (current_tool === "eraser") {
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = "#fff";
    DrawBrush();
  }
}

function array_to_csv(array) {
  let str = array.toString();
  return str;
}
//https://stackoverflow.com/questions/34972072/how-to-send-image-to-server-with-http-post-in-javascript-and-store-base64-in-mon
// This function accepts three arguments, the URL of the image to be
// converted, the mime type of the Base64 image to be output, and a
// callback function that will be called with the data URL as its argument
// once processing is complete

function getcolor(prob) {
  if (prob < 0.1) {
    return 0;
  } else if (prob >= 0.1 && prob < 0.2) {
    return 1;
  } else if (prob >= 0.2 && prob < 0.3) {
    return 2;
  } else if (prob >= 0.3 && prob < 0.4) {
    return 3;
  } else if (prob >= 0.4 && prob < 0.5) {
    return 4;
  } else if (prob >= 0.5 && prob < 0.6) {
    return 5;
  } else if (prob >= 0.6 && prob < 0.7) {
    return 6;
  } else if (prob >= 0.7 && prob < 0.8) {
    return 7;
  } else if (prob >= 0.9 && prob < 1) {
    return 8;
  } else {
    return 9;
  }
}

function showpred(res) {
  //ctx_3.font = "150px Comic Sans MS";
  //ctx_3.textAlign = "center";
  //ctx_3.fillText(pred, 140, 140);
  pred = res.result;
  prob = res.pred[0];
  for (let i = 0; i <= 9; i++) {
    let color = getcolor(prob[i]);
    let temp = "result".concat(i.toString(10));
    document.getElementById(temp).style.color = "#fff";
    document.getElementById(temp).style.backgroundColor = colormap.get(color);
    document.getElementById(temp).style.WebkitAnimation = null;
  }
  let res_out = "result".concat(pred.toString(10));
  console.log(res_out);
  document.getElementById(res_out).style.fontWeight = "900";
  document.getElementById(res_out).style.WebkitAnimation =
    "neon3 1.5s ease-in-out infinite alternate";
  //document.getElementById(res).style.backgroundColor = "#fff";
}

function get_result() {
  //var canvas = document.getElementById("myCanvas");
  var imgURL = canvas.toDataURL();
  console.log(imgURL);
  var httpPost = new XMLHttpRequest(),
    path = "http://conradyen.com/app/recognize",
    data = JSON.stringify({ image: imgURL });
  httpPost.onreadystatechange = function(err) {
    if (httpPost.readyState == 4 && httpPost.status == 200) {
      console.log(httpPost.responseText);
      var res = JSON.parse(httpPost.responseText);
      console.log(res.result);
      showpred(res);
    } else {
      console.log(err);
    }
  };
  // Set the content type of the request to json since that's what's being sent
  //httpPost.setHeader('Content-Type', 'application/json');
  httpPost.open("POST", path, true);
  httpPost.send(data);
}

function block_mean(img, x, y) {
  let mean = 0;
  for (let i = 0; i < 4 * 10 * 10; i += 4) {
    mean += img.data[y * (10 * 4) + x * 4 + i];
    //console.log(img.data[i]);
  }
  return mean / 100;
}

// draws a line from (x1, y1) to (x2, y2) with nice rounded caps
function draw(ctx, color, lineWidth, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.closePath();
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
