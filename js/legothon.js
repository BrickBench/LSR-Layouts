import {
    connectToSocket,
    getStreamById, getEventTimerValue,
    getEventById, getEventForHost, toStringTime,
    getEventRunners, setInnerHtml,
    getUpcomingEvents, getRunnersByTime,
    getRunnerScore, compareTime
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
var this_event = null;

function setRunState(state, event) {
    var runners = getEventRunners(event);
    var combo_runners = ""
    var combo_pronouns = ""

    for (var i = 0; i < runners.length; i++) {
        var participant = state.people[runners[i]];
        setInnerHtml("runner-" + i, participant.name.toUpperCase());
        setInnerHtml("runner-" + i + "-pronoun", participant.pronouns.toLowerCase());

        if (combo_runners != "") {
            combo_runners += " / ";
        }

        if (combo_pronouns != "") {
            combo_pronouns += " / ";
        }

        combo_runners += participant.name;
        combo_pronouns += participant.pronouns;
    }

    setInnerHtml("runner-combo", combo_runners);
    setInnerHtml("runner-combo-pronoun", combo_pronouns);

    setInnerHtml("game-name", event.game);

    var subtitle = event.category + " | " + event.console + " | " + toStringTime(event.estimate * 1000);
    setInnerHtml("game-subtitle", subtitle);

    if (event.commentators.length == 0) {

    } else if (event.commentators.length == 1) {
        var comm1 = state.people[event.commentators[0]];
        var host_name = state.custom_fields["host-name"];
        var host_pronouns = state.custom_fields["host-pronouns"];

        setInnerHtml("comm1", comm1.name.toUpperCase());
        setInnerHtml("comm2", "[HOST] " + host_name.toUpperCase());
        setInnerHtml("comm-pronoun", comm1.pronouns.toLowerCase() + " / " + host_pronouns.toLowerCase());
    } else {
        var comm1 = state.people[event.commentators[0]];
        var comm2 = state.people[event.commentators[1]];

        setInnerHtml("comm1", comm1.name.toUpperCase());
        setInnerHtml("comm2", comm2.name.toUpperCase());
        setInnerHtml("comm-pronoun", comm1.pronouns.toLowerCase() + " / " + comm2.pronouns.toLowerCase());
    }

    var time = getEventTimerValue(event);
    setInnerHtml("time", toStringTime(time, false, true));
}

function setBarValue(id, value, max) {
    var bar = document.getElementById(id);
    console.log("Setting bar value", id, value, max)
    if (bar) {
        var percentage = Math.min(100, (value / max) * 100);
        bar.style.width = percentage + "%";
        bar.setAttribute("aria-valuenow", percentage);
    }
}

function setIncentive(incentive_text, single, count) {
    if (single) {
        var text = incentive_text.split(";");
        if (text.length != 4) {
            return false;
        }

        var amount = parseInt(text[2].trim());
        var target = parseInt(text[3].trim());
        if (isNaN(amount)) {
            return false
        }


        if (isNaN(target)) {
            return false
        }

        setInnerHtml("single-incentive-" + count + "-game", text[0].trim());
        setInnerHtml("single-incentive-" + count + "-incentive", "<i>" + text[1].trim() + "</i>");

        setInnerHtml(
            "single-incentive-" + count + "-amount",
            "$" + amount + "/$" + target
        )

        setBarValue("single-incentive-" + count + "-bar", amount, target);

        return true;
    } else {
        var text = incentive_text.split(";");
        if (text.length < 4 || text.length % 2 != 0) {
            return false;
        }

        setInnerHtml("multi-incentive-" + count + "-game", text[0].trim());
        setInnerHtml("multi-incentive-" + count + "-incentive", "<i>" + text[1].trim() + "</i>");

        var item_texts = []

        for (var item = 2; item < text.length; item = item + 2) {
            var name = text[item].trim();
            var amount = parseInt(text[item + 1].trim());

            console.log("name", name, "amount", amount)

            if (isNaN(amount)) {
                return false;
            }

            item_texts.push(
                '<div class="multi-incentive-item" style="width: 33%"><span>' + name + '</span><span><i>$' + amount + '</i></span></div>'
            )
        }

        var final_text = '<div class="carousel-item active" data-bs-interval="8000"><div class="multi-incentive-flow">'

        for (var i = 0; i < item_texts.length; i++) {
            if (i % 3 == 0 && i != 0) {
                final_text += '</div></div><div class="carousel-item" data-bs-interval="8000"><div class="multi-incentive-flow">';
            }
            final_text += item_texts[i];
        }

        final_text += '</div></div>';

        setInnerHtml("multi-incentive-" + count + "-carousel", final_text);
        return true;
    }
}

function setAMBottomBarData(state) {
    var next_events = getUpcomingEvents(state);

    if (next_events.length > 0) {
        valid_bottom_bar.set("next-event", true);
        next_event = next_events[0];
        setInnerHtml("up-next-game", next_event.game);
        setInnerHtml("up-next-category", "<i>" + next_event.category + "</i>");

        setInnerHtml("up-next-time", next_event.game);
    } else {
        valid_bottom_bar.set("next-event", false);
    }

    var cf = state.custom_fields;

    var recent_donations = [];

    for (var i = 0; i < 4; i++) {
        var donation = cf["donation-" + (i + 1)];

        var split = donation.split(";");
        if (split.length >= 2) {
            var name = split[0].trim();
            var amount = split[1].trim();

            if (amount != "" && name != "") {
                setInnerHtml("dono-" + (i + 1) + "-name", name.toUpperCase());
                setInnerHtml("dono-" + (i + 1) + "-amount", amount);
                recent_donations.push({
                    amount: amount,
                    name: name
                });
            }
        }
    }

    valid_bottom_bar.set("recent-donations", recent_donations.length == 4);
    valid_bottom_bar.set("single-incentive-1", setIncentive(cf["single-incentive-1"], true, 1));
    valid_bottom_bar.set("single-incentive-2", setIncentive(cf["single-incentive-2"], true, 2));
    valid_bottom_bar.set("multi-incentive-1", setIncentive(cf["multi-incentive-1"], false, 1));
    valid_bottom_bar.set("multi-incentive-2", setIncentive(cf["multi-incentive-2"], false, 2));
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

var donation_link_base = "https://extralife.donordrive.com/api/participants/550942"

function updateDonations(data) {
    setInnerHtml(
        "dono-amount",
        "$" + data["sumDonations"] + "/$" + Math.ceil(data["fundraisingGoal"])
    )
    setInnerHtml(
        "donation-total",
        "$" + data["sumDonations"]
    )

    setBarValue("dono-bar", data["sumDonations"], data["fundraisingGoal"]);
}

$.ajax({
    url: donation_link_base,
    dataType: 'json',
    success: function(data) {
        updateDonations(data);
    }
});
$(document).ready(function() {
    setInterval(function() {
        $.ajax({
            url: donation_link_base,
            dataType: 'json',
            success: function(data) {
                updateDonations(data);
            }
        });
    }, 30000);
});

setInterval(function() {
    if (this_event != null) {
        var time = getEventTimerValue(this_event);
        setInnerHtml("timer", toStringTime(time, false, true));
    }


    if (next_event != null) {
        let time = next_event.event_start_time ? next_event.event_start_time - Date.now() : undefined;
        var text = "COMING SOON"
        if (time) {
            var mins = time / (1000 * 60);
            if (mins > 2) {
                if (mins < 60) {
                    text = "IN " + mins + " MINUTES";
                } else if (mins < 120) {
                    text = "IN 1 HOUR";
                } else {
                    text = "IN " + Math.floor(mins / 60) + " HOURS";
                }
            }

            setInnerHtml("up-next-time", text);
        }
    }
}, 100)

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
