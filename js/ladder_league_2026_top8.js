import {
    connectToSocket,
    getEventTimerValue,
    getEventById, getEventForHost, toStringTime,
    getEventRunners,
    getUpcomingEvents,
    getParticipantByName,
    getRunnerScore, compareTime,
    setInnerHtml
} from "./automarathon.js";

const odds_endpoint = "http://10.0.0.60:8080/calculate"
const this_host = "main";

var user_meta = new Map();
user_meta.set("Zac", { seed: 1, top8_seed: 4, pb: "2:16:33", icon: "Zac-Emperor.png" })
user_meta.set("Dragon76", { seed: 2, top8_seed: 1, pb: "2:17:02", icon: "Dragon-Maul.png" })
user_meta.set("Jared", { seed: 3, top8_seed: 8, pb: "2:17:24", icon: "Jared-Obiwan.png" })
user_meta.set("ERoadhouse", { seed: 4, top8_seed: 2, pb: "2:17:31", icon: "Eroadhouse-LukeHoth.png" })
user_meta.set("Anorak", { seed: 5, top8_seed: 3, pb: "2:18:03", icon: "Anorak.png" })
user_meta.set("Bricko", { seed: 6, top8_seed: 7, pb: "2:17:42", icon: "Bricko-Boba.png" })
user_meta.set("Scynor", { seed: 7, top8_seed: 5, pb: "2:18:19", icon: "Scynor-Yoda.png" })
user_meta.set("WiiSuper", { seed: 8, top8_seed: 6, pb: "2:19:45", icon: "WiiSuper-ImperialGuard.png" })
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

var state = null;
var last_event = null;
var commentator_slots = {}

const QUALS_DATA = new Map();
QUALS_DATA.set("QUARTERFINAL 1", { id: "qf-1", top_seeds: [1], bottom_seeds: [8] });
QUALS_DATA.set("QUARTERFINAL 2", { id: "qf-2", top_seeds: [4], bottom_seeds: [5] });
QUALS_DATA.set("QUARTERFINAL 3", { id: "qf-3", top_seeds: [2], bottom_seeds: [7] });
QUALS_DATA.set("QUARTERFINAL 4", { id: "qf-4", top_seeds: [3], bottom_seeds: [6] });
QUALS_DATA.set("SEMIFINAL 1", { id: "sf-1", top_seeds: [1, 8], bottom_seeds: [4, 5] });
QUALS_DATA.set("SEMIFINAL 2", { id: "sf-2", top_seeds: [2, 7], bottom_seeds: [3, 6] });
QUALS_DATA.set("GRAND FINALS", { id: "final", top_seeds: [1, 8, 4, 5], bottom_seeds: [3, 6, 2, 7] });
QUALS_DATA.set("3RD PLACE MATCH", { id: "3rd", top_seeds: [1, 8, 4, 5], bottom_seeds: [3, 6, 2, 7] });

