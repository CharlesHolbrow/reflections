// Create a Paper.js Path to draw a line into it:
var mirror = new Path();
// Give the stroke a color
mirror.strokeColor = 'black';
var start = new Point(100, 100);
// Move to start and draw a line from there
mirror.moveTo(start);
mirror.lineTo(start + [ 300, 50 ]);

var sound = new Path(
  new Point(view.center - [0, 200]),
  new Point(view.center + [0, 200])
);
sound.strokeColor = 'red';

function onResize(event) {
  // Whenever the window is resized, recenter the path:
  //mirror.position = view.center;
}

var intersectionDot = new Path.Circle({
  radius:3,
  fillColor: 'blue',
  visible: false
});

function onMouseDrag(event) {
  mirror.removeSegment(0);
  mirror.removeSegment(0);
  mirror.add(event.downPoint);
  mirror.add(event.point);

  intersectionDot.visible = false;
  var intersection = mirror.getIntersections(sound)[0];
  if (!intersection) return;

  // intersection is a CurveLocation object
  //paperjs.org/reference/curvelocation/

  intersectionDot.visible = true;
  intersectionDot.position = intersection.point;

  // Paths and Curves have the getTangentAt function
  var mirrorTangentPoint = mirror.getTangentAt(intersection.offset);
  var mirrorAngle = mirrorTangentPoint.angle;

  // the intersection at
  var soundTangentPoint = sound.getTangentAt(intersection.intersection.offset);
  var soundAngle = soundTangentPoint.angle;

  console.log(mirrorAngle, soundAngle);

}
