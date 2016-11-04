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
    target: noTarget(),
  }
  window.reload()
}

function noTarget() {
  return { type: 'none' }
}

function reset() {
  window.state.clickedPlaces = []
  window.state.score = null
}

function resetTarget() {
  window.state.target = noTarget()
}

function createTargetLine() {
  var canvasWidth = window.state.canvas.width
  var canvasHeight = window.state.canvas.height
  var slope = Math.random() > 0.5 ? 1 : -1;
  var dx = Math.round(canvasWidth  / 2 * Math.random())
  var dy = Math.round(canvasHeight / 2 * Math.random()) * slope
  var sx = (canvasWidth  / 2) - dx
  var sy = (canvasHeight / 2) - dy
  var ex = (canvasWidth  / 2) + dx
  var ey = (canvasHeight / 2) + dy
  window.state.target = {
    type: 'line',
    start: [sx, sy],
    end: [ex, ey],
  }
}

function onKeypress(keyEvent) {
  var keyChar = String.fromCharCode(keyEvent.keyCode || keyEvent.charCode).toUpperCase()
  console.log(keyChar, 'pressed')
  switch (keyChar) {
    case 'R': reset(); resetTarget(); break;
    case 'L': createTargetLine(); break;
  }
}

function clearCanvas(ctx) {
  var canvas = ctx.canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function drawCross(ctx, point, style, size) {
  var size = size || 2
  ctx.fillStyle = style || 'red'
  ctx.fillRect(point[0]-size, point[1], size*2, 1)
  ctx.fillRect(point[0], point[1]-size, 1, size*2)
}

function drawCircle(ctx, center, radius, style, width) {
  ctx.strokeStyle = style || 'red'
  ctx.lineWidth = width || 1
  ctx.beginPath()
  //console.log(`drawing a circle at ${center[0]},${center[1]} with radius ${radius}`)
  ctx.arc(center[0], center[1], radius, 0, 2*Math.PI)
  ctx.stroke()
}

function drawScoreForCircle(ctx, score) {
  drawCross(ctx, score.circleCenter)
  drawCircle(ctx, score.circleCenter, score.stats.avgRadius, 'green', 2)
  drawCircle(ctx, score.circleCenter, score.stats.minRadius, 'red', 1)
  drawCircle(ctx, score.circleCenter, score.stats.maxRadius, 'red', 1)
}

function drawLine(ctx, start, end, style, width) {
  ctx.beginPath()
  ctx.strokeStyle = style || 'red'
  ctx.lineWidth = width || 1
  ctx.moveTo(start[0], start[1])
  ctx.lineTo(end[0], end[1])
  ctx.stroke();
}

function drawScoreForLine(ctx, score) {
  score.lineOffsets.forEach(lo => {
    drawLine(ctx, lo.point, lo.closest, 'red', 1)
  })
}

function drawGraph(ctx) {
  clearCanvas(ctx)
  ctx.fillStyle = 'black'
  window.state.clickedPlaces.forEach(function(clickedPlace) {
    ctx.fillRect(clickedPlace[0], clickedPlace[1], 2, 2)
  })

  var target = window.state.target
  switch (target.type) {
      case 'none': {
        if (window.state.score) {
          drawScoreForCircle(ctx, window.state.score)
        }
        break;
      }
      case 'line': {
        drawCross(ctx, target.start, 'black', 10)
        drawCross(ctx, target.end, 'black', 10)
        if (window.state.score) {
          drawScoreForLine(ctx, window.state.score)
        }
        break;
      }
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

function calculateStatsForCircle(circleCenter, clickedPlaces) {
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

function calculateScoreForRandomCircle(clickedPlaces) {
  var circleCenter = getCenterOfCircle(clickedPlaces)
  var stats = calculateStatsForCircle(circleCenter, clickedPlaces)
  var score = getScore(circleCenter, clickedPlaces, stats)
  return { circleCenter: circleCenter, stats: stats, score: score }
}

function dotProduct(p1, p2) {
  return p1[0]*p2[0] + p1[1]*p2[1]
}

function closestPointOnLine(lineStart, lineEnd, point) {
  var startToPoint = [point[0] - lineStart[0], point[1] - lineStart[1]]
  var startToEnd = [lineEnd[0] - lineStart[0], lineEnd[1] - lineStart[1]]
  var startToEndMagSquared = dotProduct(startToEnd, startToEnd)
  var stpDotSte = dotProduct(startToPoint, startToEnd)
  var proportionalDistance = stpDotSte / startToEndMagSquared
  if (proportionalDistance < 0) { return lineStart }
  if (proportionalDistance > 1) { return lineEnd }
  return [lineStart[0] + startToEnd[0]*proportionalDistance,
          lineStart[1] + startToEnd[1]*proportionalDistance]
}

function getLineOffsets(target, clickedPlaces) {
  return clickedPlaces.map(p => {
    var closest = closestPointOnLine(target.start, target.end, p)
    return { point: p, closest: closest }
  })
}

function calculateScoreForLine(target, clickedPlaces) {
  var lineOffsets = getLineOffsets(target, clickedPlaces)
  return { lineOffsets: lineOffsets }
}

function calculateScore(clickedPlaces) {
  var target = window.state.target
  switch (target.type) {
    case 'none': return calculateScoreForRandomCircle(clickedPlaces);
    case 'line': return calculateScoreForLine(target, clickedPlaces);
  }
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
  reset()
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
  canvas.width = body.clientWidth;
  canvas.height = body.clientHeight;
  body.appendChild(canvas);

  canvas.addEventListener('mousedown', onCanvasMousedown)
  canvas.addEventListener('mousemove', onCanvasMousemove)
  canvas.addEventListener('mouseup', onCanvasMouseup)

  render()
}

init()

})(window)
