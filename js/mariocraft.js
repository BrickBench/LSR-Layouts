import {
    connectToSocket, setInnerHtml,
    getStreamById, getEventTimerValue,
    getEventById, getEventForHost, toStringTime,
    getEventRunners,
    getUpcomingEvents, getEventByName,
    getRunnerScore, compareTime
} from "./automarathon.js";

const this_host = "main";

var user_meta = new Map();
user_meta.set("Jhay", {
    seed: 1, coach: "silver", pb: "15:15", ff: [
        "Former 9/9 WRs in SMG1/2",
        "11 Min lead on 2nd in 242 Star",
        "Sub 20 Hour 602"
    ]
})
user_meta.set("GreenSuigi", {
    seed: 2, coach: "k4yfour", pb: "17:24", ff: [
        "5/5 WRs in SM64",
        "First Sub 1:36 in 120",
        "23 SM64 Main Board WRs"
    ]
})
user_meta.set("Treybordo", {
    seed: 3, coach: "21mustard", pb: "18:19", ff: [
        "Top 10 16, 1, 0 Star",
        "Sub 15 16 Star",
        "Short Category Specialist"
    ]
})
user_meta.set("Tyron", {
    seed: 4, coach: "Poundy", pb: "18:19", ff: [
        "48x SMO Any% WR Holder",
        "First Sub 56 in SMO Any%",
        "Currently Holds 3/6 SMO WRs"
    ]
})
user_meta.set("Jjsrl", {
    seed: 5, coach: "Fruitberries", pb: "18:34", ff: [
        "3x SMS WR Holder",
        "96 Shines WR Holder",
        "Top 100 SM64 Player"
    ]
})
user_meta.set("GTM", {
    seed: 6, coach: "Nerdi", pb: "29:55", ff: [
        "Top 4 16 Star",
        "16 Star Specialist",
        "Twitter Legend"
    ]
})
user_meta.set("Moky", {
    seed: 7, coach: "Infume", pb: "44:07", ff: [
        "Top 5 Melee Player",
        "DPotG '24 Champion",
        "Sub 17 16 Star"
    ]
})
user_meta.set("Dwhatever", {
    seed: 8, coach: "Cube", pb: "TBD", ff: [
        "Former 70 Star WR",
        "First Sub 47 70 Star",
        "Nonstop 120/70 WR Holder"
    ]
})

var state = null;
var commentator_slots = {}

const QUALS_DATA = new Map();

// Winner's bracket
QUALS_DATA.set("W-5", { top: "W-1 W", bottom: "W-2 W" });
QUALS_DATA.set("W-6", { top: "W-3 W", bottom: "W-4 W" });
QUALS_DATA.set("W-7", { top: "W-5 W", bottom: "W-6 W" });

QUALS_DATA.set("FINALS", { top: "W-7 W", bottom: "L-6 W" });

// Loser's bracket
QUALS_DATA.set("L-1", { top: "W-1 L", bottom: "W-2 L" });
QUALS_DATA.set("L-2", { top: "W-3 L", bottom: "W-4 L" });
QUALS_DATA.set("L-3", { top: "W-6 L", bottom: "L-1 W" });
QUALS_DATA.set("L-4", { top: "W-5 L", bottom: "L-2 W" });
QUALS_DATA.set("L-5", { top: "L-3 W", bottom: "L-4 W" });
QUALS_DATA.set("L-6", { top: "W-7 L", bottom: "L-5 W" });

const TITLE_DATA = new Map();
TITLE_DATA.set("W-1", "ROUND 1");
TITLE_DATA.set("W-2", "ROUND 1");
TITLE_DATA.set("W-3", "ROUND 1");
TITLE_DATA.set("W-4", "ROUND 1");

TITLE_DATA.set("W-5", "ROUND 2");
TITLE_DATA.set("W-6", "ROUND 2");
TITLE_DATA.set("L-1", "ROUND 3");

TITLE_DATA.set("W-7", "WINNER'S FINALS");
TITLE_DATA.set("FINALS", "GRAND FINALS");

TITLE_DATA.set("L-1", "LOSER'S ROUND 1");
TITLE_DATA.set("L-2", "LOSER'S ROUND 1");

TITLE_DATA.set("L-3", "LOSER'S ROUND 2");
TITLE_DATA.set("L-4", "LOSER'S ROUND 2");
TITLE_DATA.set("L-5", "LOSER'S ROUND 3");
TITLE_DATA.set("L-6", "LOSER'S FINALS");

