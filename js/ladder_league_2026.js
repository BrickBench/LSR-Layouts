import {
    connectToSocket,
    getStreamById, getEventTimerValue,
    getEventById, getEventForHost, toStringTime,
    getEventRunners, getOrderedStreamRunners,
    getUpcomingEvents, getRunnersByTime,
    getParticipantByName,
    getRunnerScore, compareTime,
    setInnerHtml
} from "./automarathon.js";

const odds_endpoint = "https://ladderleague.run/stats/calculate"
const this_host = "main";
const live_row_count = 3;

var user_meta = new Map();
user_meta.set("Zac", { seed: 1, pb: "2:16:33", icon: "Zac-Emperor.png" })
user_meta.set("Dragon76", { seed: 2, pb: "2:17:02", icon: "Dragon-Maul.png" })
user_meta.set("Jared", { seed: 3, pb: "2:17:24", icon: "Jared-Obiwan.png" })
user_meta.set("Eroadhouse", { seed: 4, pb: "2:17:31", icon: "Eroadhouse-LukeHoth.png" })
user_meta.set("Anorak", { seed: 5, pb: "2:18:03", icon: "Anorak.png" })
user_meta.set("Bricko", { seed: 6, pb: "2:17:42", icon: "Bricko-Boba.png" })
user_meta.set("Scynor", { seed: 7, pb: "2:18:19", icon: "Scynor-Yoda.png" })
user_meta.set("WiiSuper", { seed: 8, pb: "2:19:45", icon: "WiiSuper-ImperialGuard.png" })
user_meta.set("Wazzip", { seed: 9, pb: "2:21:52", icon: "Wazzip-IG88.png" })
user_meta.set("FlamingLazer", { seed: 10, pb: "2:19:26", icon: "lazericon.png" })
user_meta.set("Dimei", { seed: 11, pb: "2:22:05", icon: "dimeiicon.png" })
user_meta.set("ejpman", { seed: 12, pb: "2:22:16", icon: "ejpmanicon.png" })
user_meta.set("Colten", { seed: 13, pb: "2:19:58", icon: "Colten-LukeBespin.png" })
user_meta.set("Kwazrr", { seed: 14, pb: "2:23:00", icon: "Kwazrr-Gamorrean.png" })
user_meta.set("Phantom", { seed: 15, pb: "2:23:24", icon: "Phantom-PitDroid.png" })
user_meta.set("Charzight", { seed: 16, pb: "2:23:59", icon: "Jango.png" })
user_meta.set("Coolisen", { seed: 17, pb: "2:25:50", icon: "Indy.png" })
user_meta.set("MelloVro", { seed: 18, pb: "2:26:15", icon: "Kit_Fisto.png" })
user_meta.set("Gamer_Olive", { seed: 19, pb: "2:28:06", icon: "Leia_Hoth.png" })
user_meta.set("Thenzota", { seed: 20, pb: "2:28:26", icon: "Bespin_Guard.png" })
user_meta.set("Wytew", { seed: 21, pb: "2:29:20", icon: "Luminara.png" })
user_meta.set("ChessWiz", { seed: 22, pb: "2:30:12", icon: "Tarkin.png" })
user_meta.set("Nolan", { seed: 23, pb: "2:35:56", icon: "Vader.png" })
user_meta.set("AppleMan", { seed: 24, pb: "2:37:07", icon: "Anakin_boy.png" })
user_meta.set("CaptainPaxo", { seed: 25, pb: "2:37:27", icon: "Han_Carbonite.png" })
user_meta.set("Doubtt", { seed: 26, pb: "2:44:07", icon: "Anakin_Episode3.png" })
user_meta.set("Chroma_Q", { seed: 27, pb: "2:46:27", icon: "Han_Hoth.png" })
user_meta.set("Staunch", { seed: 28, pb: "2:48:42", icon: "Panaka.png" })
user_meta.set("TBA", {seed: 99, pb: "2:49:23", icon: "Tarkin.png"});

var state = null;
var last_event = null;
var commentator_slots = {}

var last_real_bpt = {}

const PLAYOFF_RUNG_LABELS = [
    "Advancing",
    "Eliminated",
]

const PLAYOFF_RUNG_COLORS = [
    "Advancing",
    "Eliminated",
]

const TOP_RUNG_LABELS = [
    " - Qualified",
    "",
    " - Demoted"
]

const TOP_RUNG_COLORS = [
    "ll-gold",
    "ll-green",
    "ll-red"
]

const LAST_WEEK_RUNG_LABELS = [
    " - Qualified",
    " - Wildcard",
    " - Wildcard"
]

const LAST_WEEK_RUNG_COLORS = [
    "ll-gold",
    "ll-green",
    "ll-green"
]

const MIDDLE_RUNG_LABELS = [
    " - Promoted",
    "",
    " - Demoted"
]

const MIDDLE_RUNG_COLORS = [
    "ll-green",
    "",
    "ll-red"
]

const BOTTOM_RUNG_LABELS = [
    " - Promoted",
    " - Eliminated",
    " - Eliminated"
]

const BOTTOM_RUNG_COLORS = [
    "ll-green",
    "ll-red",
    "ll-red"
]

const WILDCARD_LABELS = [
    " - Qualified",
    " - Eliminated",
    " - Eliminated"
]

const WILDCARD_COLORS = [
    "ll-gold",
    "ll-red",
    "ll-red"
]

