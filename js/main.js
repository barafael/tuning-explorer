let baseFreq = 220;

const justIntervals = [
    {ratio: 1.0},
    {ratio: 16.0  / 15.0},
    {ratio: 9.0   / 8.0},
    {ratio: 6.0   / 5.0},
    {ratio: 5.0   / 4.0},
    {ratio: 4.0   / 3.0},
    {ratio: 10.0  / 7.0},
    {ratio: 10.0  / 7.0},
    {ratio: 3.0   / 2.0},
    {ratio: 8.0   / 5.0},
    {ratio: 5.0   / 3.0},
    {ratio: 16.0  / 9.0},
    {ratio: 15.0  / 8.0},
    {ratio: 2.0},
    {ratio: (16.0 * 2)  / 15.0},
    {ratio: (9.0 * 2)   / 8.0},
    {ratio: (6.0 * 2)   / 5.0},
    {ratio: (5.0 * 2)   / 4.0},
    {ratio: (4.0 * 2)   / 3.0},
    {ratio: (10.0 * 2)  / 7.0},
    {ratio: (10.0 * 2)  / 7.0},
    {ratio: (3.0 * 2)   / 2.0},
    {ratio: (8.0 * 2)   / 5.0},
    {ratio: (5.0 * 2)   / 3.0},
    {ratio: (16.0 * 2)  / 9.0},
    {ratio: (15.0 * 2)  / 8.0},
];

const equalIntervals = [
    {ratio: 1.0},
    {ratio: 1.059463},
    {ratio: 1.122462},
    {ratio: 1.189207},
    {ratio: 1.259921},
    {ratio: 1.334840},
    {ratio: 1.414214},
    {ratio: 1.414214},
    {ratio: 1.498307},
    {ratio: 1.587401},
    {ratio: 1.681793},
    {ratio: 1.781797},
    {ratio: 1.887749},
    {ratio: 2.0},
    {ratio: 1.059463 * 2},
    {ratio: 1.122462 * 2},
    {ratio: 1.189207 * 2},
    {ratio: 1.259921 * 2},
    {ratio: 1.334840 * 2},
    {ratio: 1.414214 * 2},
    {ratio: 1.414214 * 2},
    {ratio: 1.498307 * 2},
    {ratio: 1.587401 * 2},
    {ratio: 1.681793 * 2},
    {ratio: 1.781797 * 2},
    {ratio: 1.887749 * 2},
];

const pythagoreanIntervals = [
    {ratio: 1.0},
    {ratio: 256.0  / 243.0},
    {ratio: 9.0    / 8.0},
    {ratio: 32.0   / 27.0},
    {ratio: 81.0   / 64.0},
    {ratio: 4.0    / 3.0},
    {ratio: 729.0  / 512.0},
    {ratio: 1024.0 / 729.0},
    {ratio: 3.0    / 2.0},
    {ratio: 128.0  / 81.0},
    {ratio: 27.0   / 16.0},
    {ratio: 16.0   / 9.0},
    {ratio: 243.0  / 128.0},
    {ratio: 2.0},
    {ratio: (256.0  * 2) / 243.0},
    {ratio: (9.0    * 2) / 8.0},
    {ratio: (32.0   * 2) / 27.0},
    {ratio: (81.0   * 2) / 64.0},
    {ratio: (4.0    * 2) / 3.0},
    {ratio: (729.0  * 2) / 512.0},
    {ratio: (1024.0 * 2) / 729.0},
    {ratio: (3.0    * 2) / 2.0},
    {ratio: (128.0  * 2) / 81.0},
    {ratio: (27.0   * 2) / 16.0},
    {ratio: (16.0   * 2) / 9.0},
    {ratio: (243.0  * 2) / 128.0},
];

let intervals = justIntervals;

let intervalOscillators = [];

const zeroPhase = new Float32Array(10);

const spectrum = spectrumDecay((f) => 1.0 / (f * f * f * f * f * f));

let audioContext = undefined;
let analyser = undefined;

window.onload = function() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass({
        latencyHint: "interactive",
        sampleRate: 11025
    });

    analyser = audioContext.createAnalyser();

    const mixer = audioContext.createChannelMerger(intervals.length);

    const pan = audioContext.createStereoPanner();
    pan.connect(audioContext.destination);
    pan.pan.setValueAtTime(0.5, audioContext.currentTime);

    mixer.connect(pan);

    for (let i = 0; i < intervals.length; i++) {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        const wave = audioContext.createPeriodicWave(spectrum, zeroPhase);
        oscillator.setPeriodicWave(wave);

        oscillator.frequency.setValueAtTime(baseFreq * intervals[i].ratio, audioContext.currentTime);
        gain.gain.setValueAtTime(0.0, audioContext.currentTime);

        oscillator.connect(gain);
        gain.connect(mixer);

        intervalOscillators.push(
            {
                key: intervals[i].key,
                oscillator: oscillator,
                gain: gain,
            }
        );
        oscillator.start();
        mixer.connect(analyser);
    }
    audioContext.resume();
}

let activeFundamentals = [];

const tuningSelector = document.getElementById("tuningSelector");

const toggleMutedButton = document.getElementById("toggleMutedButton");

