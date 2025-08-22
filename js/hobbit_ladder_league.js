import {
    connectToSocket,
    getStreamById, getEventTimerValue,
    getEventById, getEventForHost, toStringTime,
    getEventRunners,
    getUpcomingEvents, getRunnersByTime,
    getRunnerScore, compareTime
} from "./automarathon.js";

const this_host = "main";
const ROW_COUNT = 4;

var user_meta = new Map();
user_meta.set("DaHamster", { seed: 1, pb: "23:02" })
user_meta.set("CaptainPaxo", { seed: 2, pb: "23:42" })
user_meta.set("Loyalist", { seed: 3, pb: "23:58" })
user_meta.set("FlamingLazer", { seed: 4, pb: "23:32" })
user_meta.set("altmega", { seed: 5, pb: "24:48" })
user_meta.set("JackJuggler", { seed: 6, pb: "25:15" })
user_meta.set("Gamer_Olive", { seed: 7, pb: "25:55" })
user_meta.set("Julikos", { seed: 8, pb: "26:32" })
user_meta.set("mugenjikan", { seed: 9, pb: "27:37" })
user_meta.set("TheDeadtra", { seed: 10, pb: "27:02" })
user_meta.set("OriginOfChaos", { seed: 11, pb: "28:07" })
user_meta.set("Nolanhead", { seed: 12, pb: "30:24" })
user_meta.set("Acute360", { seed: 13, pb: "31:46" })

var state = null;
var commentator_slots = {}

const PLAYOFF_RUNG_LABELS = [
    "Advancing",
    "Eliminated",
]

const TOP_RUNG_LABELS = [
    "Qualified",
    "",
    "Demoted"
]

const MIDDLE_RUNG_LABELS = [
    "Promoted",
    "",
    "Demoted"
]

const BOTTOM_RUNG_LABELS = [
    "Promoted",
    "Eliminated",
    "Eliminated"
]

const QUALS_DATA = new Map();
QUALS_DATA.set("QUARTERFINAL 1", { id: "q1", top_seeds: [1], bottom_seeds: [8] });
QUALS_DATA.set("QUARTERFINAL 2", { id: "q2", top_seeds: [4], bottom_seeds: [5] });
QUALS_DATA.set("QUARTERFINAL 3", { id: "q3", top_seeds: [3], bottom_seeds: [6] });
QUALS_DATA.set("QUARTERFINAL 4", { id: "q4", top_seeds: [2], bottom_seeds: [7] });
QUALS_DATA.set("SEMIFINAL 1", { id: "s1", top_seeds: [1, 8], bottom_seeds: [4, 5] });
QUALS_DATA.set("SEMIFINAL 2", { id: "s2", top_seeds: [3, 6], bottom_seeds: [2, 7] });
QUALS_DATA.set("GRAND FINALS", { id: "finals", top_seeds: [1, 8, 4, 5], bottom_seeds: [3, 6, 2, 7] });

/**
    * Calculate per-runner split times and deltas
    * Return a map of the form 
    */
