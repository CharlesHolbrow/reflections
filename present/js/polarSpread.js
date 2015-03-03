// to see how the math actually works 
// https://www.desmos.com/calculator
// https://www.desmos.com/calculator/k1gwqururh





var myRange =  d3.range(0, 366, 6);
var myPolarSpread = {
  attenuation: -0.15,
  width: 0.5, // 0 is no attenuation; 10 is almost 50% of -5 to 
  config: {
  data:
    [
      {
        t:myRange,
        r:myRange.map(function(deg){return 0.5;}),
        color:"none",
        strokeColor:"blue",
        geometry:"LinePlot",
        name:"Charles"
     },
    ],
    layout: {
      title:"",
      orientation:-90,
      angularAxis:{
        ticksSuffix:"",
      },
      radialAxis:{
        range: null, //identical
        orientation: -90, //upolar only
        ticksSuffix: 'db', //upolar only, ticksSuffix, to be exposed
        visible: false, //upolar only
        showline: false, //gridLinesVisible
        tickOrientation: 'vertical', //upolar only, tickOrientation, != tickangle
        gridLinesVisible: false,
      },
      needsEndSpacing:false,
      backgroundColor:"ghostwhite",
      width: 400,
      height: 400,
      showLegend: false
    }
  },
};



$(function(){
  myPolarSpread.axis = micropolar.Axis().config(myPolarSpread.config).render(d3.select('#polar2').append('div'));

  var render = window.renderPolarSpread =function(att, wdth){
    var attenuation = myPolarSpread.attenuation;
    var width = myPolarSpread.width;
    var config = myPolarSpread.config;

    if (typeof att === 'number') attenuation = att;
    else attenuation = parseFloat(document.getElementById('spread-attenuation').value);
    if (typeof wdth === 'number') width = wdth;
    else width = parseFloat(document.getElementById('spread').value);

      config.data[0].r = myRange.map(function(deg){
        deg = (deg + 180) % 360; // rotate by 180 degrees
        var x = deg / 360 * 4 - 2; // -2 to 2;
        return width / (width + Math.pow(x, 4)) * attenuation;
      });
    myPolarSpread.axis.config(config).render();
  };

  render();

  $('#spread-attenuation').on('input', function() {
      render();
  });
  $('#spread').on('input', function() {
      render();
  });

});
