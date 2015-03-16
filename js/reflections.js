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

  var dispersionAngle = 40;
  var beamCount = 10;

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

  var createSoundRay = function(){
    var rayGroup = new Group; // all the segments of one reflection
    group.addChild(rayGroup);


    var rayStartPoint = new Point(circle.position);
    var rayVector = new Point({angle:0, length:1});
    var rayEndPoint = rayStartPoint + rayVector; // does order matter?

    // create 10 hidden beam Path items
    _(_.range(10)).map(function(){
      var ray = new Path({visible:false, segments:[rayStartPoint, rayEndPoint]});
      rayGroup.addChild(ray);
      return ray;
    });

    rayGroup.strokeWidth = 1;
    rayGroup.strokeColor = 'red';

    rayGroup.drawReflections = function(angle, length){
      var rayStartPoint = new Point(circle.position);
      var rayVector = new Point({angle:angle, length:length});
      var rayEndPoint = rayStartPoint + rayVector; // does order matter?
      var lengthRemaining = length;

      // hide all beams
      _.each(rayGroup.children, function(ray){
        ray.visible = false;
      });

      // keep track of which curvePoints we are bouncing off
      var reflectionCurveLocations = [];

      // recurse through every reflection in this ray trajectory
      for (var i = 0; i < rayGroup.children.length; i++) {
        var ray = rayGroup.children[i];
        ray.visible = true;
        ray.firstSegment.point = rayStartPoint;
        ray.lastSegment.point = rayEndPoint;

        var intersections = _(mirrors).map(function(mirror){
          return mirror.getIntersections(ray);
        });
        intersections = _(intersections).flatten();
        if (!intersections.length){
          break;
        }
        // Get the first intersection
        intersections = _(_(intersections).reject(function(curveLocation){
          // but reject the start and end locations of the current ray
          var vector = curveLocation.point - ray.firstSegment.point;
          var lastCurveLocation = reflectionCurveLocations[reflectionCurveLocations.length -1];
          lastCurve = (lastCurveLocation) ? lastCurveLocation.curve : undefined;
          return (
            curveLocation.point.equals(rayStartPoint) ||
            curveLocation.point.equals(rayEndPoint) ||
            // sometimes we get intersections at the very
            // beginning of a path when that path begins on
            // another path.
            // If a path length is less than one pixel, we must
            // be bouncing off a different mirror
            (vector.length < 1 && lastCurve === curveLocation.curve)
          );
        })).sortBy(function(curveLocation){
          var vector = curveLocation.point - ray.firstSegment.point;
          return vector.length;
        });
        var intersection = intersections[0];
        if (!intersection) break;
        reflectionCurveLocations.push(intersection);

        // now we have this ray's intersection with a mirror
        rayEndPoint = new Point(intersection.point);
        ray.lastSegment.point = rayEndPoint;
        rayVector = rayEndPoint - rayStartPoint;
        lengthRemaining -= rayVector.length;

        // setup for the new loop;
        rayStartPoint = rayEndPoint;

        // Paths and Curves have the .getTangentAt function
        // the absolute angle of the mirror where the sound arrives
        var mirrorTangentPoint = intersection.curve.getTangentAt(intersection.offset);
        var mirrorAngle = mirrorTangentPoint.angle;

        // the absolute angle of the sound when it arrives
        var soundTangentPoint = ray.getTangentAt(intersection.intersection.offset);
        var soundAngle = soundTangentPoint.angle;
        var relativeAngle = soundAngle - mirrorAngle;

        var reflectVector = new Point({length: lengthRemaining, angle: mirrorAngle - relativeAngle});
        rayEndPoint = new Point(intersection.point + reflectVector);
      }
    }; // drawReflections function
    return rayGroup;
  }; // createSoundRay function

  _.times(beamCount, createSoundRay)
  return soundSource;
};


window.soundSource = createSoundSource(570, 170, 0, 600);
soundSource.update();

function onMouseDrag(event) {
  soundSource.update();
}