const QUALS_DATA = new Map();
QUALS_DATA.set("QUARTERFINAL 1", { id: "q1", top_seeds: [1], bottom_seeds: [8] });
QUALS_DATA.set("QUARTERFINAL 2", { id: "q2", top_seeds: [4], bottom_seeds: [5] });
QUALS_DATA.set("QUARTERFINAL 3", { id: "q3", top_seeds: [3], bottom_seeds: [6] });
QUALS_DATA.set("QUARTERFINAL 4", { id: "q4", top_seeds: [2], bottom_seeds: [7] });
QUALS_DATA.set("SEMIFINAL 1", { id: "s1", top_seeds: [1, 8], bottom_seeds: [4, 5] });
QUALS_DATA.set("SEMIFINAL 2", { id: "s2", top_seeds: [3, 6], bottom_seeds: [2, 7] });
QUALS_DATA.set("GRAND FINALS", { id: "finals", top_seeds: [1, 8, 4, 5], bottom_seeds: [3, 6, 2, 7] });

var raw_predictions = null;
var last_win_probabilities = null;
var last_h2h = null;
var last_table_setting = "off";

var last_lcq_order = []

/**
    * Calculate per-runner split times and deltas
    * Return a map of the form 
    */
function determineSplitInfo(event) {
    var runners = getEventRunners(event);

    // extract valid runner times
    var split_times = {};
    for (const runner of runners) {
        var results = getRunnerScore(event, runner);
        if (results != null && results.splits.length == 36) {
            var split_data = results.splits;
            var times = {}
            for (var i = 0; i < 36; i++) {
                if (i < split_data.length) {
                    if (split_data[i] != null) {
                        times[i] = split_data[i];
                    }
                }
            }

            split_times[runner] = times;
        }
    }

    var runner_splits_deltas = {};
    for (var i = 0; i < 36; i++) {
        // find fastest runner for this split
        var fastest_runner = -1;
        var fastest_time = 10000000000;
        for (const [runner, runner_splits] of Object.entries(split_times)) {
            if (i in runner_splits) {
                if (runner_splits[i] < fastest_time) {
                    fastest_runner = runner;
                    fastest_time = runner_splits[i];
                }
            }
        }

        if (fastest_runner != -1) {
            // calculate deltas
            var times_deltas = {}
            for (const [runner, runner_splits] of Object.entries(split_times)) {
                if (i in runner_splits) {
                    if (fastest_runner == runner) {
                        times_deltas[runner] = {
                            time: runner_splits[i],
                            delta: null
                        }
                    } else {
                        times_deltas[runner] = {
                            time: runner_splits[i],
                            delta: fastest_time - runner_splits[i]
                        }
                    }
                } else {
                    times_deltas[runner] = {
                        time: null,
                        delta: null
                    }
                }
            }

            runner_splits_deltas[i] = times_deltas
        }
    }

    return runner_splits_deltas;
}

function displayLiveDeltas(data, event, splits, run_info) {
    var last_split = -1;
    // 35, not 36, to avoid spoiling the end of the race
    for (var row_index = 0; row_index < 35; row_index++) {
        if (row_index in splits) {
            last_split = row_index;
        }
    }

    var first_split_to_show = Math.max(0, (last_split - live_row_count) + 1);

    var runners = getRunnersBySeed(data, event);
    for (var column = 0; column < 3; column++) {
        if (column >= runners.length) {
            break;
        }

        setInnerHtml("table-runner-" + column, data.people[runners[column]].name);
        var run = run_info[runners[column]];
        if (run != null && run.currentSplitIndex <= 34) {
            setInnerHtml("runner-bpt-" + column, toStringTime(run.bestPossible, false, true, false));
        } else {
            setInnerHtml("runner-bpt-" + column, "--");
        }
    }

    var rowClass = runners.length > 2 ? "time-table-3p-split": "time-table-2p-split";

    for (var row_index = 0; row_index < live_row_count; row_index++) {
        var split_index = first_split_to_show + row_index;
        document.getElementById("label-split-" + row_index).innerHTML = getSplitName(split_index);

        if (split_index in splits) {
            var split_data = splits[split_index];

            let bestSplit = Object.entries(split_data).sort(([_key1, value1], [_key2, value2]) => {
                let value11 = value1.time;
                let value21 = value2.time;
                if (value11 && value21) {
                    return value11 - value21;
                }
                if (value11 && !value21) {
                    return -1;
                }
                if (value21 && !value11) {
                    return 1;
                }
                return 0;
            })
            let bestTime = bestSplit && bestSplit.length > 1 ? bestSplit[0][1].time : undefined;

            for (const [runner_idx, runner] of runners.entries()) {
                var runner_split = split_data[runner];
                var time_element = document.getElementById("runner-" + runner_idx + "-split-" + row_index);
                if (time_element == null) {
                    continue;
                }

                if (runner_split == null || runner_split.time == null) {
                    time_element.innerHTML = "--";
                    time_element.className = rowClass;
                } else {
                    time_element.innerHTML = toStringTime(runner_split.time, false, true, false)
                    let setstyle = rowClass;
                    if (runner_split.time <= bestTime) {
                        setstyle += " ahead";
                    } else {
                        setstyle += " behind";
                    }
                    time_element.className = setstyle;
                }
            }
        } else {
            for (var runner = 0; runner < 3; runner++) {
                setInnerHtml("runner-" + runner + "-split-" + row_index, "--");
                var time_element = document.getElementById("runner-" + runner + "-split-" + row_index);
                if (time_element != null) {
                    time_element.className = rowClass;
                }
            }
        }
    }
}

