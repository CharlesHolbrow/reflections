// Setting an item's position does not set it's position
// relative to the group.
//
// group.position is always average of the groups elements
//
// path handles care about angles - positions xy position are
// always angle relative to the origin. If you use a point for a
// handle, you have to subtract it from the patch segment.

var createMirror = function(){
  var groups = [];
  var segmentCircles = [];
  var outHandleCircles = [];

  var addSegment = function(x, y){
    var circle = new Path.Circle([0, 0], 6);
    circle.fillColor = 'black';
    circle.strokeColor = 'blue';
    segmentCircles.push(circle);

    var group = new Group;
    groups.push(group);
    group.addChild(circle);
    group.position = new Point(x, y);
    group.fillColor = 'black';
    circle.strokeColor = 'red';


    circle.onMouseDrag = function(event){
      group.translate({x:event.delta.x, y:event.delta.y});
      handleMove()
    };
    return circle;
  };

  var addOutHandle = function(angle, length){
    var index = outHandleCircles.length;
    var circle = new Path.Circle(new Point, 6);
    outHandleCircles.push(circle);
    circle.fillColor = 'black';
    circle.strokeColor = 'blue';

    var group = groups[index];
    group.addChild(circle);

    circle.onMouseDrag = function(event){
      circle.translate(event.delta);
      handleMove();
    };

    circle.position = segmentCircles[index].position + new Point({angle:angle, length:length});
    return circle;
  };

  addSegment(10, 10);
  addOutHandle(90, 100);
  addSegment(110, 110);

  var mirror = new Path([
    [segmentCircles[0].position, null, outHandleCircles[0].position - segmentCircles[0].position],
    [segmentCircles[1].position, null, null]
  ]);

  mirror.fullySelected = true;
  mirror.strokeColor = 'black';
  mirror.strokeWidth = 2;

  // move the mirror to match the position of the segmentCircles
  var handleMove = function(){
    mirror.segments[0].point = segmentCircles[0].position;
    mirror.segments[0].handleOut = outHandleCircles[0].position - segmentCircles[0].position;
    mirror.segments[1].point = segmentCircles[1].position;
  }

  return mirror;
};

var mirror = createMirror()

var soundLength = 500;
var start =  new Point(view.center.x, 50);
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
