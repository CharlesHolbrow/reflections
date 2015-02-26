// Create a Paper.js Path to draw a line into it:
var path = new Path();
// Give the stroke a color
path.strokeColor = 'black';
var start = new Point(100, 100);
// Move to start and draw a line from there
path.moveTo(start);
path.lineTo(start + [ 300, 50 ]);


function onResize(event) {
	// Whenever the window is resized, recenter the path:
	path.position = view.center;
}

function onMouseDrag(event) {
	path.removeSegment(0);
	path.removeSegment(0);
	path.add(event.downPoint);
	path.add(event.point);
}

window.p = path