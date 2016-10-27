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
}

function onKeypress(keyEvent) {
  var keyChar = String.fromCharCode(keyEvent.keyCode || keyEvent.charCode).toUpperCase()
  console.log(keyChar, 'pressed')
  switch (keyChar) {
    case 'R': onResetPressed()
  }
}

function drawGraph(ctx) { 

  //ctx.lineWidth = 10;
  //ctx.strokeStyle = 'blue'
  //ctx.fillStyle = 'red'
  //ctx.strokeRect(50,50,200,50)
  //ctx.fillRect(50,50,200,50)

  window.state.clickedPlaces.forEach(function(clickedPlace) {
    ctx.fillStyle = 'black'
    ctx.fillRect(clickedPlace[0], clickedPlace[1], 2, 2)
  })
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
