import {
    connectToSocket,
    getEventTimerValue,
    getEventById, getEventForHost, toStringTime,
    getEventRunners, setInnerHtml,
    getUpcomingEvents, 
} from "./automarathon.js";

var state = null;
const this_host = "main";

var valid_bottom_bar = new Map()
valid_bottom_bar.set("total-donation", true);
valid_bottom_bar.set("next-event", true);
valid_bottom_bar.set("recent-donations", true);
valid_bottom_bar.set("single-incentive-1", true);
valid_bottom_bar.set("single-incentive-2", true);
valid_bottom_bar.set("multi-incentive-1", true);
valid_bottom_bar.set("multi-incentive-2", true);

var next_event = null;
var next_event_2 = null;
var next_event_3 = null;
var this_event = null;

function getRunnerComboName(state, runners, divider) {
    var combo_runners = "";
    for (var i = 0; i < runners.length; i++) {
        if (combo_runners != "") {
            combo_runners += " " + divider + " ";
        }

        combo_runners += state.people[runners[i]].name.toUpperCase();
    }

    return combo_runners;
}

function getCommentatorsOrdered(data, event) {
    var commentators = []
    for (const commentator of event.commentators) {
        var participant = data.people[commentator];
        commentators.push(participant.id)
    }
    return commentators;
}

function setRunState(state, event) {
    var run_info = document.querySelector("run-info");

    if (run_info != null) {
        run_info.game = event.game;
        run_info.category = event.category;
        run_info.platform = event.console;
        run_info.estimate = toStringTime(event.estimate * 1000)

        var runners_info = document.querySelector("name-plates")
        
        if (runner_info != null) {
            var runners = getEventRunners(event)
            
            if (runners.length >= 1) {
                var runner1 = state.people[runners[0]]
                runners_info.runner1 = runner1.name
                runners_info.runner1Pronoun = runner1.pronouns
            }

            if (runners.length >= 2) {
                var runner1 = state.people[runners[1]]
                runners_info.runner2 = runner2.name
                runners_info.runner2Pronoun = runner2.pronouns
            }
        }
    }
    
    var comms_box = document.querySelector("commentator-box");

    if (comms_box != null) {
        var names = []
        var pronouns = []
        var comms = getCommentatorsOrdered(data, event)
        for (var id of comms) {
            var participant = state.people[id]
            names.push(participant.name)
            pronouns.push(participant.pronouns)
        }

        comms_box.commentatorNames = names
        comms_box.commentatorPronouns = pronouns
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
    this_event = event;

    setRunState(data, event);
    setAMBottomBarData(data);
})

var current_bar_id = 0
setInterval(function() {
    if (document.getElementById("bottom-switch") == null) {
        return;
    }

    console.log("valid_bottom_bar", valid_bottom_bar)
    // 0 IS ALWAYS VALID
    var i = 0;
var next_bar_id = 0;
    for (const key of valid_bottom_bar.keys()) {
        if (i > current_bar_id) {
            if (valid_bottom_bar.get(key)) {
                next_bar_id = i;
                break;
            }
        }

        i++;
    }

    current_bar_id = next_bar_id;

    var i = 0;
    for (const key of valid_bottom_bar.keys()) {
        if (i == current_bar_id) {
            document.getElementById(key).classList.add("show");
        } else {
            document.getElementById(key).classList.remove("show");
        }
        i++;
    }

}, 8000)
