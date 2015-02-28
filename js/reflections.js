var createMirror = function(){
  var circles = [];

  var makeCircle = function(x, y){
    var refPoint = new Path.Circle({
      x:x, y:y,
      fillColor: 'black',
      radius:4,
      strokeColor:'blue'
    });
    circles.push(refPoint);

    refPoint.onMouseDrag = function(event){
      refPoint.position = event.point;
      handleMove()
    };
    return refPoint
  }

  makeCircle(10, 10);
  makeCircle(110, 110);

  var mirror = new Path(
    circles[0].position,
    circles[1].position
  );

  mirror.strokeColor = 'black';
  mirror.strokeWidth = 2;
  mirror.firstSegment.handleOut = circles[1].position

  // move the mirror to match the position of the circles
  var handleMove = function(){
    mirror.segments[0].point = circles[0].position;
    mirror.segments[0].handleOut = new Point({angle: 25, length:3})
    mirror.segments[1].point = circles[1].position;
  }

  return mirror;
};

var mirror = createMirror()

var soundLength = 400;
var start =  new Point(view.center - [0, 200]);
var end = start + [100, soundLength];

strokeWidth = 1;
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
