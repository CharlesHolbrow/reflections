// Create a sound reflecting line

strokeWidth = 2;
var mirror = new Path();
mirror.add(new Point(100, 100));
mirror.add(new Point(200, 200));
mirror.strokeColor = 'black';
mirror.strokeWidth = strokeWidth;
mirror.smooth();

var soundLength = 400;
var start =  new Point(view.center - [0, 200]);
var end = start + [100, soundLength];

var sound = new Path(start, end);
sound.strokeColor = 'red';
sound.strokeWidth = strokeWidth;

var sound2 = new Path();
sound2.strokeColor = 'red';
sound2.strokeWidth = strokeWidth;

window.bounce = new Path(
  new Point(),
  new Point()
);
bounce.strokeColor = 'blue';

function onResize(event) {
  // Whenever the window is resized, recenter the path:
  //mirror.position = view.center;
}


function onMouseDrag(event) {
  mirror.removeSegment(0);
  mirror.removeSegment(0);
  mirror.add(event.downPoint);
  mirror.add(event.point);
  mirror.smooth();

  sound.removeSegment(1);
  sound.removeSegment(1);
  sound.add(end);

  sound2.removeSegment(0);
  sound2.removeSegment(0);

  var intersection = mirror.getIntersections(sound)[0];
  if (!intersection) return;

  // intersection is a CurveLocation object
  //paperjs.org/reference/curvelocation/

  // Paths and Curves have the .getTangentAt function
  // the absolute angle of the mirror where the sound arrives
  var mirrorTangentPoint = mirror.getTangentAt(intersection.offset);
  var mirrorAngle = mirrorTangentPoint.angle;

  // the absolute angle of the sound when it arrives
  var soundTangentPoint = sound.getTangentAt(intersection.intersection.offset);
  var soundAngle = soundTangentPoint.angle;

  var relativeAngle = soundAngle - mirrorAngle;
  sound.segments[1].point = new Point(intersection.point);

  sound1Length = sound.segments[0].point - sound.segments[1].point;
  sound1Length = sound1Length.length;
  sound2Length = soundLength - sound1Length;

  // draw the bounce
  var reflectVector = new Point({length: sound2Length, angle: mirrorAngle - relativeAngle});
  sound2.add(intersection.point);
  sound2.add(new Point(intersection.point + reflectVector));


}
