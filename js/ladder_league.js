import {
    connectToStateStream, connectToVoiceStream,
    getStreamById, getEventTimerValue,
    getEventById, getEventForHost, toStringTime,
    getEventRunners, getOrderedStreamRunners,
    getUpcomingEvents
} from "./automarathon.js";

const this_host = "main";
const live_row_count = 3;

var user_meta = new Map();
user_meta.set("Jared", { seed: 1, pb: "2:18:35" })
user_meta.set("FrostByte", { seed: 2, pb: "2:19:23" })
user_meta.set("WiiSuper", { seed: 3, pb: "2:20:34" })
user_meta.set("Scynor", { seed: 4, pb: "2:22:33" })
user_meta.set("Herasmie", { seed: 5, pb: "2:23:23" })
user_meta.set("Anorak", { seed: 6, pb: "2:24:22" })
user_meta.set("Dragon", { seed: 7, pb: "2:23:14" })
user_meta.set("FlamingLazer", { seed: 8, pb: "2:24:29" })
user_meta.set("Dimei", { seed: 9, pb: "2:26:58" })
user_meta.set("flup", { seed: 10, pb: "2:27:20" })
user_meta.set("Coolisen", { seed: 11, pb: "2:29:01" })
user_meta.set("Revvylo", { seed: 12, pb: "2:29:52" })
user_meta.set("TwiceLyte", { seed: 13, pb: "2:29:54" })
user_meta.set("Phantom", { seed: 14, pb: "2:30:16" })
user_meta.set("Tfresh", { seed: 15, pb: "2:30:58" })
user_meta.set("thenzota", { seed: 16, pb: "2:35:07" })
user_meta.set("Charzight", { seed: 17, pb: "2:35:21" })
user_meta.set("kwazrr", { seed: 18, pb: "2:34:17" })
user_meta.set("Anonymous", { seed: 19, pb: "2:38:52" })
user_meta.set("Biksel", { seed: 20, pb: "2:40:57" })
user_meta.set("yahootles", { seed: 21, pb: "2:43:30" })
user_meta.set("Nolan", { seed: 22, pb: "2:43:37" })
user_meta.set("Gamer_Olive", { seed: 23, pb: "2:44:07" })
user_meta.set("Chroma_Q", { seed: 24, pb: "2:46:27" })
user_meta.set("AppleMan", { seed: 25, pb: "2:48:42" })
user_meta.set("Bennymoon", { seed: 26, pb: "2:45:29" })

var state = null;
var commentator_slots = {}


/**
    * Calculate per-runner split times and deltas
    * Return a map of the form 
    */
function determineSplitInfo(splits, event) {
    console.log("determineSplitInfo", splits, event);
    var runners = getEventRunners(event);

    // extract valid runner times
    var split_times = {};
    for (const runner of runners) {
        if (runner in splits) {
            var split_data = splits[runner];
            //  if (split_data.splits.length == 36) {
            var times = {}
            // iterate over all 36 levels
            for (var i = 0; i < 36; i++) {
                if (i < split_data.splits.length) {
                    if (split_data.splits[i].splitTime != null) {
                        times[i] = split_data.splits[i].splitTime;
                    }
                }
            }

            split_times[runner] = times;
            //   } //otherwise splits are weird, can't compare
        }
    }

    console.log("split_times", split_times);

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

    console.log("runner_splits_deltas", runner_splits_deltas);

    return runner_splits_deltas;
}