var raw_predictions = null;
var last_active = "splits-table";

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

    var first_split = last_split - 2;
    if (first_split < 0) {
        first_split = 0;
    }

    var ui_splits = []
    var ui_bpts = [null, null]
    var runners = getRunnersBySeed(data, event);
    for (var i = 0; i < 36; i++) {
        if (i in splits) {
            var split_data = splits[i];
            var split1 = split_data[runners[0]];
            var split2 = split_data[runners[1]];
            if (split1 == null) {
                ui_splits.push([null, split2.time]);
            } else if (split2 == null) {
                ui_splits.push([split1.time, null]);
            } else {
                ui_splits.push([split1.time, split2.time]);
            }
        } else {
            ui_splits.push([null, null]);
        }
    }

    for (var i = 0; i < 2; i++) {
        var run = run_info[runners[i]];
        if (run != null) {
            ui_bpts[i] = run.bestPossible;
        }
    }

    var live_table = document.querySelector("splits-table");
    if (live_table != null) {
        live_table.splitIndex = first_split;
        live_table.splits = ui_splits;
        live_table.bpts = ui_bpts;
    }

    var results_table = document.querySelector("match-results");
    if (results_table != null) {
        results_table.eventName = event.name;
        results_table.splits = ui_splits;
        results_table.finalTimes = [getRunnerScore(event, runners[0]).final_result, getRunnerScore(event, runners[1]).final_result];

        var runner_1 = data.people[runners[0]];
        var runner_2 = data.people[runners[1]];

        results_table.p1Name = runner_1.name;
        results_table.p1Icon = "../icons/" + user_meta.get(runner_1.name).icon;
        results_table.p1MainImage = "./images/" + runner_1.name + "_Left.png";

        results_table.p2Name = runner_2.name;
        results_table.p2Icon = "../icons/" + user_meta.get(runner_2.name).icon;
        results_table.p2MainImage = "./images/" + runner_2.name + "_Right.png";
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

function displayLiveProbabilities(state, event) {
    if (raw_predictions == null) {
        return;
    }

    if (document.getElementById("prob") == null) {
        return;
    }

    // TODO normalize predictions
    let predictions = normalizeWinProbability(state, raw_predictions);

    // set bars
    let runner_names = []
    let prediction_values = []
    for (const [runner, prediction] of Object.entries(predictions)) {
        var participant = state.people[runner];
        runner_names.push(participant.name);
        prediction_values.push(prediction * 100);
    }

    var prob = document.querySelector("win-prob");
    prob.names = runner_names
    prob.probs = prediction_values
    prob.animateBar();
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
        commentators.push(participant.id)
    }
    return commentators;
}

function setCommentatorSlots(data, event) {
    commentator_slots = {};
    var commentators = getCommentatorsOrdered(data, event);
    var names = []
    for (var i = 0; i < 2; i++) {
        var commentator = commentators[i];

        if (commentator != null) {
            commentator_slots[commentator] = i;
            var commentator_box = document.getElementById("comm-" + (i + 1));
            var participant = data.people[commentator];
            if (commentator_box) {
                commentator_box.name = participant.name;
                commentator_box.pronoun = participant.pronouns;
            }
            names.push(participant.name);
        }
    }

    var all_names = document.querySelector("commentator-names");
    if (all_names != null) {
        all_names.names = names;
    }
}

