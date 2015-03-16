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
    var beamsGroup = new Group; // all the segments of one reflection
    group.addChild(beamsGroup);


    var beamStartPoint = new Point(circle.position);
    var beamVector = new Point({angle:angle, length:length});
    var beamEndPoint = beamStartPoint + beamVector; // does order matter?

    // create 10 hidden beam Path items
    _(_.range(10)).map(function(){
      var beam = new Path({visible:false, segments:[beamStartPoint, beamEndPoint]});
      beamsGroup.addChild(beam);
      return beam;
    });

    beamsGroup.strokeWidth = 1;
    beamsGroup.strokeColor = 'red';

    beamsGroup.drawReflections = function(){
      var beamStartPoint = new Point(circle.position);
      var beamVector = new Point({angle:angle, length:length});
      var beamEndPoint = beamStartPoint + beamVector; // does order matter?
      var lengthRemaining = length;

      // hide all beams
      _.each(beamsGroup.children, function(beam){
        beam.visible = false;
      });

      for (var i = 0; i < beamsGroup.children.length; i++) {
        var beam = beamsGroup.children[i];
        beam.segments = [beamStartPoint, beamEndPoint];
        var intersections = _(mirrors).map(function(mirror){
          return mirror.getIntersections(beam);
        });
        intersections = _(intersections).flatten();
        if (!intersections.length){
          beam.visible = true;
          lengthRemaining -= length;
          break;
        }

        console.log(intersections);
      };

      // if there are no mirrors, we are done
      // if (!mirrors.length) return;

      for (var k = 0; k < 0; k ++) {

        // Add a point to automatically create a segment
        sound.add(beamEndPoint);

        // find all intersections after
        var intersections = [];
        for (var i = 0; i < mirrors.length; i++)
          intersections.push(mirrors[i].getIntersections(sound));
        intersections = _.flatten(intersections);

        // if we found no intersections, we are done
        if (!intersections.length) return;

        intersections = _(intersections).sortBy(function(curveLocation){
          var soundVector = curveLocation.point - sound.firstSegment.point;
          return soundVector.length;
        })

        var intersection = intersections[0];

        // intersection is a CurveLocation object
        //paperjs.org/reference/curvelocation/

        // Paths and Curves have the .getTangentAt function
        // the absolute angle of the mirror where the sound arrives
        var mirrorTangentPoint = intersection.curve.getTangentAt(intersection.offset);
        var mirrorAngle = mirrorTangentPoint.angle;

        // the absolute angle of the sound when it arrives
        var soundTangentPoint = sound.getTangentAt(intersection.intersection.offset);
        var soundAngle = soundTangentPoint.angle;

        var relativeAngle = soundAngle - mirrorAngle;
        sound.segments[1].point = new Point(intersection.point);

        var sound1Length = sound.segments[0].point - sound.segments[1].point;
        sound1Length = sound1Length.length;
        var sound2Length = length - sound1Length;

        // draw the bounce
        var reflectVector = new Point({length: sound2Length, angle: mirrorAngle - relativeAngle});
        sound.add(new Point(intersection.point + reflectVector));
      } 
    }; // drawReflections function
    return beamsGroup;
  }; // createSoundLine function

  for (var i = 0; i < 2; i++){
    createSoundPath(angle + i * 4, length);
  }
  return soundSource;
};


window.soundSource = createSoundSource(570, 170, 0, 600);
soundSource.update();

function onMouseDrag(event) {
  soundSource.update();
}