function displayLCQDeltas(data, event, splits) {
    var last_split = -1;
    // 35, not 36, to avoid spoiling the end of the race
    for (var row_index = 0; row_index < 35; row_index++) {
        if (row_index in splits) {
            last_split = row_index;
        }
    }


    // determine the order of runners, based on who is ahead in the most recent split, 
    // then by who is ahead in the previous split, etc


    var new_lcq_order = []
    var relative_deltas = {};
    for (var split_index = last_split; split_index >= 0; split_index--) {
        var split_data = splits[split_index];
        var split_runners = Object.keys(split_data);
        var real_runners = split_runners.filter((runner) => split_data[runner].time != null);
        var sorted_runners = real_runners.sort((a, b) => {
            let value11 = split_data[a].time;
            let value21 = split_data[b].time;
            if (value11 && value21) {
                return value11 - value21;
            }
            if (value11 && !value21) {
                return -1;
            }
            if (value21 && !value11) {
                return 1;
            }
            return 0;
        });

        // add any runners we haven't seen yet to the lcq order
        for (var i = 0; i < sorted_runners.length; i++) {
            var this_runner = sorted_runners[i]
            var runner_ahead = new_lcq_order.length > 0 ? new_lcq_order[new_lcq_order.length - 1] : null;
            if (!new_lcq_order.includes(this_runner)) {
                new_lcq_order.push(this_runner);

                if (runner_ahead == null) {
                    relative_deltas[this_runner] = 0;
                } else {
                    // determine delta between this runner and the runner ahead of them
                    // if the runner ahead has a worse time than this runner, delta is zero
                    var ahead_idx = sorted_runners.indexOf(runner_ahead.toString());
                    if (ahead_idx == -1 || ahead_idx > i) {
                        relative_deltas[this_runner] = 0;
                    } else {
                        var delta = split_data[this_runner].time - split_data[runner_ahead].time;
                        relative_deltas[this_runner] = delta;
                    }
                }
            }
        }
    }

    // add remaining runners with no splits
    var event_runners = getEventRunners(event);
    for (const runner of event_runners) {
        if (!new_lcq_order.includes(runner)) {
            new_lcq_order.push(runner);
            relative_deltas[runner] = 0;
        }
    }

    var changedSlots = [];

    //Move down all slots that changed.
    for (var i = 0; i < new_lcq_order.length; i++) {
        var old_position = last_lcq_order.indexOf(new_lcq_order[i]);
        if (old_position == -1 || old_position != i) {
            changedSlots.push(i);
            var name_elem = document.getElementById("lcq-p" + (i + 1));
            if (name_elem != null) {
                name_elem.classList.add("moveDown");
                name_elem.classList.remove("moveUp");
                void name_elem.offsetWidth;
            }
        }
    }

    var newLCQCopy = [...new_lcq_order];
    var lastLCQCopy = [...last_lcq_order];

    setTimeout(() => {
        for (var i = 0; i < newLCQCopy.length; i++) {
            setInnerHtml("lcq-p" + (i + 1), data.people[newLCQCopy[i]].name);

            var delta_time = relative_deltas[newLCQCopy[i]];
            if (delta_time == null || delta_time <= 0) {
                setInnerHtml("lcq-p" + (i + 1) + "-delta", "-");
            } else {
                if (delta_time < 1000 * 60) {
                    var delta_str = "+" + toStringTime(delta_time, false, false, true, 1);
                } else {
                    var delta_str = "+" + toStringTime(delta_time, false, false, false);
                }
                delta_str = delta_str.replace("+0", "+");
                setInnerHtml("lcq-p" + (i + 1) + "-delta", delta_str);
            }

            //Reveal slots that changed
            var old_position = lastLCQCopy.indexOf(newLCQCopy[i]);
            if (old_position == -1 || old_position != -1) {
                var name_elem = document.getElementById("lcq-p" + (i + 1));
                if (name_elem != null) {
                    void name_elem.offsetWidth;
                    name_elem.classList.add("moveUp");
                    name_elem.classList.remove("moveDown");
                }
            }
        }
    }, 1000);



    last_lcq_order = newLCQCopy;
}

function displayFinalTimes(data, event, times) {
    var rung_labels = getRungLabels(event);
    var rung_label_colors = getRungColors(event);
    var runners = getRunnersByTime(event);

    for (var i = 0; i < runners.length; i++) {
        var label_box = document.getElementById("position-" + (i + 1) + "-status");
        var name_box = document.getElementById("position-" + (i + 1) + "-name");
        var img_box = document.getElementById("position-" + (i + 1) + "-img");
        var pb_box = document.getElementById("position-" + (i + 1) + "-pb");

        if (pb_box == null) {
            break;
        }

        var participant = data.people[runners[i].id];
        var participant_meta = null;
        var participant_time = null;
        if (participant != null) {
            participant_meta = user_meta.get(participant.name);
            participant_time = getRunnerFastestTime(data, participant.id);
        }

        if (participant_time != null) {
            pb_box.innerHTML = "PB: " + participant_time;
        }


        label_box.innerHTML = rung_labels[i];
        name_box.innerHTML = participant.name.toUpperCase();
        img_box.src = '/html/ladder_league/icons/' + participant.name + ".png";

        placement_box.innerHTML

        for (var s = 0; s < 6; s++) {
            var split_idx = (s * 6) + 5
            var entry = document.getElementById("position-" + (i + 1) + "-" + (s + 1) + "-time");
            var entry_str = "--"
            if (s == 5) {
                var final_time = getRunnerScore(event, runners[i].id);
                if (final_time != null) {
                    entry_str = final_time;
                }
            } else if (s < Object.keys(times).length) {
                var split_data = times[split_idx];
                if (runners[i].id in split_data) {
                    var runner_split = split_data[runners[i].id];
                    if (runner_split != null && runner_split.time != null) {
                        entry_str = toStringTime(runner_split.time, false, true, false);
                    }
                }
            }

            entry.innerHTML = entry_str;
        }
    }
}

function normalizeWinProbability(state, predictions) {
    let new_predictions = {};
    for (var i = 0; i < predictions.runners.length; i++) {
        let participant = getParticipantByName(state, predictions.runners[i]);
        new_predictions[participant.id] =
            predictions.probabilities[i][0];
    }

    return new_predictions;
}

