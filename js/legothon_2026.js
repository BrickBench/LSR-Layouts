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
        
        if (runners_info != null) {
            var runners = getEventRunners(event)
            
            if (runners.length == 1) {
                var runner1 = state.people[runners[0]]
                runners_info.runner1 = runner1.name
                runners_info.runner1Pronoun = runner1.pronouns
                runners_info.runner2 = null
                runners_info.runner2Pronoun = null
            } else if (runners.length >= 2) {
                var runner2 = state.people[runners[1]]
                runners_info.runner2 = runner2.name
                runners_info.runner2Pronoun = runner2.pronouns
            }
        }
    }
    
    var comms_box = document.querySelector("commentator-box");

    if (comms_box != null) {
        var names = []
        var pronouns = []
        var comms = getCommentatorsOrdered(state, event)
        for (var id of comms) {
            var participant = state.people[id]
            names.push(participant.name)
            pronouns.push(participant.pronouns)
        }

        if (comms.length < 2) {
            var host = state.custom_fields["host:person"]
            names.push(state.people[host].name + " (Host)")
            pronouns.push(state.people[host].pronouns)
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

    let timer_element = document.querySelector("event-timer");
    if (timer_element != null) {
        var time = getEventTimerValue(event);
        var time_string = toStringTime(time, false, true, false);
        timer_element.time = time_string;
    }
}, 100)
