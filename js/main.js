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

var inverseFreqCubed   = [ 1.0, 0.125, 0.037037037037037035, 0.015625, 0.008, 0.004629629629629629, 0.0029154518950437317, 0.001953125, 0.0013717421124828531, 0.001];
var inverseFreqSquared = [ 0.63883, 0.1597075, 0.0709811111111111, 0.039926875, 0.0255532, 0.017745277777777776, 0.013037346938775509, 0.00998171875, 0.00788679012345679, 0.0063883];
var inverseFreq        = [ 0.34142, 0.17071, 0.113806, 0.085355, 0.068284, 0.056903, 0.048774, 0.042677, 0.037935, 0.034142];
var noImag = new Float32Array(10);

var tuningSelector = document.getElementById("tuningselector");
var synthSelector = document.getElementById("synthselector");
synthSelector.value = "oneoverfcubed";

var intervals = justIntervals;
var num_intervals = intervals.length;

var mixer = audio_context.createChannelMerger(num_intervals);

var pan = audio_context.createStereoPanner();
pan.connect(audio_context.destination);
pan.pan.setValueAtTime(0.5, audio_context.currentTime);

mixer.connect(pan);


var interval_oscillators = [];
for (var i = 0; i < intervals.length; i++) {
    var oscillator = audio_context.createOscillator();
    var gain = audio_context.createGain();

    var wave = audio_context.createPeriodicWave(inverseFreqCubed, noImag);
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

/* TODO extend to actually toggle */
function togglePlaying() {
    for (var i = 0; i < interval_oscillators.length; i++) {
        interval_oscillators[i].gain.gain.setValueAtTime(0.0, audio_context.currentTime);
    }
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
        case "pythagorean":
            intervals = pythagoreanIntervals;
            break;
        case "equal":
            intervals = equalIntervals;
            break;
    }
    refresh_nodes();
}

function updateSynth() {
    switch (synthSelector.value) {
        case "nosynth":
            for (var i = 0; i < interval_oscillators.length; i++) {
                var real = new Float32Array(2);
                var imag = new Float32Array(2);

		real[0] = 0;
		imag[0] = 0;
		real[1] = 1;
		imag[1] = 0;
            
                var wave = audio_context.createPeriodicWave(real, imag);
                interval_oscillators[i].oscillator.setPeriodicWave(wave);
            }
	    refresh_nodes();
            break;
        case "oneoverf":
            for (var i = 0; i < interval_oscillators.length; i++) {
                var wave = audio_context.createPeriodicWave(inverseFreq, noImag);
                interval_oscillators[i].oscillator.setPeriodicWave(wave);
            }
	    refresh_nodes();
            break;
        case "oneoverfsquared":
            for (var i = 0; i < interval_oscillators.length; i++) {
                var wave = audio_context.createPeriodicWave(inverseFreqSquared, noImag);
                interval_oscillators[i].oscillator.setPeriodicWave(wave);
            }
	    refresh_nodes();
            break;
        case "oneoverfcubed":
            for (var i = 0; i < interval_oscillators.length; i++) {
                var wave = audio_context.createPeriodicWave(inverseFreqCubed, noImag);
                interval_oscillators[i].oscillator.setPeriodicWave(wave);
            }
	    refresh_nodes();
            break;
    }
    refresh_nodes();
}

var active_fundamentals = [];

$(".fundamental_button").click(function (e) {
    var fundamental = parseInt(e.currentTarget.dataset.fundamental);
    if (fundamental < 0 || fundamental >= num_intervals) {
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
    var freq = base_freq;
    var freq_step = Math.random() * (350 - 10) + 10;

    if (freq - freq_step < slider.min) {
        freq += freq_step;
    } else if (freq + freq_step > slider.max) {
        freq -= freq_step;
    } else {
        freq -= freq_step;
    }

    $({n: base_freq}).animate({n: freq}, {
        duration: 128,
        step: function (now, fx) {
            set_base_frequency(now);
        }
    });
}