function getHeadToHead(state, event, predictions, h2h) {
    if (h2h == null || h2h.length != 2) {
        return;
    }

    let h2h_1 = parseInt(h2h[0]);
    let h2h_2 = parseInt(h2h[1]);

    if (isNaN(h2h_1) || isNaN(h2h_2)) {
        return;
    }

    if (h2h_1 == h2h_2) {
        return;
    }

    if (h2h_1 < 1 || h2h_1 > predictions.runners.length || h2h_2 < 1 || h2h_2 > predictions.runners.length) {
        return;
    }


    let h2h1_data = null;
    let h2h2_data = null;

    let seed_runners = getRunnersBySeed(state, event);

    for (var i = 0; i < predictions.runners.length; i++) {
        let participant = getParticipantByName(state, predictions.runners[i]);
        if (participant && participant.id == seed_runners[h2h_1 - 1]) {
            h2h1_data = {
                runner: participant,
                index: i,
                percent: null
            }
        }

        if (participant && participant.id == seed_runners[h2h_2 - 1]) {
            h2h2_data = {
                runner: participant,
                index: i,
                percent: null
            }
        }
    }

    if (h2h1_data != null && h2h2_data != null) {
        h2h1_data.percent = predictions.h2h[h2h1_data.index][h2h2_data.index];
        h2h2_data.percent = predictions.h2h[h2h2_data.index][h2h1_data.index];

        return {
            runner1: h2h1_data,
            runner2: h2h2_data
        }
    } else {
        return null
    }
}

function animateBar(bar_idx, name, new_value, old_value, largest) {
    const INTERVAL = 650;
    const MIN_BAR_SIZE = 5;
    const MAX_BAR_SIZE = 380;
    const ANIMATE = true;

    setInnerHtml("bar-name-" + bar_idx, name.toUpperCase());
    let percent_display = document.getElementById("bar-percent-" + bar_idx);
    if (percent_display == null) {
        return;
    }
    new_value = Math.round(new_value);
    let start_value = -1;
    let end_value = new_value;

    if (old_value != null) {
        old_value = Math.round(old_value);
        start_value = old_value;
    }

    // Set numerical value
    if (ANIMATE) {
        let duration = Math.floor(INTERVAL / Math.abs(end_value - start_value));
        let counter = setInterval(function() {
            if (start_value < end_value) {
                start_value += 1;
            } else if (start_value > end_value) {
                start_value -= 1;
            } else { // animation done
                clearInterval(counter);
            }
            percent_display.textContent = Math.max(start_value, 0).toString() + "%";
        }, duration);
    } else {
        percent_display.textContent = end_value.toString() + "%";
    }

    let width_scale = 100;
    if (largest < 75) {
        width_scale = 90;
    }

    let bar = document.getElementById("bar-display-" + bar_idx);

    let new_bar_width = Math.max(new_value / width_scale * MAX_BAR_SIZE, MIN_BAR_SIZE);

    var old_bar_width = 0;
    if (old_value != null) {
        old_bar_width = Math.max(old_value / width_scale * MAX_BAR_SIZE, MIN_BAR_SIZE);
    }

    bar.style.width = new_bar_width.toString() + "px";
    if (ANIMATE) {
        if (bar_idx == 5) {
            console.log(old_value, new_value);
            console.log(old_bar_width, new_bar_width);
        }
        bar.animate(
            [{ width: old_bar_width.toString() + "px" }, { width: new_bar_width.toString() + "px" }],
            { duration: 600, forwards: 1 }
        );
    }

}

function displayLiveProbabilities(state, event) {
    if (raw_predictions == null) {
        return;
    }

    if (document.getElementById("win-prob-3p") == null) {
        return;
    }

    // TODO normalize predictions
    let runners = getRunnersBySeed(state, event);

    let predictions = normalizeWinProbability(state, raw_predictions);

    // set bars
    let largest = 0;
    for (const [_runner, prediction] of Object.entries(predictions)) {
        if (prediction > largest) {
            largest = prediction;
        }
    }

    for (let i = 0; i < runners.length; i++) {
        animateBar(i + 1, state.people[runners[i]].name, predictions[runners[i]] * 100, last_win_probabilities ? last_win_probabilities[runners[i]] * 100 : null, largest);
    }
    last_win_probabilities = predictions;

    let h2h_setting = state.custom_fields["head-to-head"]
    let h2h = getHeadToHead(state, event, raw_predictions, h2h_setting);

    if (h2h != null) {
        if (last_h2h != null &&
            (last_h2h.runner1.runner.id == h2h.runner1.runner.id &&
                last_h2h.runner2.runner.id == h2h.runner2.runner.id &&
                last_h2h.runner1.percent == h2h.runner1.percent &&
                last_h2h.runner2.percent == h2h.runner2.percent)) {
            return;
        }

        animateBar(4, h2h.runner1.runner.name, h2h.runner1.percent * 100, last_h2h ? last_h2h.runner1.percent * 100 : null, false);
        animateBar(5, h2h.runner2.runner.name, h2h.runner2.percent * 100, last_h2h ? last_h2h.runner2.percent * 100 : null, false);
        last_h2h = h2h;
    }
}

function getRungLabels(event) {
    if (event.name.startsWith("QUARTERFINAL") ||
        event.name.startsWith("SEMIFINAL")) {
        return PLAYOFF_RUNG_LABELS;
    }

    if(event.name.toLowerCase().includes("wildcard")){
        return WILDCARD_LABELS;
    }

    var name_elements = event.name.split(" ");
    var week = parseInt(name_elements[1]);
    var rung = parseInt(name_elements[3]);
    var week_max_rungs = 7 - (week - 1)

    if(week == 7){
        return LAST_WEEK_RUNG_LABELS;
    } else if (rung == 1) {
        return TOP_RUNG_LABELS
    } else if (rung == week_max_rungs) {
        return BOTTOM_RUNG_LABELS
    } else {
        return MIDDLE_RUNG_LABELS
    }
}

