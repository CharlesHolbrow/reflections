// Setting an item's position does not set it's position
// relative to the group.
//
// group.position is always average of the groups elements
//
// path handles care about angles - positions xy position are
// always angle relative to the origin. If you use a point for a
// handle, you have to subtract it from the patch segment.
//
// paths have .position.x
// segments have .point
// segments have .point.angle
//
var drawHandle = function(x, y){
  var circle = new Path.Circle([x, y], 6);
  circle.fillColor = 'black';
  return circle;
};

var createMirror = function(){
  var groups = [];
  var segmentCircles = [];
  var outHandleCircles = [];

  var addSegment = function(x, y){
    var circle = drawHandle(x, y);
    segmentCircles.push(circle);

    var group = new Group;
    groups.push(group);
    group.addChild(circle);
    group.position = new Point(x, y);
    group.fillColor = 'black';

    // first segment moves entire path
    var firstGroup = groups[0];
    if (group !== firstGroup)
      firstGroup.addChild(group);

    circle.onMouseDrag = function(event){
      group.translate({x:event.delta.x, y:event.delta.y});
      handleMove()
    };
    return circle;
  };

  var addOutHandle = function(angle, length){
    var index = outHandleCircles.length;
    var circle = drawHandle(0, 0);
    outHandleCircles.push(circle);

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
  addSegment(410, 410);

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

var mirror = createMirror();

var createSoundSource = function(x,y, angle, length){
  var start =  new Point(x, y);
  // Group contains
  // - circle handle for moving the position
  // - path objects with .drawReflections method
  var group = new Group;


  circle = drawHandle(x, y);
  group.addChild(circle);
  circle.onMouseDrag = function(event){
    group.translate({x:event.delta.x, y:event.delta.y});
  };

  soundSource = {
    group: group,
    update: function(){
      for (var i = 0; i < group.children.length; i++){
        var path = group.children[i];
        if (typeof path.drawReflections !== 'function') continue;
        path.drawReflections();
      }
    }
  };

  var createSoundPath = function(angle, length){
    var vector = new Point({angle:angle, length:length});
    var end = vector + start;

    strokeWidth = 1;
    var sound = new Path(start, end);
    group.addChild(sound);
    sound.strokeColor = 'red';
    sound.strokeWidth = strokeWidth;

    sound.drawReflections = function(){
      var start = new Point(circle.position);
      var end = start + vector;
      sound.segments = [sound.firstSegment];
      sound.add(end);

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
      sound2Length = length - sound1Length;

      // draw the bounce
      var reflectVector = new Point({length: sound2Length, angle: mirrorAngle - relativeAngle});
      sound.add(new Point(intersection.point + reflectVector));
    }; // drawReflections function
    return sound;
  }; // createSoundLine function

  for (var i = 0; i < 5; i++){
    createSoundPath(angle + i * 5, length);
  }
  return soundSource;
};


window.soundSource = createSoundSource(300, 20, 0, 800);

function onMouseDrag(event) {
  soundSource.update();
}
