import {
    connectToStateStream, connectToVoiceStream,
    getEventById, getEventForHost, getStreamById
} from "./automarathon.js";

const this_host = "main";

var state = null;
var commentator_slots = {}

connectToStateStream(function(data) {
    state = data;

    var event_id = getEventForHost(data, this_host);

    if (event_id == null) {
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