function getRungColors(event) {
    if (event.name.startsWith("QUARTERFINAL") ||
        event.name.startsWith("SEMIFINAL")) {
        return PLAYOFF_RUNG_COLORS;
    }

    if(event.name.toLowerCase().includes("wildcard")){
        return WILDCARD_COLORS;
    }

    var name_elements = event.name.split(" ");
    var week = parseInt(name_elements[1]);
    var rung = parseInt(name_elements[3]);
    var week_max_rungs = 7 - (week - 1)

    if(week == 7){
        return LAST_WEEK_RUNG_COLORS;
    } else if (rung == 1) {
        return TOP_RUNG_COLORS
    } else if (rung == week_max_rungs) {
        return BOTTOM_RUNG_COLORS
    } else {
        return MIDDLE_RUNG_COLORS
    }
}

/**
    * Return the name of the level this zero-indexed split corresponds to
    */
function getSplitName(split) {
    if (split >= 36) {
        return null;
    }
    const level = (split % 6) + 1;
    const episode_idx = Math.floor(split / 6);
    const episode_names = [
        1, 2, 4, 6, 3, 5
    ];

    return episode_names[episode_idx] + "-" + level;
}

/**
 * Return the list of commentators for this event,
 * starting with the pre-configured commentators and
 * ending with the rest.
 */
function getCommentatorsOrdered(data, event) {
    var commentators = []
    for (const commentator of event.commentators) {
        var participant = data.people[commentator];
        commentators.push({
            discord: participant.discord_id,
            participant: participant.id,
        })
    }
    return commentators;
}

function setCommentatorSlots(data, event) {
    commentator_slots = {};
    var commentators = getCommentatorsOrdered(data, event);
    for (var i = 0; i < 3; i++) {
        if (i >= commentators.length) {
            var commentator_box = document.getElementById("commentator-box-" + (i + 1));
            if (commentator_box != null) {
                commentator_box.innerHTML = "";
            }
        } else {
            var commentator = commentators[i];
            commentator_slots[commentator.discord] = i;

            var name = commentator.discord;
            var pronouns = null;
            if (commentator.participant != null) {
                var participant = data.people[commentator.participant];
                name = participant.name;
                pronouns = participant.pronouns;
            }


            var commentator_box = document.getElementById("commentator-box-" + (i + 1));
            if (commentator_box != null) {
                var commentator_html = '<span class="commentator-name">' + name + '</span>'
                if (pronouns != null && pronouns != "") {
                    commentator_html += '<span class="commentator-pronoun">' + pronouns + '</span>'
                }
                commentator_box.innerHTML = commentator_html;
            }
        }
    }

    if (commentators.length == 2) {
        var commentator_box = document.getElementById("commentator-box-3");
        if (commentator_box != null) {
            commentator_box.innerHTML = "<span><img src=\"Mic_5.png\"/ style=\"width:37px;height:37px;\"></span>"
        }
    }
}

function setResults(data, event) {
    var ordered_runners = getRunnersBySeed(data, event);

    var allset = true;

    var placementStrings = ["1st Place", "2nd Place", "3rd Place"];

    for (var i = 0; i < 3; i++) {
        var name_box = document.getElementById("view-" + (i + 1) + "-overlay");
        if (name_box != null) {
            var contents = "";
            if (i < ordered_runners.length) {
                var runner = ordered_runners[i];
                if (runner.toString() in event.runner_state) {
                    var time = getRunnerScore(event, runner);
                    if (time != null && time.final_result != null && time.final_result != "") {
                        setInnerHtml("view-" + (i + 1) + "-overlay-time", time.final_result);
                        contents = '<span>';
                    } else {
                        allset = false;
                    }
                }
            }

            if (contents != "") {
                name_box.classList.add("runner-overlay-show");
            } else {
                name_box.classList.remove("runner-overlay-show");
            }
        }
    }

    if (allset) {
        setTimeout(() => {
            var runners_time = getRunnersByTime(event);
            for (var i = 0; i < runners_time.length; i++) {
                var seed_order = ordered_runners.indexOf(runners_time[i].id);
                if (seed_order >= 0) {
                    setInnerHtml("view-" + (seed_order + 1) + "-overlay-placement", placementStrings[i]);
                    var p = document.getElementById("view-" + (i + 1) + "-overlay-placement-parent");
                    if (p) {
                        void p.offsetWidth;
                        p.classList.add("show");
                    }
                }
            }
        }, 400);
    } else {
        for (var i = 0; i < 3; i++) {
            var p = document.getElementById("view-" + (i + 1) + "-overlay-placement-parent");
            if (p) {
                p.classList.remove("show");
            }
        }
    }
}

function setFinalResultsView(data, event) {
    var runners_time = getRunnersByTime(event);
    var rung_labels = getRungLabels(event);
    var rung_colors = getRungColors(event);
    var placements = ["1st Place", "2nd Place", "3rd Place"];

    for (var i = 0; i < 3; i++) {
        if (i >= runners_time.length) {
            return;
        }

        var meta = user_meta.get(data.people[runners_time[i].id].name);

        const eps_ids = ["-ep-1", "-ep-2", "-ep-4", "-ep-6", "-ep-3"];

        var runner_results = getRunnerScore(event, runners_time[i].id);
        for (var s = 0; s < 5; s++) {
            var result = runner_results.splits[s * 6 + 5];
            var time_str = result != null ? toStringTime(result, false, true, false) : "--";
            setInnerHtml("result-" + (i + 1) + eps_ids[s], time_str);
        }

        setInnerHtml("result-name-" + (i + 1), data.people[runners_time[i].id].name);
        setInnerHtml("result-" + (i + 1) + "-ep-5", runners_time[i].time);

        var placement_box = document.getElementById("runner-" + (i + 1) + "-placement");
        if (placement_box) {
            placement_box.innerHTML = placements[i] + rung_labels[i];
            if (rung_colors[i] && rung_colors[i].length > 0) {
                placement_box.classList.add(rung_colors[i]);
            }
        }

        var icon = document.getElementById("runner-" + (i + 1) + "-icon");
        if (icon && meta && meta.icon) {
            icon.src = "./icons/" + meta.icon;
        }
    }
}

