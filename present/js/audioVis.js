'use strict';

// Create an instance
var wavesurfer = Object.create(WaveSurfer);

document.addEventListener('DOMContentLoaded', function () {
    var options = {
        container     : document.querySelector('#waveform'),
        waveColor     : 'violet',
        progressColor : 'purple',
        loaderColor   : 'purple',
        cursorColor   : 'navy',
        hideScrollbar: true,
        interact: false
    };

    // Init
    wavesurfer.init(options);
    // Load audio from URL
    wavesurfer.load('demo.wav');

});

// Play at once when ready
// Won't work on iOS until you touch the page
wavesurfer.on('ready', function () {
    //wavesurfer.play();
});

// Report errors
wavesurfer.on('error', function (err) {
    console.error(err);
});


/* Progress bar */
document.addEventListener('DOMContentLoaded', function () {
    var progressDiv = document.querySelector('#progress-bar');
    var progressBar = progressDiv.querySelector('.progress-bar');

    var showProgress = function (percent) {
        progressDiv.style.display = 'block';
        progressBar.style.width = percent + '%';
    };

    var hideProgress = function () {
        progressDiv.style.display = 'none';
    };

    wavesurfer.on('loading', showProgress);
    wavesurfer.on('ready', hideProgress);
    wavesurfer.on('destroy', hideProgress);
    wavesurfer.on('error', hideProgress);

    var isPlaying = false
    var stop = function(){
        isPlaying = false;
    };
    var start = function(){
        isPlaying = true;
        requestAnimationFrame(animate)
    };

    wavesurfer.on('pause', stop);
    wavesurfer.on('finish', stop);
    wavesurfer.on('play', start);

    var $att = $('#attenuation');

    var animate = window.animate = function(){
        var val = window.audioLevel * -1 / 72 - 1;
        window.renderPolarChart(val);

        window.spreadVal = (window.audioLevel / 72 + 1.01) * 0.8;
        window.renderPolarSpread(0.5, spreadVal);

        if (isPlaying)
            requestAnimationFrame(animate);
    };


    $('.click-to-play').click(function(event){
        wavesurfer.playPause();
        event.preventDefault();
    });

    window.$wave = $('#waveform');
    window.firstParent = $wave.parent();
    window.secondParent = $('#second-parent');

    $()


});
