window.reload = function()
{
  if (window.cleanup_previous) {
    window.cleanup_previous()
  }

  //console.log('reloading js')
  loadJs('index.js')
  var raf_id = window.requestAnimationFrame(function raf_callback() { window.render() })

  window.cleanup_previous = function() {
    window.cancelAnimationFrame(raf_id)
  }
}

if (!window.has_reload) {
  // this code should only be called once per page load

  window.has_reload = true
  // I think we need an extra layer of indirection here to make sure we pick up new values of window.reload - should check
  window.setInterval(function reload_callback() { window.reload() }, 250)
  window.state = {
    clicked_places: [],
    canvas: null,
    dragging: false,
  }
}

function drawGraph(ctx) { 

  //ctx.lineWidth = 10;
  //ctx.strokeStyle = 'blue'
  //ctx.fillStyle = 'red'
  //ctx.strokeRect(50,50,200,50)
  //ctx.fillRect(50,50,200,50)

  window.state.clicked_places.forEach(function(clicked_place) {
    ctx.fillRect(clicked_place[0], clicked_place[1], 2, 2)
  })
}

function on_click(x, y) {
  window.state.clicked_places.push([x, y])
}

function on_canvas_click(clickEvent) {
  console.log(clickEvent)
  var canvas = window.state.canvas
  var x = clickEvent.pageX - canvas.offsetLeft
  var y = clickEvent.pageY - canvas.offsetTop
  var mx = Math.round(x * canvas.width / canvas.offsetWidth)
  var my = Math.round(y * canvas.height / canvas.offsetHeight)
  console.log(`registered click at ${x},${y} (${mx},${my})`)
  on_click(mx, my)
}

window.render = function render() {

  var body = document.getElementsByTagName("body")[0];
  while (body.hasChildNodes()) {
      body.removeChild(body.lastChild);
  }

  var canvas = window.state.canvas = document.createElement("canvas");
  canvas.width = 650;
  canvas.height = 530;
  var ctx = canvas.getContext("2d");
  drawGraph(ctx);
  body.appendChild(canvas);

  canvas.addEventListener('click', on_canvas_click)

}