function displayLiveDeltas(data, stream, splits) {
    var last_split = -1;
    for (var row_index = 0; row_index < 36; row_index++) {
        if (row_index in splits) {
            last_split = row_index;
        }
    }

    var first_split_to_show = Math.max(0, (last_split - live_row_count) + 1);

    var runners = getOrderedStreamRunners(stream)
    console.log("runs", data.active_runs);
    for (var column = 0; column < 3; column++) {
        if (column >= runners.length) {
            break;
        }

        document.getElementById("table-runner-" + column).innerHTML = data.people[runners[column]].name.toUpperCase();
        var run = data.active_runs[runners[column]];
        if (run != null && run.bestPossible != null) {
            document.getElementById("runner-bpt-" + column).innerHTML = toStringTime(run.bestPossible, true, true, true);
        } else {
            document.getElementById("runner-bpt-" + column).innerHTML = "--";
        }
    }

    for (var row_index = 0; row_index < live_row_count; row_index++) {
        var split_index = first_split_to_show + row_index;
        document.getElementById("label-split-" + row_index).innerHTML = getSplitName(split_index);

        if (split_index in splits) {
            var split_data = splits[split_index];
            console.log("split_data", split_data);

            for (const [runner_idx, runner] of runners.entries()) {
                var runner_split = split_data[runner];
                var time_element = document.getElementById("runner-" + runner_idx + "-split-" + row_index);
                if (runner_split == null || runner_split.time == null) {
                    time_element.innerHTML = "--"
                } else {
                    time_element.innerHTML = toStringTime(runner_split.time, false, true, true)
                }
            }

        } else {
            for (var runner = 0; runner < 3; runner++) {
                document.getElementById("runner-" + runner + "-split-" + row_index).innerHTML = "--";
            }
        }
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
function getCommentatorsOrdered(data, event, host) {
    var commentators = []
    for (const commentator of event.commentators) {
        var participant = data.people[commentator];
        commentators.push({
            discord: participant.discord_id,
            participant: participant.id,
        })
    }

    for (const [_discord_user, discord_data] of Object.entries(host.discord_users)) {
        console.log("discord_data", discord_data);
        if (discord_data.participant in data.people) {
            var participant = data.people[discord_data.participant];
            if (commentators.some(c => c.discord == participant.discord_id)) {
                continue; // already added above
            }

            commentators.push({
                discord: participant.discord_id,
                participant: participant.id,
            })
        } else {
            commentators.push({
                discord: discord_data.username,
                participant: null,
            })
        }
    }

    console.log("commentators", commentators);

    return commentators;
}

function setCommentatorSlots(data, event, host) {
    commentator_slots = {};
    var commentators = getCommentatorsOrdered(data, event, host);
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
                    var state = event.runner_state[runner];
                    if (state.result != null &&
                        state.result.SingleScore != null &&
                        state.result.SingleScore.score != null &&
                        state.result.SingleScore.score != "") {
                        contents = '<span>' + state.result.SingleScore.score + '</span>';
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

function setRunnerData(data, event) {
    var runners = getRunnersBySeed(data, event);
    for (var i = 0; i < 4; i++) {
        var name_box = document.getElementById("runner-" + (i + 1) + "-name");
        var flag_box = document.getElementById("runner-" + (i + 1) + "-flag");
        var name_flag_box = document.getElementById("runner-" + (i + 1) + "-name-flag");
        var seed_box = document.getElementById("runner-" + (i + 1) + "-seed");
        var pb_box = document.getElementById("runner-" + (i + 1) + "-pb");
        var img_box = document.getElementById("runner-" + (i + 1) + "-img");

        var participant = data.people[runners[i]];
        var participant_meta = null;
        if (participant != null) {
            participant_meta = user_meta.get(participant.name);
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
                seed_box.innerHTML = 'SEED ' + participant_meta.seed;
            } else {
                seed_box.innerHTML = "";
            }
        }

        if (pb_box != null) {
            if (participant_meta != null) {
                pb_box.innerHTML = 'Personal Best: &nbsp;&nbsp;&nbsp;' + participant_meta.pb;
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
    console.log("next_events", next_events);
    for (var i = 0; i < 3; i++) {
        if (i < next_events.length) {
            var event = next_events[i];
            document.getElementById("next-event-" + (i + 1)).innerHTML = event.name;

            var event_start = event.event_start_time;
            var date = new Date(event_start);

            var event_runners = getRunnersBySeed(data, event);
            var names_str = event_runners.map(
                (r) => '<span class="event-player-larger">' + data.people[r].name + '</span>'
            ).join(" vs ");

            document.getElementById("next-event-names-" + (i + 1)).innerHTML = names_str;

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

connectToStateStream(function(data) {
    state = data;

    var event_id = getEventForHost(data, this_host);
    if (event_id == null) {
        return;
    }

    var stream = getStreamById(data, event_id);
    if (stream == null) {
        return;
    }

    var event = getEventById(data, event_id);
    var host = data.hosts[this_host];
    console.log("data", data)

    setRunnerData(data, event, stream);
    setCommentatorSlots(data, event, host);
    setResults(data, event);
    setNextEventData(data);

    if (document.getElementById("data-table") != null) {
        // has live data
        const splitData = determineSplitInfo(data.active_runs, event);
        displayLiveDeltas(data, stream, splitData);
    }

    var event_name_element = document.getElementById("event-title")
    if (event_name_element != null) {
        event_name_element.innerHTML = event.name;
    }
})

connectToVoiceStream(function(data) {
    if (data == null) {
        return;
    }

    for (const voice_user of Object.keys(data.voice_users)) {
        if (voice_user in state.hosts[this_host].discord_users) {
            var discord_user = state.hosts[this_host].discord_users[voice_user];
            if (discord_user.username in commentator_slots) {
                var box_id = "commentator-box-" + (commentator_slots[discord_user.username] + 1);
                var slot = document.getElementById(box_id);
                if (data.voice_users[voice_user].active) {
                    slot.classList.add("commentator-voice-active");
                } else {
                    slot.classList.remove("commentator-voice-active");
                }
            }
        }
    }
})

setInterval(function() {
    if (state == null) {
        return;
    }

    var event_id = getEventForHost(state, this_host);
    if (event_id == null) {
        return;
    }

    var event = getEventById(state, event_id);

    var timer_element = document.getElementById("timer");
    if (timer_element != null) {
        var time = getEventTimerValue(event);
        timer_element.innerHTML = toStringTime(time, false, true);
    }
}, 100)