function getRunnersBySeed(data, event) {
    var runners = [];
    for (const runner of Object.keys(event.runner_state)) {
        var meta = user_meta.get(data.people[runner].name);
        if (meta != null) {
            var seed = meta.seed;
            runners.push({
                id: runner,
                seed
            })
        }
    }

    runners.sort((a, b) => a.seed - b.seed);

    return runners.map((r) => r.id);
}

function getRunnerFastestTime(data, runner) {
    var time = "99:99:99";
    for (const event of Object.values(data.events)) {
        if (event.runner_state[runner] != null) {
            var newTime = getRunnerScore(event, runner).final_result;
            if (newTime != null && newTime != "") {
                if (compareTime(newTime, time) < 0) {
                    time = newTime;
                }
            }
        }
    }

    return time;
}

function setRunnerData(data, event, stream) {
    if (event.name.startsWith("LCQ")) {
        var runners = getOrderedStreamRunners(stream);
    } else {
        var runners = getRunnersBySeed(data, event);
    }

    for (var i = 0; i < runners.length; i++) {
        var name_box = document.getElementById("runner-" + (i + 1) + "-name");
        var flag_box = document.getElementById("runner-" + (i + 1) + "-flag");
        var name_flag_box = document.getElementById("runner-" + (i + 1) + "-name-flag");
        var seed_box = document.getElementById("runner-" + (i + 1) + "-seed");
        var pb_box = document.getElementById("runner-" + (i + 1) + "-pb");
        var img_box = document.getElementById("runner-" + (i + 1) + "-img");

        var participant = data.people[runners[i]];
        var participant_meta = null;
        var participant_time = null;
        if (participant != null) {
            participant_meta = user_meta.get(participant.name);
            participant_time = getRunnerFastestTime(data, participant.id);
        }

        if (name_box != null) {
            if (participant != null) {
                var content = participant.name;
                name_box.innerHTML = content;
            } else {
                name_box.innerHTML = "";
            }
        }

        if (name_flag_box != null) {
            if (participant != null) {
                var content = participant.name;
                if (participant.location != null && participant.location != "") {
                    content += '&nbsp;&nbsp;<span class="fi fi-' + participant.location.toLowerCase() + '"></span>';
                }
                name_flag_box.innerHTML = content;
            } else {
                name_flag_box.innerHTML = "";
            }
        }

        if (flag_box != null) {
            if (participant != null) {
                if (participant.location != null && participant.location != "") {
                    flag_box.innerHTML = '<span class="c-flag fi fi-' + participant.location.toLowerCase() + '"></span>';
                } else {
                    flag_box.innerHTML = "";
                }
            } else {
                flag_box.innerHTML = "";
            }
        }

        if (seed_box != null) {
            if (participant_meta != null) {
                seed_box.innerHTML = 'Seed ' + participant_meta.seed;
            } else {
                seed_box.innerHTML = "";
            }
        }

        if (pb_box != null) {
            if (participant_time != null) {
                pb_box.innerHTML = 'Event Best: &nbsp;&nbsp;&nbsp;' + participant_time;
            } else {
                pb_box.innerHTML = "";
            }
        }

        if (img_box != null) {
            if (participant != null) {
                img_box.src = '/html/ladder_league/icons/' + participant.name + ".png";
            } else {
                img_box.src = "";
            }
        }
    }
}

function setOpenerData(data, event) {
    var event_name_opener_stats = document.getElementById("match-name-opener-stats");

    if (!event_name_opener_stats) {
        return;
    }

    setInnerHtml("match-name-opener-stats", event.name);

    var event_name_element = document.getElementById("scorebug-event-title");
    if (event_name_element != null) {
        let tokens = event.name.split(" ");
        if (tokens[0] == "QUARTERFINAL" || tokens[0] == "SEMIFINAL") {
            event_name_element.innerHTML = "<div>" + tokens[0] + "</div><div>MATCH " + tokens[1] + "</div>";
        } else if (tokens[0] == "GRAND") {
            event_name_element.innerHTML = "<div>GRAND</div><div>FINALS</div";
        } else if (tokens[0] == "LCQ") {
            event_name_element.innerHTML = "<div>LCQ</div><div>Race " + tokens[1] + "</div>";
        } else if (tokens[0].toLowerCase().includes("wildcard")) {
            event_name_element.innerHTML = "<div>WILDCARD</div><div>MATCH</div>";

            for (var i = 0; i < 3; i++) {
                setInnerHtml("stat-label-opening-" + (i + 1), "EVENT BEST");
            }
        } else if (tokens.length >= 4) {
            event_name_element.innerHTML = "<div>WEEK " + tokens[1] + "</div><div>RUNG " + tokens[3] + "</div>";

            for (var i = 0; i < 3; i++) {
                setInnerHtml("stat-label-opening-" + (i + 1), parseInt(tokens[1]) > 1 ? "EVENT BEST" : "PERSONAL BEST");
            }
        } else {
            event_name_element.innerHTML = event.name;
        }
    }

    var runners = getRunnersBySeed(data, event);
    for (var i = 0; i < 3 && i < runners.length; i++) {
        var runner = data.people[runners[i]];
        var meta = user_meta.get(runner.name);
        setInnerHtml("ladder-opening-runner-name-" + (i + 1), runner.name);
        setInnerHtml("ladder-opening-runner-seed-" + (i + 1), "Seed " + meta.seed);
        //Change after week 1

        var bestTime = getRunnerFastestTime(data, runners[i]);

        if(bestTime == "99:99:99"){
            bestTime == meta.pb;
        }

        setInnerHtml("stat-opening-" + (i + 1), bestTime);
        var icon = document.getElementById("ladder-opening-runner-icon-" + (i + 1));
        if (icon && meta && meta.icon) {
            icon.src = "./icons/" + meta.icon;
        }
    }

    var commentators = getCommentatorsOrdered(data, event);

    if (commentators.length == 2) {
        setInnerHtml("comms-box", "<div>" + data.people[commentators[0].participant].name
            + "</div><img class=\"ladder-comms-mic\" src=\"Mic_5.png\"/><div>" + data.people[commentators[1].participant].name
            + "</div>");
    } else {
        setInnerHtml("comms-box", "");
    }
}

