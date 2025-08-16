import {
    connectToSocket,
    getStreamById, getEventTimerValue,
    getEventById, getEventForHost, toStringTime,
    getEventRunners, setInnerHtml, getOrderedStreamRunners,
    getUpcomingEvents, getRunnersByTime,
    getRunnerScore, compareTime, getCommentators
} from "./automarathon.js";

var state = null;
const this_host = "main";

var commentator_slots = {}

function setRunState(state, stream) {
    var runners = getOrderedStreamRunners(stream);
    for (var i = 0; i < runners.length; i++) {
        var participant = state.people[runners[i]];
        setInnerHtml("runner-" + (i + 1) + "-name", participant.name.toUpperCase());
    }
}

function setEventTimes(state, event) {
    var times = getRunnersByTime(event, true)
    console.log("times", times)

    for (var i = 0; i < 8; i++) {
        var runner = state.people[times[i].id];
        setInnerHtml("runner-time-name-" + (i + 1), runner.name);
        setInnerHtml("runner-time-time-" + (i + 1), times[i].time);
    }
}

function setCommentators(state, event) {
    var commentator_str = ""
    var commentators = getCommentators(state, event, true, true, this_host);
    commentator_slots = {};
    console.log("commentators", commentators)

    for (var i = 0; i < commentators.length; i++) {
        var name = ""
        if (commentators[i].participant == null) {
            name = commentators[i].discord
        } else {
            name = state.people[commentators[i].participant].name;
        }
        commentator_str +=
            `
<div class="comm-item">
    <object class="mic-icon" data="mic.svg"></object>
    <span id="commentator-box-${i}" class="comm-name">${name}</span>
</div>`

        commentator_slots[commentators[i].discord] = i;
    }
    setInnerHtml("commentators", commentator_str);
}

connectToSocket('/ws', function(data) {
    state = data;
    console.log("state", state)

    var event_id = getEventForHost(data, this_host);
    if (event_id == null) {
        return;
    }

    var event = getEventById(data, event_id);
    var stream = getStreamById(data, event_id);

    setRunState(data, stream);
    setEventTimes(data, event);
    setCommentators(data, event);
})

connectToSocket('/ws/voice', function(data) {
    if (data == null) {
        return;
    }

    for (const voice_user of Object.keys(data.voice_users)) {
        if (voice_user in state.hosts[this_host].discord_users) {
            var discord_user = state.hosts[this_host].discord_users[voice_user];
            console.log("discord_user", discord_user);
            if (discord_user.username in commentator_slots) {
                var box_id = "commentator-box-" + commentator_slots[discord_user.username];
                var slot = document.getElementById(box_id);
                if (slot != null) {
                    if (data.voice_users[voice_user].active) {
                        slot.classList.add("voice-active");
                        slot.classList.add("mic-icon-active");
                    } else {
                        slot.classList.remove("voice-active");
                        slot.classList.remove("mic-icon-active");
                    }
                }
            }
        }
    }
})