function setResults(data, event) {
    var ordered_runners = getRunnersBySeed(data, event);

    for (var i = 0; i < 2; i++) {
        var name_box = document.getElementById("win-overlay");
        if (name_box != null) {
            var runner = ordered_runners[i];
            if (runner.toString() in event.runner_state) {
                var time = getRunnerScore(event, runner);
                if (i == 0) {
                    name_box.p1Time = time.final_result;
                } else {
                    name_box.p2Time = time.final_result;
                }
            }
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

function setRunnerData(data, event) {
    var runners = getRunnersBySeed(data, event);

    for (var i = 0; i < runners.length; i++) {
        var runner_element = document.getElementById("runner-" + (i + 1));

        if (runner_element == null) {
            break;
        }

        var participant = data.people[runners[i]];
        var participant_meta = null;
        var participant_time = null;
        if (participant != null) {
            participant_meta = user_meta.get(participant.name);
            participant_time = getRunnerFastestTime(data, participant.id);
        } else {
            break;
        }

        runner_element.name = participant.name;
        runner_element.flag = participant.location.toLowerCase();
        runner_element.pb = participant_time;
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

        if (bestTime == "99:99:99") {
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

function setBracketData(data, event) {
    var bracket_name_prefix = QUALS_DATA.get(event.name);

    if (bracket_name_prefix == null) {
        return;
    }

    let time = null;
    if (event.event_start_time != null) {
        time = new Date(event.event_start_time);
    }

    let runners = getRunnersBySeed(data, event);
    let top_runner = null
    let bottom_runner = null
    let top_time = null;
    let bottom_time = null;
    if (runners.length == 1) {
        let r1 = data.people[runners[0]];

        let meta = user_meta.get(r1.name);
        let is_top = (bracket_name_prefix.top_seeds.indexOf(meta.top8_seed) != -1);
        if (is_top) {
            top_runner = r1;
            top_time = getRunnerScore(event, top_runner.id).final_result;
        } else {
            bottom_runner = r1;
            bottom_time = getRunnerScore(event, bottom_runner.id).final_result;
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

        top_time = getRunnerScore(event, top_runner.id).final_result;
        bottom_time = getRunnerScore(event, bottom_runner.id).final_result;
    }

    var box = document.getElementById(bracket_name_prefix.id);
    if (box != null) {
        box.eventName = event.name;
        box.eventTime = time;
        if (top_runner) {
            box.p1Name = top_runner.name;
            box.p1Seed = user_meta.get(top_runner.name).top8_seed;
            if (top_time) {
                box.p1Time = top_time;
            }
        } else {
            box.p1Name = null;
            box.p1Seed = null;
        }

        if (bottom_runner) {
            box.p2Name = bottom_runner.name;
            box.p2Seed = user_meta.get(bottom_runner.name).top8_seed;
            box.p2Icon = user_meta.get(top_runner.name).icon;
            box.p1MainImage = "./images/" + top_runner.name + "_Right.jpg";
            if (bottom_time) {
                box.p2Time = bottom_time;
            }
        } else {
            box.p2Name = null;
            box.p2Seed = null;
        }
    }
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

    last_event = event;

    setRunnerData(data, event);
    setCommentatorSlots(data, event);
    setResults(data, event);
    setNextEventData(data);
    setOpenerData(data, event);
    setInterviewData(data, event);
    queryProbabilities(data, event);

    const splitData = determineSplitInfo(event);
    displayLiveDeltas(state, event, splitData, data.active_runs);

    let cf = data.custom_fields;

    var active = "splits-table"

    let table_setting = cf['table-setting'].toLowerCase();

    if (table_setting == "prob") {
        active = "win-prob";
    } else {
        active = "splits-table";
    }

    var lowerThirds = document.querySelector("lower-thirds");

    if (lowerThirds != null) {
        /*contentBoxHeight: {type: Number},
                lowerThirdsHeader: {type: String},
                image: {type: String},
                headerText: {type: String},
                mainText: {type: String},
                left: {type: Number},
                _onScreen: {type: Boolean}*/

        lowerThirds.lowerThirdsHeader = cf['lower-banner-title'];
        lowerThirds.headerText = cf['lower-box-title'];
        lowerThirds.mainText = cf['lower-box-tagline'];
        lowerThirds.image = cf['lower-box-image:person'];

        if (!lowerThirds._onScreen && (cf["lower-thirds-on:bool"] === "true")) {
            lowerThirds.reveal();
        } else if (lowerThirds._onScreen && !(cf["lower-thirds-on:bool"] === "true")) {
            lowerThirds.hide();
        }
    }

    var countdownBug = document.querySelector("countdown-bug");

    if (countdownBug != null) {
        var runners = getRunnersBySeed(data, event);
        var runner_1 = data.people[runners[0]];
        var runner_2 = data.people[runners[1]];

        countdownBug.p1Name = runner_1.name;
        countdownBug.p1Seed = user_meta.get(runner_1.name).seed;
        countdownBug.p1Image = "../images/" + runner_1.name + "_Forward.png";

        countdownBug.p2Name = runner_2.name;
        countdownBug.p2Seed = user_meta.get(runner_2.name).seed;
        countdownBug.p2Image = "../images/" + runner_2.name + "_Forward.png";

        countdownBug.eventName = event.name;
        countdownBug.countdownEndtime = isFinite(cf['countdown-end:date']) ? parseInt(cf['countdown-end:date']) : Date.now();

        if (!countdownBug._onScreen && (cf["countdown-bug:bool"] === "true")) {
            countdownBug.reveal();
        } else if (countdownBug._onScreen && !(cf["countdown-bug:bool"] === "true")) {
            countdownBug.hide();
        }
    }

    var commentatorNames = document.querySelector("commentator-names");
    if (commentatorNames != null) {

        var names = [];
        var socials = [];

        const socialsMap = {
            "dragon76": "Cragon76", "eroadhouse": "ERoadhouse", "anorak": "AnorakDT", "zac": "ZacMuffin",
            "scynor": "Scynor_", "wiisuper": "WiiSuper", "bricko": "BrickoFett", "jared": "ItsJared97",
            "flaminglazer": "Flaming_Lazer", "anonymous": "AnAnonymousSource", "jav": "Javster101",
            "p53": "P53P", "saber": "Saber1658", "wazzip": "vvazzip", "thecrazedcap": "TheCrazedCap", "mellovro": "MelloVro"
        }

        if (cf['comm-1:person'] && cf['comm-1:person'].length > 0) {
            const selectedUser = data.people[cf['comm-1:person']];
            console.log(selectedUser.name);
            if (selectedUser.name.toLowerCase() != "tba") {
                names.push(selectedUser.name);
                socials.push(socialsMap[selectedUser.name.toLowerCase()] ?? "Temp");
            }
        }

        if (cf['comm-2:person'] && cf['comm-2:person'].length > 0) {
            const selectedUser = data.people[cf['comm-2:person']];
            if (selectedUser.name.toLowerCase() != "tba") {
                names.push(selectedUser.name);
                socials.push(socialsMap[selectedUser.name.toLowerCase()] ?? "Temp");
            }
        }

        if (cf['comm-3:person'] && cf['comm-3:person'].length > 0) {
            const selectedUser = data.people[cf['comm-3:person']];
            if (selectedUser.name.toLowerCase() != "tba") {
                names.push(selectedUser.name);
                socials.push(socialsMap[selectedUser.name.toLowerCase()] ?? "Temp");
            }
        }

        commentatorNames.names = names;
        commentatorNames.socials = socials;

        if (!commentatorNames._onScreen && (cf["comms-on:bool"] === "true")) {
            commentatorNames.reveal();
        } else if (commentatorNames._onScreen && !(cf["comms-on:bool"] === "true")) {
            commentatorNames.hide();
        }
    }

    if (last_active != active) {
        var slides = ['splits-table', 'win-prob'];
        if (document.querySelector("splits-table") != null) {

            slides = slides.filter(elem => elem !== active);

            const tl = gsap.timeline();
            const activeElem = document.querySelector(active);

            let duration = 0.65;

            tl.to(activeElem, { autoAlpha: 1, duration: duration });

            slides.forEach(element => {
                const elem = document.querySelector(element);
                tl.to(elem, { autoAlpha: 0, duration: duration }, `-=${duration}`);
            });
        }
    }

    last_active = table_setting;

    for (const event of Object.values(data.events)) {
        if (event.name.startsWith("QUARTERFINAL") ||
            event.name.startsWith("SEMIFINAL") ||
            event.name.startsWith("GRAND FINALS") ||
            event.name.startsWith("THIRD PLACE MATCH") ||
            event.name.startsWith("3RD PLACE MATCH")) {
            setBracketData(data, event);
        }
    }
})

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

    let timer_element = document.getElementById("title-bar");
    if (timer_element != null) {
        timer_element.timer = getEventTimerValue(event);
    } else {
        if (starter_element != null) {
            let cf = state.custom_fields;
            let timer = cf['countdown-end:date'] ? parseInt(cf['countdown-end:date']) : undefined;
            let time = timer ? timer - Date.now() : undefined;
            if (time && time >= 0) {
                starter_element.innerHTML = toStringTime(time, false, true);
            } else {
                starter_element.innerHTML = "<span style=\"font-size:34px;\">Starting</span><span style=\"font-size:34px;\">Soon</span>";
            }

        }
    }
}, 100)