function getRunnerWinnerLoser(event) {
    var runners = getEventRunners(event);
    if (runners.length < 2) {
        return null
    }

    var runner1_score = getRunnerScore(event, runners[0]);
    var runner2_score = getRunnerScore(event, runners[1]);

    if (runner1_score == null || runner1_score == "" || runner2_score == null || runner2_score == "") {
        return null;
    }

    if (runner1_score > runner2_score) {
        return {
            winner: runners[0],
            loser: runners[1],
        }
    } else {
        return {
            winner: runners[1],
            loser: runners[0],
        }
    }
}

function getRunnerByBracketPosition(data, position) {
    var split = position.split(" ");
    var event_code = split[0];
    var result_type = split[1];

    var event = getEventByName(data, event_code);

    var winner_loser = getRunnerWinnerLoser(event);
    if (winner_loser == null) {
        return null;
    } else if (result_type == "W") {
        return winner_loser.winner;
    } else {
        return winner_loser.loser;
    }
}

function getFirstSecondEventRunner(data, event) {
    var event_data = QUALS_DATA.get(event);
    var runner_1 = null;
    var runner_2 = null;

    if (event_data != null) {
        runner_1 = getRunnerByBracketPosition(data, event_data.top);
        runner_2 = getRunnerByBracketPosition(data, event_data.bottom);
    } else {
        var runners = getEventRunners(getEventByName(data, event));
        if (runners.length == 2) {
            var meta_1 = user_meta.get(data.people[runners[0]].name);
            var meta_2 = user_meta.get(data.people[runners[1]].name);
            if (meta_1.seed < meta_2.seed) {
                runner_1 = runners[0];
                runner_2 = runners[1];
            } else {
                runner_1 = runners[1];
                runner_2 = runners[0];
            }
        }
    }

    return [runner_1, runner_2];
}

function getEventBracketBlock(data, event) {
    var runners = getFirstSecondEventRunner(data, event);
    var event_data = QUALS_DATA.get(event);
    var runner_1 = runners[0];
    var name_box_1 = "TODO";
    var score_box_1 = "-";
    var class_box_1 = "name-row";
    var runner_2 = runners[1];
    var name_box_2 = "TODO";
    var score_box_2 = "-";
    var class_box_2 = "name-row";

    if (runner_1 != null) {
        var meta = user_meta.get(data.people[runner_1].name);
        name_box_1 = `<small class="seed">${meta.seed}. </small>${data.people[runner_1].name}`;
    } else if (event_data != null) {
        var split = event_data.top.split(" ");
        var event_code = split[0];
        var result_type = split[1];

        var result_label = "Winner";
        if (result_type == "L") {
            result_label = "Loser";
        }

        name_box_1 = event_code + " " + result_label;
    }

    if (runner_2 != null) {
        var meta = user_meta.get(data.people[runner_2].name);
        name_box_2 = `<small class="seed">${meta.seed}. </small>${data.people[runner_2].name}`;
    } else if (event_data != null) {
        var split = event_data.bottom.split(" ");
        var event_code = split[0];
        var result_type = split[1];

        var result_label = "Winner";
        if (result_type == "L") {
            result_label = "Loser";
        }

        name_box_2 = event_code + " " + result_label;
    }

    if (runner_1 != null && runner_2 != null) {
        var score_1 = getRunnerScore(getEventByName(data, event), runner_1);
        var score_2 = getRunnerScore(getEventByName(data, event), runner_2);

        if (score_1 != null && score_1 != "") {
            score_box_1 = score_1;
        }

        if (score_2 != null && score_2 != "") {
            score_box_2 = score_2;
        }

        var winner_loser = getRunnerWinnerLoser(getEventByName(data, event));
        if (winner_loser != null) {
            if (winner_loser.winner == runner_1) {
                class_box_2 += " loser";
            } else if (winner_loser.winner == runner_2) {
                class_box_1 += " loser";
            }
        }
    }

    return `
            <div class="round-box">
                <div class="${class_box_1}">
                    <div class="name">
                        ${name_box_1}
                    </div>
                    <div class="round">
                        ${score_box_1}
                    </div>
                </div>
                <div class="${class_box_2}">
                    <div class="name">
                        ${name_box_2}
                    </div>
                    <div class="round">
                        ${score_box_2}
                    </div>
                </div>
            </div>
`
}

function setBracketColumn(data, column_id, events) {
    var blocks_html = "";
    for (const event of events) {
        blocks_html += getEventBracketBlock(data, event);
    }

    setInnerHtml(column_id, blocks_html);
}