function setInterviewData(data, event) {
    var interviewee_custom_field = data.custom_fields["interviewee"];
    if (interviewee_custom_field == null) {
        return;
    }

    var runner = getParticipantByName(data, interviewee_custom_field);
    if (runner == null) {
        return;
    }

    var final_time = getRunnerScore(event, runner.id);

    setInnerHtml("interview-name", runner.name);
    var video = document.getElementById("video-background");
    if (video && runner.name) {
        video.src = "../../../videos/" + runner.name.toLowerCase() + ".mp4";
    }


    if (final_time != null && final_time.final_result != null && final_time.final_result != "") {
        setInnerHtml("final-time-label", "FINAL TIME");
        setInnerHtml("final-time", final_time.final_result);
    } else {
        setInnerHtml("final-time-label", "");
        setInnerHtml("final-time", "");
    }
}

function setNextEventData(data) {
    if (document.getElementById("event-1-box") == null) {
        return;
    }

    // assume good
    var next_events = getUpcomingEvents(data)
    for (var i = 0; i < 3; i++) {
        if (i < next_events.length) {
            var event = next_events[i];

            if (event.name.toLowerCase().startsWith("week")) {
                var tokens = event.name.split(" ");
                document.getElementById("next-event-" + (i + 1)).innerHTML = tokens[0] + " " + tokens[1] + " &#183; " + tokens[2] + " " + tokens[3];
            } else {
                document.getElementById("next-event-" + (i + 1)).innerHTML = event.name;
            }

            var event_start = event.event_start_time;

            var separator = "<div class=\"ll-blue\">VS</div>";

            var event_runners = getRunnersBySeed(data, event);

            var names_str = event_runners.map(
                (r) => '<div>' + data.people[r].name + '</div>'
            ).join(separator);

            document.getElementById("next-event-names-" + (i + 1)).innerHTML = names_str;

            if (event_start) {
                var date = new Date(event_start);
                var date_options = {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: 'America/New_York',
                }


                document.getElementById("next-event-date-" + (i + 1)).innerHTML =
                    date.toLocaleString("en-US", date_options) + " EST";
            } else {
                document.getElementById("next-event-date-" + (i + 1)).innerHTML =
                    "TO BE ANNOUNCED";
            }
        }
    }
}

function setRunnerBracketData(event, runner, bracket_id, is_top, winner) {
    let id = "r2"
    if (is_top) {
        id = "r1";
    }

    let root = document.getElementById(bracket_id.id + "-" + id + "-root");
    let name = document.getElementById(bracket_id.id + "-" + id + "-name");
    let time = document.getElementById(bracket_id.id + "-" + id + "-time");

    if (runner != null) {
        let runner_meta = user_meta.get(runner.name);

        root.classList.remove("runner-undecided");
        root.classList.remove("runner-winner");
        root.classList.remove("runner");
        if (winner) {
            root.classList.add("runner-winner");
        } else {
            root.classList.add("runner");
        }

        name.innerHTML = "(" + runner_meta.top8_seed + ") " + runner.name.toUpperCase();

        var final_time = getRunnerScore(event, runner.id);
        if (final_time != null && final_time != "") {
            time.innerHTML = final_time;
        } else {
            time.innerHTML = "--:--:--";
        }
    }
}

function setBracketData(data, event) {
    var bracket_name_prefix = QUALS_DATA.get(event.name);

    if (bracket_name_prefix == null) {
        return;
    }

    if (event.event_start_time != null) {
        var date = new Date(event.event_start_time);
        var date_options = {
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: 'America/New_York',
        }

        document.getElementById(bracket_name_prefix.id + "-time").innerHTML =
            date.toLocaleString("en-US", date_options) + " EST";
    }

    let runners = getRunnersBySeed(data, event);
    let top_runner = null
    let bottom_runner = null
    let compared_time = 0
    if (runners.length == 1) {
        let r1 = data.people[runners[0]];

        let meta = user_meta.get(r1.name);
        let is_top = (bracket_name_prefix.top_seeds.indexOf(meta.top8_seed) != -1);
        if (is_top) {
            top_runner = r1;
        } else {
            bottom_runner = r1;
        }
    } else if (runners.length == 2) {
        let r1 = data.people[runners[0]];
        let r2 = data.people[runners[1]];

        let meta = user_meta.get(r1.name);
        let is_r1_top = (bracket_name_prefix.top_seeds.indexOf(meta.top8_seed) != -1);
        if (is_r1_top) {
            top_runner = r1;
            bottom_runner = r2;
        } else {
            bottom_runner = r1;
            top_runner = r2;
        }

        let top_time = getRunnerScore(event, top_runner.id);
        let bot_time = getRunnerScore(event, bottom_runner.id);

        if (top_time != null && top_time != "" && bot_time != null && bot_time != "") {
            compared_time = compareTime(top_time, bot_time)
        }
    }

    setRunnerBracketData(event, top_runner, bracket_name_prefix, true, compared_time < 0);
    setRunnerBracketData(event, bottom_runner, bracket_name_prefix, false, compared_time > 0);
}

