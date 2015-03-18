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
window.sounds = [];

var drawHandle = function(x, y){
  var circle = new Path.Circle([x, y], 6);
  circle.fillColor = 'black';
  return circle;
};

// The first argument can be a path object OR an
// array or string exported via mirror.exportJSON
window.createMirror = function(x, y){
  var groups = [];
  var segmentCircles = [];
  var outHandleCircles = [];
  var outHandleTangentLines = [];

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
  }; // addSegment

  var addOutHandle = function(angle, length){
    var index = outHandleCircles.length;
    var tangentHandle = drawHandle(0, 0);
    outHandleCircles.push(tangentHandle);

    var group = groups[index];
    group.addChild(tangentHandle);

    tangentHandle.onMouseDrag = function(event){
      tangentHandle.translate(event.delta);
      handleMove();
    };

    tangentHandle.position = segmentCircles[index].position + new Point({angle:angle, length:length});

    var tangentLine = new Path(segmentCircles[index].position, tangentHandle.position)
    tangentLine.sendToBack();
    tangentLine.strokeColor = 'blue';
    tangentLine.strokeWidth = 1;
    outHandleTangentLines.push(tangentLine);
    return tangentHandle;
  }; // addOutHandle

  // Allow us to create a mirror by
  // - passing in a path object
  // - passing in an x, y coordinates
  if (typeof x === 'string')
    x = JSON.parse(x);
  if (_.isArray(x)) // Paper.Path.exportJSON() exports an array
    x = new Path().importJSON(x);
  if (typeof x === 'object' && x.className === 'Path'){
    var mirror = x;
    _.each(mirror.segments, function(segment, i){
      addSegment(segment.point.x, segment.point.y);
      if (segment.handleOut.length){

        addOutHandle(segment.handleOut.angle, segment.handleOut.length);
      } else {
        outHandleCircles.push(null);
      }
    });
  } else if (typeof x === 'number') {
    addSegment(x, y);
    addOutHandle(15, 50);
    addSegment(x + 50, y + 140);

    var mirror = new Path([
      [segmentCircles[0].position, null, outHandleCircles[0].position - segmentCircles[0].position],
      [segmentCircles[1].position, null, null]
    ]);
    mirror.strokeColor = 'black';
    mirror.strokeWidth = 2;
  } else { 
    throw new Error('');
  }

  // move the mirror to match the position of the segmentCircles
  var handleMove = function(){
    mirror.segments[0].point = segmentCircles[0].position;
    mirror.segments[0].handleOut = outHandleCircles[0].position - segmentCircles[0].position;
    mirror.segments[1].point = segmentCircles[1].position;
    outHandleTangentLines[0].firstSegment.point = segmentCircles[0].position;
    outHandleTangentLines[0].lastSegment.point = outHandleCircles[0].position;
  }

  mirrors.push(mirror);
  mirror.sendToBack();

  return mirror;
};

window.createSoundSource = function(x,y, angle, length){
  // Group contains
  // - circle handle for moving the position
  // - path objects with .drawReflections method
  // - line from emitter to handle
  var group = new Group;

  if (typeof x === 'string'){
    var line = new Path().importJSON(x);
  } else {
    var soundPoint = new Point(x, y);
    var handlePoint = soundPoint + new Point({angle: angle + 180, length:length});
    var line = new Path(soundPoint, handlePoint);
    line.strokeWidth = 1;
    line.strokeColor = 'blue';
  }
  group.addChild(line);
  line.sendToBack();

  // Create a handle that moved the entire object
  var circle = drawHandle(line.firstSegment.point.x, line.firstSegment.point.y);
  group.addChild(circle);
  circle.onMouseDrag = function(event){
    group.translate({x:event.delta.x, y:event.delta.y});
    //  we don't need handleMove(), because line is child of group
  };

  // create a handle for controlling the angle and length
  var angleHandle = drawHandle(line.lastSegment.point.x, line.lastSegment.point.y)
  group.addChild(angleHandle);
  angleHandle.onMouseDrag = function(event){
    angleHandle.translate({x:event.delta.x, y:event.delta.y});
    line.lastSegment.point = angleHandle.position;
  };

  var dispersionAngle = 30;
  var beamCount = 8;

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
        if (soundVector.length > 32) length += Math.pow(soundVector.length - 32, 1.25);
        path.drawReflections(angle, length);
        beamIndex++;
      }
    },
    exportJSON: function(options){
      return line.exportJSON(options);
    }
  };

  var createSoundRay = function(){
    var rayGroup = new Group; // all the segments of one reflection
    group.addChild(rayGroup);
    rayGroup.sendToBack();

    var rayStartPoint = new Point(circle.position);
    var rayVector = new Point({angle:0, length:1});
    var rayEndPoint = rayStartPoint + rayVector; // does order matter?

    // create 10 hidden beam Path items
    _(_.range(10)).map(function(){
      var ray = new Path({visible:false, segments:[rayStartPoint, rayEndPoint]});
      rayGroup.addChild(ray);
      ray.sendToBack();
      return ray;
    });

    rayGroup.strokeWidth = 1;
    rayGroup.strokeColor = 'red';

    rayGroup.drawReflections = function(angle, length){
      var rayStartPoint = new Point(circle.position);
      var rayVector = new Point({angle:angle, length:length});
      var rayEndPoint = rayStartPoint + rayVector;
      var lengthRemaining = length;

      // hide all beams
      _.each(rayGroup.children, function(ray){
        ray.visible = false;
      });

      // keep track of which curvePoints we are bouncing off
      var reflectionCurveLocations = [];

      // recurse through every ray's reflections
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
  soundSource.update();
  sounds.push(soundSource);
  return soundSource;
};

createMirror(600, 110);
createSoundSource(570, 170, 0, 30);

function onMouseDrag(event) {
  _(sounds).each(function(sound){sound.update();});
}
