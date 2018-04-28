var base_freq = 220;

// create web audio api context
var audio_context = new (window.AudioContext || window.webkitAudioContext)();

var justIntervals = [
    { name: "Unison",          ratio  : 1.0},
    { name: "MinorSecond",     ratio  : 16.0 / 15.0},
    { name: "MajorSecond",     ratio  : 9.0  / 8.0},
    { name: "MinorThird",      ratio  : 6.0  / 5.0},
    { name: "MajorThird",      ratio  : 5.0  / 4.0},
    { name: "Fourth",          ratio  : 4.0  / 3.0},
    { name: "AugmentedFourth", ratio  : 10.0 / 7.0},
    { name: "DimishedFifth",   ratio  : 10.0 / 7.0},
    { name: "Fifth",           ratio  : 3.0  / 2.0},
    { name: "MinorSixth",      ratio  : 8.0  / 5.0},
    { name: "Sixth",           ratio  : 5.0  / 3.0},
    { name: "MinorSeventh",    ratio  : 16.0 / 9.0},
    { name: "MajorSeventh",    ratio  : 15.0 / 8.0},
    { name: "Octave",          ratio  : 2.0},
];

var equalIntervals = [
    { name: "Unison",          ratio  : 1.0},
    { name: "MinorSecond",     ratio  : 1.059463},
    { name: "MajorSecond",     ratio  : 1.122462},
    { name: "MinorThird",      ratio  : 1.189207},
    { name: "MajorThird",      ratio  : 1.259921},
    { name: "Fourth",          ratio  : 1.334840},
    { name: "AugmentedFourth", ratio  : 1.414214},
    { name: "DimishedFifth",   ratio  : 1.414214},
    { name: "Fifth",           ratio  : 1.498307},
    { name: "MinorSixth",      ratio  : 1.587401},
    { name: "Sixth",           ratio  : 1.681793},
    { name: "MinorSeventh",    ratio  : 1.781797},
    { name: "MajorSeventh",    ratio  : 1.887749},
    { name: "Octave",          ratio  : 2.0},
];

var pythagoreanIntervals = [
    { name: "Unison",          ratio  : 1.0},
    { name: "MinorSecond",     ratio  : 256.0  / 243.0},
    { name: "MajorSecond",     ratio  : 9.0    / 8.0},
    { name: "MinorThird",      ratio  : 32.0   / 27.0},
    { name: "MajorThird",      ratio  : 81.0   / 64.0},
    { name: "Fourth",          ratio  : 4.0    / 3.0},
    { name: "AugmentedFourth", ratio  : 729.0  / 512.0},
    { name: "DimishedFifth",   ratio  : 1024.0 / 729.0},
    { name: "Fifth",           ratio  : 3.0    / 2.0},
    { name: "MinorSixth",      ratio  : 128.0  / 81.0},
    { name: "Sixth",           ratio  : 27.0   / 16.0},
    { name: "MinorSeventh",    ratio  : 16.0   / 9.0},
    { name: "MajorSeventh",    ratio  : 243.0  / 128.0},
    { name: "Octave",          ratio  : 2.0},
];

var spectrum = spectrum_decay(f => 1.0/(f*f*f));

var noImag = new Float32Array(10);

function spectrum_decay(fn) {
    var spectrum_arr = Array(10).fill(0);
    spectrum_arr.forEach(function(elem, index) {
        spectrum_arr[index] = fn(index + 1);
    });
    var sum = spectrum_arr.reduce((a, b) => a + b, 0);
    spectrum_arr = spectrum_arr.map((elem) => elem/sum);
    return new Float32Array(spectrum_arr);
}

function update_freq_pow(power) {
    console.log("update!");
    var amplitudes = spectrum_decay(f => 1.0/Math.pow(f, power));
    for (var i = 0; i < interval_oscillators.length; i++) {
        var wave = audio_context.createPeriodicWave(amplitudes, noImag);
        interval_oscillators[i].oscillator.setPeriodicWave(wave);
    }
    refresh_nodes();
}

var tuningSelector = document.getElementById("tuningselector");

var intervals = justIntervals;

var mixer = audio_context.createChannelMerger(intervals.length);

var pan = audio_context.createStereoPanner();
pan.connect(audio_context.destination);
pan.pan.setValueAtTime(0.5, audio_context.currentTime);

mixer.connect(pan);

var interval_oscillators = [];
for (var i = 0; i < intervals.length; i++) {
    var oscillator = audio_context.createOscillator();
    var gain = audio_context.createGain();

    var wave = audio_context.createPeriodicWave(spectrum, noImag);
    oscillator.setPeriodicWave(wave);

    oscillator.frequency.setValueAtTime(base_freq * intervals[i].ratio, audio_context.currentTime);
    gain.gain.setValueAtTime(0.0, audio_context.currentTime);

    oscillator.connect(gain);
    gain.connect(mixer);

    interval_oscillators.push(
        {
            key: intervals[i].key,
            oscillator: oscillator,
            gain: gain,
        }
    );
    oscillator.start();
}

function set_base_frequency(freq) {
    base_freq = freq;
    slider.value = freq;
    output.innerHTML = Math.floor(freq);
    refresh_nodes();
}

var muted = false;
function togglePlaying() {
    if (muted) {
        muted = false;
        refresh_nodes();
    } else {
        muted = true;
        for (var i = 0; i < interval_oscillators.length; i++) {
            interval_oscillators[i].gain.gain.setValueAtTime(0.0, audio_context.currentTime);
        }
    }
    var text = toggleMutedButton.firstChild;
    text.data = text.data == "Muted" ? "Playing" : "Muted";
}

function refresh_nodes() {
    var division = 0.9 / active_fundamentals.length;
    for (var i = 0; i < interval_oscillators.length; i++) {
        if (active_fundamentals.includes(i)) {
            interval_oscillators[i].oscillator.frequency.setValueAtTime(base_freq * intervals[i].ratio, audio_context.currentTime);
            interval_oscillators[i].gain.gain
                .setValueAtTime(division, audio_context.currentTime);
        } else {
            interval_oscillators[i].gain.gain
                .setValueAtTime(0.0, audio_context.currentTime);
        }
    }
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
    refresh_nodes();
}

var active_fundamentals = [];

$(".tonebutton").click(function (e) {
    var fundamental = parseInt(e.currentTarget.dataset.tonebutton);
    if (fundamental < 0 || fundamental >= intervals.length) {
        console.log("Unhandled fundamental index: " + fundamental);
        return;
    }

    if (active_fundamentals.includes(fundamental)) {
        $(this).css("opacity", 0.5);
        active_fundamentals.splice(active_fundamentals.indexOf(fundamental), 1);
    } else {
        $(this).css("opacity", 1.0);
        active_fundamentals.push(fundamental);
    }
    refresh_nodes();
});

var toggleMutedButton = document.getElementById("toggleMutedButton");

var slider = document.getElementById("frequency");
var output = document.getElementById("freqLabel");
output.innerHTML = slider.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
    output.innerHTML = this.value;
    set_base_frequency(this.value);
    refresh_nodes();
};

var slide_freq = function (freq) {
    set_base_frequency(freq);
};

function random_base_freq() {
    var new_freq = Math.random() * (slider.max - slider.min) + slider.min;

    $({n: base_freq}).animate({n: new_freq}, {
        duration: 128,
        step: function (now, fx) {
            set_base_frequency(now);
        }
    });
}
