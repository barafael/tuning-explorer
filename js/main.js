let baseFreq = 220;

const AudioContextClass = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContextClass({
    latencyHint: "interactive",
    sampleRate: 44100
});

let activeFundamentals = [];

const tuningSelector = document.getElementById("tuningSelector");

const toggleMutedButton = document.getElementById("toggleMutedButton");

let outputFreqLabel = document.getElementById("freqLabel");
const slider = document.getElementById("frequency");
outputFreqLabel.innerHTML = slider.value;

let muted = false;

const zeroPhase = new Float32Array(10);

const spectrum = spectrumDecay((f) => 1.0 / (f * f * f));

const mixer = audioContext.createChannelMerger(intervals.length);

const pan = audioContext.createStereoPanner();
pan.connect(audioContext.destination);
pan.pan.setValueAtTime(0.5, audioContext.currentTime);

mixer.connect(pan);

let intervalOscillators = [];

const justIntervals = [
    {name: "Unison", ratio: 1.0},
    {name: "MinorSecond", ratio: 16.0 / 15.0},
    {name: "MajorSecond", ratio: 9.0 / 8.0},
    {name: "MinorThird", ratio: 6.0 / 5.0},
    {name: "MajorThird", ratio: 5.0 / 4.0},
    {name: "Fourth", ratio: 4.0 / 3.0},
    {name: "AugmentedFourth", ratio: 10.0 / 7.0},
    {name: "DiminishedFifth", ratio: 10.0 / 7.0},
    {name: "Fifth", ratio: 3.0 / 2.0},
    {name: "MinorSixth", ratio: 8.0 / 5.0},
    {name: "Sixth", ratio: 5.0 / 3.0},
    {name: "MinorSeventh", ratio: 16.0 / 9.0},
    {name: "MajorSeventh", ratio: 15.0 / 8.0},
    {name: "Octave", ratio: 2.0}
];

const equalIntervals = [
    {name: "Unison", ratio: 1.0},
    {name: "MinorSecond", ratio: 1.059463},
    {name: "MajorSecond", ratio: 1.122462},
    {name: "MinorThird", ratio: 1.189207},
    {name: "MajorThird", ratio: 1.259921},
    {name: "Fourth", ratio: 1.334840},
    {name: "AugmentedFourth", ratio: 1.414214},
    {name: "DiminishedFifth", ratio: 1.414214},
    {name: "Fifth", ratio: 1.498307},
    {name: "MinorSixth", ratio: 1.587401},
    {name: "Sixth", ratio: 1.681793},
    {name: "MinorSeventh", ratio: 1.781797},
    {name: "MajorSeventh", ratio: 1.887749},
    {name: "Octave", ratio: 2.0}
];

const pythagoreanIntervals = [
    {name: "Unison", ratio: 1.0},
    {name: "MinorSecond", ratio: 256.0 / 243.0},
    {name: "MajorSecond", ratio: 9.0 / 8.0},
    {name: "MinorThird", ratio: 32.0 / 27.0},
    {name: "MajorThird", ratio: 81.0 / 64.0},
    {name: "Fourth", ratio: 4.0 / 3.0},
    {name: "AugmentedFourth", ratio: 729.0 / 512.0},
    {name: "DiminishedFifth", ratio: 1024.0 / 729.0},
    {name: "Fifth", ratio: 3.0 / 2.0},
    {name: "MinorSixth", ratio: 128.0 / 81.0},
    {name: "Sixth", ratio: 27.0 / 16.0},
    {name: "MinorSeventh", ratio: 16.0 / 9.0},
    {name: "MajorSeventh", ratio: 243.0 / 128.0},
    {name: "Octave", ratio: 2.0}
];

let intervals = justIntervals;

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
