import {
    connectToStateStream, connectToVoiceStream,
    getStreamById,
    getEventById, getEventForHost, toStringTime,
    getEventRunners, getOrderedStreamRunners
} from "./automarathon.js";

const this_host = "main";
const live_row_count = 4;

var state = null;
var commentator_slots = {}


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
            if (split_data.splits.length == 36) {
                var times = {}
                // iterate over all 36 levels
                for (var i = 0; i < 36; i++) {
                    if (split_data.splits[i].split_time != null) {
                        times[i] = split_data.splits[i].split_time;
                    }
                }

                split_times[runner] = times;
            } //otherwise splits are weird, can't compare
        }
    }

    var runner_splits_deltas = {};
    for (var i = 0; i < 36; i++) {
        // find fastest runner for this split
        var fastest_runner = -1;
        var fastest_time = 10000000000;
        for (const [runner, runner_splits] of split_times) {
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

            for (const [runner, runner_splits] of split_times) {
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

function displayLiveDeltas(stream, splits) {
    var last_split = -1;
    for (var row_index = 0; row_index < 36; row_index++) {
        if (row_index in splits) {
            last_split = row_index;
        }
    }

    var first_split_to_show = Math.max(0, (last_split - live_row_count) + 1);

    for (var row_index = 0; row_index < live_row_count; row_index++) {
        var split_index = first_split_to_show + row_index;
        document.getElementById("label-split-" + row_index).innerHTML = getSplitName(split_index);

        if (split_index in splits) {
            var split_data = splits[split_index];
            var runners = getOrderedStreamRunners(stream)

            for (const [runner_idx, runner] of runners.entries()) {
                var runner_split = split_data[runner];
                var time_element = document.getElementById("runner-" + runner_idx + "-split-" + row_index);
                var delta_element = document.getElementById("runner-" + runner_idx + "-delta-" + row_index);
                if (runner_split.time == null) {
                    time_element.innerHTML = "--"
                } else {
                    time_element.innerHTML = toStringTime(runner_split.time, showDecimal = true)
                }

                if (runner_split.delta == null) {
                    delta_element.innerHTML = ""
                } else {
                    delta_element.innerHTML = toStringTime(runner_split.delta)
                }
            }

        } else {
            for (var runner = 0; runner < 3; runner++) {
                document.getElementById("runner-" + runner + "-split-" + row_index).innerHTML = "--";
                document.getElementById("runner-" + runner + "-delta-" + row_index).innerHTML = "";
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

    console.log("event", event);
    console.log("host", host);
    console.log("participants", data.people);

    var i = 1;
    for (const commentator of event.commentators) {
        var participant = data.people[commentator];
        commentator_slots[commentator] = i;

        document.getElementById("commentator-box-" + i).innerHTML = participant.name;

        i++;
        if (i > 4) {
            break;
        }
    }

    if (document.getElementById("data-table") != null) {
        // has live data
        const splitData = determineSplitInfo(data.splits, event);
        displayLiveDeltas(stream, splitData);
    }

})

connectToVoiceStream(function(data) {
    if (data == null) {
        return;
    }

    for (const voice_user of Object.keys(data.voice_users)) {
        if (voice_user in state.hosts[this_host].discord_users) {
            var discord_user = state.hosts[this_host].discord_users[voice_user];
            if (discord_user.participant in commentator_slots) {
                var slot = document.getElementById("commentator-box-" + commentator_slots[discord_user.participant]);
                if (data.voice_users[voice_user].active) {
                    slot.style.boxShadow = "0px 0px 10px 5px rgba(0, 255, 0, 0.5)";
                } else {
                    slot.style.boxShadow = "";
                }
            }
        }
    }
})