function updateBracket(data) {
    setBracketColumn(data, "w-1", ["W-1", "W-2", "W-3", "W-4"]);
    setBracketColumn(data, "w-2", ["W-5", "W-6"]);
    setBracketColumn(data, "w-3", ["W-7"]);
    setBracketColumn(data, "w-4", ["FINALS"]);
    setBracketColumn(data, "l-1", ["L-1", "L-2"]);
    setBracketColumn(data, "l-2", ["L-3", "L-4"]);
    setBracketColumn(data, "l-3", ["L-5"]);
    setBracketColumn(data, "l-4", ["L-6"]);
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
        commentators.push(participant.name)
    }

    commentators.sort((a, b) => {
        return a.localeCompare(b)
    })

    return commentators;
}

function setCommentatorSlots(data, event) {
    commentator_slots = {};
    var commentators = getCommentatorsOrdered(data, event);
    for (var i = 0; i < 2; i++) {
        if (i >= commentators.length) {
            var commentator_box = document.getElementById("comm-" + (i + 1));
            if (commentator_box != null) {
                commentator_box.innerHTML = "";
            }
        } else {
            var commentator_box = document.getElementById("comm-" + (i + 1));
            if (commentator_box != null) {
                commentator_box.innerHTML = commentators[i];
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

function setResults(custom_fields) {
    for (var i = 0; i < 3; i++) {
        var name_box = document.getElementById("view-" + (i + 1) + "-overlay");
        if (name_box != null) {
            var contents = custom_fields['runner-' + (i + 1) + '-overlay-time'];
            if (contents != "") {
                contents = '<span>' + contents + '</span>';
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
    var runners = getFirstSecondEventRunner(data, event.name);
    for (var i = 0; i < 2; i++) {
        var seed_box = document.getElementById("runner-" + (i + 1) + "-seed");
        var pb_box = document.getElementById("runner-" + (i + 1) + "-pb");
        var img_box = document.getElementById("runner-" + (i + 1) + "-pfp");

        var runner = runners[i];
        if (runner == null) {
            continue;
        }
        var participant = data.people[runner];
        var participant_meta = participant != null ? user_meta.get(participant.name) : null;

        var score = getRunnerScore(event, runner)

        if (score == null || score == "") {
            score = "0"
        }

        var score_str = `<span class="dot"></span>&nbsp;<span class="dot"></span>`
        if (score == "1") {
            score_str = `<span class="dot-f"></span>&nbsp;<span class="dot"></span>`
        } else if (score == "2") {
            score_str = `<span class="dot-f"></span>&nbsp;<span class="dot-f"></span>`
        }

        setInnerHtml("runner-" + (i + 1) + "-name", participant != null ? participant.name.toUpperCase() : "");
        setInnerHtml("win-num-" + (i + 1), score_str);

        if (participant_meta != null) {
            setInnerHtml("runner-" + (i + 1) + "-coach", participant_meta.coach);
        }

        if (img_box != null) {
            img_box.src = `profiles/${participant.name.toLowerCase()}.jpg`
        }

        if (seed_box != null) {
            if (participant_meta != null) {
                seed_box.innerHTML = 'SEED ' + participant_meta.top8_seed;
            } else {
                seed_box.innerHTML = "";
            }
        }

        if (pb_box != null) {
            if (participant_meta != null) {
                pb_box.innerHTML = participant_meta.pb;
            } else {
                pb_box.innerHTML = "";
            }
        }

        for (var index = 1; index <= 3; index++) {
            setInnerHtml("fact-" + (i + 1) + "-" + index,
                participant_meta.ff[index - 1])
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

connectToSocket('/ws', function(data) {
    state = data;
    console.log("state", state)

    var event_id = getEventForHost(data, this_host);
    if (event_id == null) {
        return;
    }

    var event = getEventById(data, event_id);

    setRunnerData(data, event);
    setCommentatorSlots(data, event);
    setResults(data.custom_fields);
    setNextEventData(data);

    setInnerHtml("event-title", TITLE_DATA.get(event.name));
    var event_name_element = document.getElementById("event-title-split");
    if (event_name_element != null) {
        let tokens = event.name.split(" ");
        if (tokens[0] == "QUARTERFINAL" || tokens[0] == "SEMIFINAL") {
            event_name_element.innerHTML = "<span>" + tokens[0] + "</span><span>MATCH " + tokens[1] + "</span>";
        } else if (tokens[0] == "GRAND") {
            event_name_element.innerHTML = "<span>GRAND</span><span>FINALS</span>";
        } else {
            event_name_element.innerHTML = "<span>WEEK " + tokens[1] + "</span><span>RUNG " + tokens[3] + "</span>";
        }
    }

    if (document.getElementById("bracket") != null) {
        updateBracket(data);
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
