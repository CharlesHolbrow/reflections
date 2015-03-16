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
window.mirrors = [];

var drawHandle = function(x, y){
  var circle = new Path.Circle([x, y], 6);
  circle.fillColor = 'black';
  return circle;
};

var createMirror = function(x, y){
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

  addSegment(x, y);
  addOutHandle(15, 50);
  addSegment(x + 50, y + 140);

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
  mirrors.push(mirror);
  return mirror;
};

var mirror = createMirror(600, 110);
var mirror = createMirror(500, 210);

var createSoundSource = function(x,y, angle, length){
  var start =  new Point(x, y);
  // Group contains
  // - circle handle for moving the position
  // - path objects with .drawReflections method
  var group = new Group;
  window.soundGroup = group;

  var circle = drawHandle(x, y);
  group.addChild(circle);
  circle.onMouseDrag = function(event){
    group.translate({x:event.delta.x, y:event.delta.y});
  };

  // Allow user to orient the angle of the beam
  var angleHandlePosition = new Point({angle: angle + 180, length: 30}) + circle.position;
  var angleHandle = drawHandle(angleHandlePosition.x, angleHandlePosition.y);
  group.addChild(angleHandle);
  angleHandle.onMouseDrag = function(event){
    angleHandle.translate({x:event.delta.x, y:event.delta.y});
  }

  var dispersionAngle = 30;
  var beamCount = 7;

  soundSource = {
    group: group,
    update: function(){
      var beamIndex = 0;
      var deltaAngle = dispersionAngle / (beamCount-1); // compensate for fencepost error
      for (var i = 0; i < group.children.length; i++){
        var path = group.children[i];
        if (typeof path.drawReflections !== 'function') continue;
        var soundVector = circle.position - angleHandle.position;
        var angle = soundVector.angle - (dispersionAngle/2) + (beamIndex * deltaAngle);
        var length = 400;
        if (soundVector.length > 40) length += Math.pow(soundVector.length - 40, 1.2);
        path.drawReflections(angle, length);
        beamIndex++;
      }
    }
  };

  var createSoundPath = function(){
    var beamsGroup = new Group; // all the segments of one reflection
    group.addChild(beamsGroup);


    var beamStartPoint = new Point(circle.position);
    var beamVector = new Point({angle:0, length:1});
    var beamEndPoint = beamStartPoint + beamVector; // does order matter?

    // create 10 hidden beam Path items
    _(_.range(10)).map(function(){
      var beam = new Path({visible:false, segments:[beamStartPoint, beamEndPoint]});
      beamsGroup.addChild(beam);
      return beam;
    });

    beamsGroup.strokeWidth = 1;
    beamsGroup.strokeColor = 'red';

    beamsGroup.drawReflections = function(angle, length){
      var beamStartPoint = new Point(circle.position);
      var beamVector = new Point({angle:angle, length:length});
      var beamEndPoint = beamStartPoint + beamVector; // does order matter?
      var lengthRemaining = length;

      // hide all beams
      _.each(beamsGroup.children, function(beam){
        beam.visible = false;
      });

      // keep track of which curvePoints we are bouncing off
      var reflectionCurveLocations = [];

      // recurse through every reflection in this beam trajectory
      for (var i = 0; i < beamsGroup.children.length; i++) {
        var beam = beamsGroup.children[i];
        beam.visible = true;
        beam.firstSegment.point = beamStartPoint;
        beam.lastSegment.point = beamEndPoint;

        var intersections = _(mirrors).map(function(mirror){
          return mirror.getIntersections(beam);
        });
        intersections = _(intersections).flatten();
        if (!intersections.length){
          break;
        }
        // Get the first intersection
        intersections = _(_(intersections).reject(function(curveLocation){
          // but reject the start and end locations of the current beam
          var vector = curveLocation.point - beam.firstSegment.point;
          var lastCurveLocation = reflectionCurveLocations[reflectionCurveLocations.length -1];
          lastCurve = (lastCurveLocation) ? lastCurveLocation.curve : undefined;
          return (
            curveLocation.point.equals(beamStartPoint) ||
            curveLocation.point.equals(beamEndPoint) ||
            // sometimes we get intersections at the very
            // beginning of a path when that path begins on
            // another path.
            // If a path length is less than one pixel, we must
            // be bouncing off a different mirror
            (vector.length < 1 && lastCurve === curveLocation.curve)
          );
        })).sortBy(function(curveLocation){
          var vector = curveLocation.point - beam.firstSegment.point;
          return vector.length;
        });
        var intersection = intersections[0];
        if (!intersection) break;
        reflectionCurveLocations.push(intersection);

        // now we have this beam's intersection with a mirror
        beamEndPoint = new Point(intersection.point);
        beam.lastSegment.point = beamEndPoint;
        beamVector = beamEndPoint - beamStartPoint;
        lengthRemaining -= beamVector.length;

        // setup for the new loop;
        beamStartPoint = beamEndPoint;

        // Paths and Curves have the .getTangentAt function
        // the absolute angle of the mirror where the sound arrives
        var mirrorTangentPoint = intersection.curve.getTangentAt(intersection.offset);
        var mirrorAngle = mirrorTangentPoint.angle;

        // the absolute angle of the sound when it arrives
        var soundTangentPoint = beam.getTangentAt(intersection.intersection.offset);
        var soundAngle = soundTangentPoint.angle;
        var relativeAngle = soundAngle - mirrorAngle;

        var reflectVector = new Point({length: lengthRemaining, angle: mirrorAngle - relativeAngle});
        beamEndPoint = new Point(intersection.point + reflectVector);
      }
    }; // drawReflections function
    return beamsGroup;
  }; // createSoundPath function

  for (var i = 0; i < beamCount; i++){
    createSoundPath();
  }
  return soundSource;
};


window.soundSource = createSoundSource(570, 170, 0, 600);
soundSource.update();

function onMouseDrag(event) {
  soundSource.update();
}
