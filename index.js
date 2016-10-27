(function(window) {
  
window.reload = function()
{
  var start = performance.now()
  if (window.cleanupPrevious) {
    window.cleanupPrevious()
  }

  //console.log('reloading js')
  loadJs('index.js')
  function rafCallback() {
    window.render()
    window.rafCallbackId = window.requestAnimationFrame(rafCallback)
  }
  window.rafCallbackId = window.requestAnimationFrame(rafCallback)
  document.addEventListener('keypress', onKeypress)

  window.cleanupPrevious = function() {
    window.cancelAnimationFrame(window.rafCallbackId)
    document.removeEventListener('keypress', onKeypress)
  }
  //console.log('reload took', performance.now() - start, 'ms')
}

if (!window.hasReload) {
  // this code should only be called once per page load

  window.hasReload = true
  if (window.setupReload) {
    // I think we need an extra layer of indirection here to make sure we pick up new values of window.reload - should check
    window.setInterval(function reloadCallback() { window.reload() }, 250)
  }
  window.state = {
    clickedPlaces: [],
    canvas: null,
    dragging: false,
  }
  window.reload()
}

function onResetPressed() {
  window.state.clickedPlaces = []
  window.state.score = null
}

function onKeypress(keyEvent) {
  var keyChar = String.fromCharCode(keyEvent.keyCode || keyEvent.charCode).toUpperCase()
  console.log(keyChar, 'pressed')
  switch (keyChar) {
    case 'R': onResetPressed()
  }
}

function drawCross(ctx, point) {
  ctx.fillStyle = 'red'
  ctx.fillRect(point[0]-2, point[1], 4, 1)
  ctx.fillRect(point[0], point[1]-2, 1, 4)
}

function drawCircle(ctx, center, radius) {
  ctx.strokeStyle = 'red'
  ctx.lineWidth = 1
  ctx.beginPath()
  //console.log(`drawing a circle at ${center[0]},${center[1]} with radius ${radius}`)
  ctx.arc(center[0], center[1], radius, 0, 2*Math.PI)
  ctx.stroke()
}


function drawGraph(ctx) {
  ctx.fillStyle = 'black'
  window.state.clickedPlaces.forEach(function(clickedPlace) {
    ctx.fillRect(clickedPlace[0], clickedPlace[1], 2, 2)
  })

  if (window.state.score) {
    var score = window.state.score
    drawCross(ctx, score.circleCenter)
    drawCircle(ctx, score.circleCenter, score.stats.avgRadius)
  }
}

function getCenterOfCircle(clickedPlaces) {
  // currently we just average all the points to guess where the center of the circle is
  // this will unfairly bias the center to places where the line has overlapped, even
  // if it overlaps perfectly. In the future we probably want to try and discard points
  // which are on the outside of an overlap

  var totalX = 0
  var totalY = 0
  clickedPlaces.forEach(function(place) {
    totalX += place[0]
    totalY += place[1]
  })

  var count = clickedPlaces.length
  return [totalX/count,totalY/count]
}

function calculateStats(circleCenter, clickedPlaces) {
  var minRadius = null
  var maxRadius = null
  var totalRadius = 0
  clickedPlaces.forEach(function(place) {
    var absX = Math.abs(place[0] - circleCenter[0])
    var absY = Math.abs(place[1] - circleCenter[1])
    var radius = Math.sqrt(absX*absX + absY*absY)
    if (minRadius == null || minRadius > radius) { minRadius = radius }
    if (maxRadius == null || maxRadius < radius) { maxRadius = radius }
    totalRadius += radius
  })
  var count = clickedPlaces.length
  return {minRadius: minRadius, maxRadius: maxRadius, avgRadius: totalRadius/count}
}

function getScore(circleCenter, clickedPlaces, stats) {
  return 100
}

function calculateScore(clickedPlaces) {
  var circleCenter = getCenterOfCircle(clickedPlaces)
  var stats = calculateStats(circleCenter, clickedPlaces)
  var score = getScore(circleCenter, clickedPlaces, stats)
  return { circleCenter: circleCenter, stats: stats, score: score }
}

function setScore() {
  var scoreObject = calculateScore(window.state.clickedPlaces)
  console.log(scoreObject)
  window.state.score = scoreObject
}

function getActualCoordinates(clickEvent) {
  // this accounts for the canvas being scaled or not being at 0,0 on the screen
  var canvas = window.state.canvas
  var x = clickEvent.pageX - canvas.offsetLeft
  var y = clickEvent.pageY - canvas.offsetTop
  var mx = Math.round(x * canvas.width / canvas.offsetWidth)
  var my = Math.round(y * canvas.height / canvas.offsetHeight)
  return [mx, my]
}

function onCanvasMousedown(clickEvent) {
  //console.log(clickEvent)
  window.state.dragging = true
}

function onCanvasMousemove(moveEvent) {
  if (!window.state.dragging) { return }
  //console.log(moveEvent)
  coords = getActualCoordinates(moveEvent)
  //console.log(`registered mouse at (${coords[0]},${coords[1]})`)
  window.state.clickedPlaces.push(coords)
}

function onCanvasMouseup(upEvent) {
  if (!window.state.dragging) { return }
  //console.log(upEvent)
  window.state.dragging = false
  setScore()
}

window.render = function render() {
  var start = performance.now()
  //console.log(Math.round(performance.now()), 'render')
  var ctx = window.state.canvas.getContext("2d");
  drawGraph(ctx);
  //console.log('render took', performance.now() - start, 'ms')
}

function init() {
  var body = document.getElementsByTagName("body")[0];
  while (body.hasChildNodes()) {
      body.removeChild(body.lastChild);
  }
  var canvas = window.state.canvas = document.createElement("canvas");
  canvas.width = 650;
  canvas.height = 530;
  body.appendChild(canvas);

  canvas.addEventListener('mousedown', onCanvasMousedown)
  canvas.addEventListener('mousemove', onCanvasMousemove)
  canvas.addEventListener('mouseup', onCanvasMouseup)

  render()
}

init()

})(window)