function queryProbabilities(data, event) {
    let query = [];

    let runners = getEventRunners(event);

    for (const runner of runners) {
        let participant = data.people[runner];
        let results = getRunnerScore(event, runner).splits;
        let results_no_null = []

        for (const result of results) {
            if (result != null) {
                results_no_null.push(result / 1000);
            }
        }

        query.push({
            name: participant.name,
            times: results_no_null,
        });
    }

    // query server
    fetch(odds_endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
    }).then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    }).then(data => {
        raw_predictions = data;
        displayLiveProbabilities(state, last_event)
    }).catch(reject => { })
}

connectToSocket('/ws?high_rate=true', function(data) {
    state = data;

    var event_id = getEventForHost(data, this_host);
    if (event_id == null) {
        return;
    }

    var event = getEventById(data, event_id);
    var stream = getStreamById(data, event_id);

    last_event = event;

    console.log(data)

    setRunnerData(data, event, stream);
    setCommentatorSlots(data, event);
    setResults(data, event);
    setNextEventData(data);
    setOpenerData(data, event);
    setInterviewData(data, event);
    setFinalResultsView(data, event);
    queryProbabilities(data, event);

    const splitData = determineSplitInfo(event);
    if (document.getElementById("time-table") != null) {
        // has live data
        displayLiveDeltas(state, event, splitData, data.active_runs);
    } else if (document.getElementById("final-table") != null) {
        displayFinalTimes(state, event, splitData);
    } else if (document.getElementById("bottom-lcq-bar" != null)) {
    }
    //displayLCQDeltas(state, event, splitData);

    var event_name_element = document.getElementById("match-title");
    if (event_name_element != null) {
        event_name_element.innerHTML = event.name;
    } else {
        event_name_element = document.getElementById("match-title-split");
        if (event_name_element != null) {
            let tokens = event.name.split(" ");
            if (tokens[0] == "QUARTERFINAL" || tokens[0] == "SEMIFINAL") {
                event_name_element.innerHTML = "<span>" + tokens[0] + "</span><span>MATCH " + tokens[1] + "</span>";
            } else if (tokens[0] == "GRAND") {
                event_name_element.innerHTML = "<span>GRAND</span><span>FINALS</span>";
            } else if (tokens[0] == "LCQ") {
                event_name_element.innerHTML = "<span>LCQ</span><span>Race " + tokens[1] + "</span>";
            } else if (tokens.length >= 4) {
                event_name_element.innerHTML = "<span>WEEK " + tokens[1] + "</span><span>RUNG " + tokens[3] + "</span>";
            } else {
                event_name_element.innerHTML = event.name;
            }
        }
    }

    let cf = data.custom_fields;
    let timeTable = document.getElementById("time-table");
    let winProb3P = document.getElementById("win-prob-3p");
    let winProb2P = document.getElementById("win-prob-2p");
    let winProbGraph = document.getElementById("win-prob-graph");

    if (timeTable && winProbGraph && winProb3P && winProb2P) {
        let table_setting = cf['table-setting'].toLowerCase();

        if (table_setting != last_table_setting) {
            if (table_setting == "prob") {
                timeTable.style.display = "none";
                winProb3P.style.display = "flex";
                winProb2P.style.display = "none";
                winProbGraph.style.display = "none";

                // clear last probability to trigger bar to extend
                last_win_probabilities = null;
            } else if (table_setting == "h2h") {
                timeTable.style.display = "none";
                winProb3P.style.display = "none";
                winProb2P.style.display = "flex";
                winProbGraph.style.display = "none";

                // clear last probability to trigger bar to extend
                last_h2h = null;
            } else if (table_setting == "graph") {
                timeTable.style.display = "none";
                winProb3P.style.display = "none";
                winProb2P.style.display = "none";
                winProbGraph.style.display = "flex";
            } else {
                timeTable.style.display = "flex";
                winProb3P.style.display = "none";
                winProb2P.style.display = "none";
                winProbGraph.style.display = "none";
            }
        }

        last_table_setting = table_setting;
    }

    if (document.getElementById("bracket") != null) {
        for (const event of Object.values(data.events)) {
            if (event.name.startsWith("QUARTERFINAL") ||
                event.name.startsWith("SEMIFINAL") ||
                event.name.startsWith("GRAND FINALS")) {
                setBracketData(data, event);
            }
        }
    }

    displayLiveProbabilities(state, event);
})

let timer_element = document.getElementById("timer");
let starter_element = document.getElementById("starting-soon");

setInterval(function() {

    if (state == null) {
        return;
    }

    var event_id = getEventForHost(state, this_host);
    if (event_id == null) {
        return;
    }

    var event = getEventById(state, event_id);

    if (timer_element != null) {
        var time = getEventTimerValue(event);
        timer_element.innerHTML = toStringTime(time, false, true);
    } else {
        if (starter_element != null) {
            let cf = state.custom_fields;
            let timer = cf['countdown-end-time'] ? parseInt(cf['countdown-end-time']) : undefined;
            let time = timer ? timer - Date.now() : undefined;
            if (time && time >= 0 && cf) {
                starter_element.innerHTML = toStringTime(time, false, true);
            } else {
                starter_element.innerHTML = "<span style=\"font-size:34px;\">Starting</span><span style=\"font-size:34px;\">Soon</span>";
            }

        }
    }
}, 100)