function determineSplitInfo(splits, event) {
    var runners = getEventRunners(event);

    // extract valid runner times
    var split_times = {};
    for (const runner of runners) {
        if (runner in splits) {
            var split_data = splits[runner];
            var times = {}
            for (var i = 0; i < 36; i++) {
                if (i < split_data.splits.length) {
                    if (split_data.splits[i].splitTime != null) {
                        times[i] = split_data.splits[i].splitTime;
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

function displayLiveDeltas(data, event, splits) {
    var last_split = -1;
    // 35, not 36, to avoid spoiling the end of the race
    for (var row_index = 0; row_index < 35; row_index++) {
        if (row_index in splits) {
            last_split = row_index;
        }
    }

    var runners = getRunnersBySeed(data, event);
    for (var column = 0; column < 2; column++) {
        if (column >= runners.length) {
            break;
        }

        document.getElementById("table-runner-" + column).innerHTML = data.people[runners[column]].name.toUpperCase();
    }

    for (var row_index = 0; row_index < ROW_COUNT; row_index++) {
        if (row_index in splits) {
            var split_data = splits[row_index];

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
                if (runner_split == null || runner_split.time == null) {
                    time_element.innerHTML = "--";
                    time_element.className = "data-row-split";
                } else {
                    time_element.innerHTML = toStringTime(runner_split.time, false, true, false)
                    let setstyle = "data-row-split";
                    if (runner_split.time <= bestTime) {
                        setstyle += " time-leading";
                    } else {
                        setstyle += " time-trailing";
                    }
                    time_element.className = setstyle;
                }
            }

        } else {
            for (var runner = 0; runner < 2; runner++) {
                document.getElementById("runner-" + runner + "-split-" + row_index).innerHTML = "--";
            }
        }
    }
}

function displayFinalTimes(data, event, times) {
    var rung_labels = getRungLabels(event);
    var runners = getRunnersByTime(event);

    for (var i = 0; i < 3; i++) {
        if (i >= runners.length) {
            break;
        }

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

function getRungLabels(event) {
    if (event.name.startsWith("QUARTERFINAL") ||
        event.name.startsWith("SEMIFINAL")) {
        return PLAYOFF_RUNG_LABELS;
    }

    var name_elements = event.name.split(" ");
    var week = parseInt(name_elements[1]);
    var rung = parseInt(name_elements[3]);
    var week_max_rungs = 7 - (week - 1)

    if (rung == 1) {
        return TOP_RUNG_LABELS
    } else if (rung == week_max_rungs) {
        return BOTTOM_RUNG_LABELS
    } else {
        return MIDDLE_RUNG_LABELS
    }
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
            commentator_box.innerHTML = "<span><img src=\"LLMic.png\"/ style=\"width:37px;height:37px;\"></span>"
        }
    }
}

function setResults(data, event) {
    var ordered_runners = getRunnersBySeed(data, event);

    for (var i = 0; i < 4; i++) {
        var name_box = document.getElementById("view-" + (i + 1) + "-overlay");
        if (name_box != null) {
            var contents = "";
            if (i < ordered_runners.length) {
                var runner = ordered_runners[i];
                if (runner.toString() in event.runner_state) {
                    var time = getRunnerScore(event, runner);
                    if (time != null && time != "") {
                        contents = '<span>' + time + '</span>';
                    }
                }
            }

            if (contents != "") {
                name_box.innerHTML = contents;
                name_box.classList.add("runner-overlay-show");
            } else {
                name_box.innerHTML = "";
                name_box.classList.remove("runner-overlay-show");
            }
        }
    }
}

function getRunnersBySeed(data, event) {
    var runners = [];
    for (const runner of Object.keys(event.runner_state)) {
        var meta = user_meta.get(data.people[runner].name);
        if (meta != null) {
            var seed = meta.top8_seed;
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
            var newTime = getRunnerScore(event, runner);
            if (newTime != null && newTime != "") {
                if (compareTime(newTime, time) < 0) {
                    time = newTime;
                }
            }
        }
    }

    return time;
}

function setRunnerData(data, event) {
    var runners = getRunnersBySeed(data, event);
    for (var i = 0; i < 2; i++) {
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
                var content = participant.name.toUpperCase();
                name_box.innerHTML = content;
            } else {
                name_box.innerHTML = "";
            }
        }

        if (name_flag_box != null) {
            if (participant != null) {
                var content = participant.name.toUpperCase();
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
                seed_box.innerHTML = 'SEED ' + participant_meta.top8_seed;
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

function setNextEventData(data) {
    if (document.getElementById("next-event-1") == null) {
        return;
    }

    // assume good
    var next_events = getUpcomingEvents(data)
    for (var i = 0; i < 3; i++) {
        if (i < next_events.length) {
            var event = next_events[i];
            document.getElementById("next-event-" + (i + 1)).innerHTML = event.name;

            var event_start = event.event_start_time;

            var event_runners = getRunnersBySeed(data, event);
            var names_str = event_runners.map(
                (r) => '<span class="event-player-larger">' + data.people[r].name + '</span>'
            ).join(" vs ");

            document.getElementById("next-event-names-" + (i + 1)).innerHTML = names_str;

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

        console.log("Bracket name prefix", bracket_name_prefix);
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

connectToSocket('/ws', function(data) {
    state = data;
    console.log("state", state)

    // var event_id = getEventForHost(data, this_host);
    // if (event_id == null) {
    //     return;
    // }

    // var event = getEventById(data, event_id);
    var event = state.events[0]

    setRunnerData(data, event);
    setCommentatorSlots(data, event);
    setResults(data, event);
    setNextEventData(data);

    var event_name_element = document.getElementById("event-title");
    if (event_name_element != null) {
        event_name_element.innerHTML = event.name;
    } else {
        event_name_element = document.getElementById("event-title-split");
        if (event_name_element != null) {
            let tokens = event.name.split(" ");
            if (tokens[0] == "QUARTERFINAL" || tokens[0] == "SEMIFINAL") {
                event_name_element.innerHTML = "<span>" + tokens[0] + "</span><span>MATCH " + tokens[1] + "</span>";
            }

            if (tokens[0] == "GRAND") {
                event_name_element.innerHTML = "<span>GRAND</span><span>FINALS</span>";
            }
        }
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

})

connectToSocket('/ws/runs', function(data) {
    if (state == null) {
        return;
    }

    var event_id = getEventForHost(state, this_host);
    if (event_id == null) {
        return;
    }

    var event = getEventById(state, event_id);

    console.log("data", data);
    console.log("new", data.win_probabilities);

    if (document.getElementById("data-table") != null) {
        // has live data
        const splitData = determineSplitInfo(data.active_runs, event);
        displayLiveDeltas(state, event, splitData, data.active_runs);
    } else if (document.getElementById("final-table") != null) {
        const splitData = determineSplitInfo(data.active_runs, event);
        displayFinalTimes(state, event, splitData);
    }
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
                starter_element.innerHTML = "<span style=\"font-size:123px;\">" + toStringTime(time, false, true) + "</span>";
            } else {
                starter_element.innerHTML = "<span style=\"font-size:87px;\">Starting Soon...</span>"
            }

        }
    }
}, 100)