let outputFreqLabel = document.getElementById("freqLabel");
const slider = document.getElementById("frequency");
outputFreqLabel.innerHTML = slider.value;

let muted = false;

let canvasCtx = document.getElementById("wave").getContext("2d");

let canvas2Ctx = document.getElementById("spectrum").getContext("2d");

function spectrumDecay(fn) {
    "use strict";
    let amplitudes = new Array(10).fill(0);
    amplitudes.forEach(function (elem, index) {
        amplitudes[index] = fn(index + 1);
    });
    const sum = amplitudes.reduce((a, b) => a + b, 0);
    amplitudes = amplitudes.map((elem) => elem / sum);
    return new Float32Array(amplitudes);
}

function refreshNodes() {
    const division = 0.9 / activeFundamentals.length;
    for (let i = 0; i < intervalOscillators.length; i++) {
        if (activeFundamentals.includes(i)) {
            intervalOscillators[i].oscillator.frequency.setValueAtTime(baseFreq * intervals[i].ratio, audioContext.currentTime);
            intervalOscillators[i].gain.gain
                .setValueAtTime(division, audioContext.currentTime);
        } else {
            intervalOscillators[i].gain.gain
                .setValueAtTime(0.0, audioContext.currentTime);
        }
    }
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);
    canvasCtx.clearRect(0, 0, 200, 100);
    var draw = function() {
        drawVisual = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, 200, 100);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        canvasCtx.beginPath();
        var sliceWidth = 200 * 1.0 / bufferLength;
        var x = 0;

        for(var i = 0; i < bufferLength; i++) {
            var v = dataArray[i] / 128.0;
            var y = v * 100/2;

            if(i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height/2);
        canvasCtx.stroke();
      };

      draw();

    const WIDTH = 200;
    const HEIGHT = 100;
      var bufferLengthAlt = analyser.frequencyBinCount;
      console.log(bufferLengthAlt);
      var dataArrayAlt = new Uint8Array(bufferLengthAlt);

      canvas2Ctx.clearRect(0, 0, WIDTH, HEIGHT);

      var drawAlt = function() {
        drawVisual = requestAnimationFrame(drawAlt);

        analyser.getByteFrequencyData(dataArrayAlt);

        canvas2Ctx.fillStyle = 'rgb(0, 0, 0)';
        canvas2Ctx.fillRect(0, 0, WIDTH, HEIGHT);

        var barWidth = (WIDTH / bufferLengthAlt) * 2.5;
        var barHeight;
        var x = 0;

        for(var i = 0; i < bufferLengthAlt; i++) {
          barHeight = dataArrayAlt[i];

          canvas2Ctx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
          canvas2Ctx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);

          x += barWidth + 1;
        }
      };

      drawAlt();
}

function updateFreqPow(power) {
    "use strict";
    const amplitudes = spectrumDecay((f) => 1.0 / Math.pow(f, power));
    for (let i = 0; i < intervalOscillators.length; i++) {
        const wave = audioContext.createPeriodicWave(amplitudes, zeroPhase);
        intervalOscillators[i].oscillator.setPeriodicWave(wave);
    }
    refreshNodes();
}


function setBaseFrequency(freq) {
    "use strict";
    baseFreq = freq;
    slider.value = freq;
    outputFreqLabel.innerHTML = Math.floor(freq);
    refreshNodes();
}

function togglePlaying() {
    "use strict";
    if (muted) {
        muted = false;
        refreshNodes();
    } else {
        muted = true;
        for (let i = 0; i < intervalOscillators.length; i++) {
            intervalOscillators[i].gain.gain.setValueAtTime(0.0, audioContext.currentTime);
        }
    }
    const text = toggleMutedButton.firstChild;
    text.data = text.data === "Muted" ? "Playing" : "Muted";
}

function updateTuning() {
    switch (tuningSelector.value) {
        case "just":
            intervals = justIntervals;
            break;
        case "equal":
            intervals = equalIntervals;
            break;
        case "pythagorean":
            intervals = pythagoreanIntervals;
            break;
    }
    refreshNodes();
}

$(".tonebutton").click(function (e) {
    const fundamental = parseInt(e.currentTarget.dataset.tonebutton);
    if (fundamental < 0 || fundamental >= intervals.length) {
        console.log("Unhandled fundamental index: " + fundamental);
        return;
    }

    if (activeFundamentals.includes(fundamental)) {
        $(this).css("opacity", 0.5);
        activeFundamentals.splice(activeFundamentals.indexOf(fundamental), 1);
    } else {
        $(this).css("opacity", 1.0);
        activeFundamentals.push(fundamental);
    }
    audioContext.resume();
    refreshNodes();
});

slider.oninput = function () {
    "use strict";
    outputFreqLabel.innerHTML = this.value;
    setBaseFrequency(this.value);
    refreshNodes();
};

let slideFreq = function (freq) {
    "use strict";
    setBaseFrequency(freq);
};

function randomBaseFreq() {
    "use strict";
    const newFreq = Math.random() * (slider.max - slider.min) + slider.min;

    $({n: baseFreq}).animate({n: newFreq}, {
        duration: 128,
        step: function (now) {
            setBaseFrequency(now);
        }
    });
}
