var timer = 0;
var startDate = null;
var actualEnd = null;

var goal_incentive_template = `
<div class="d-flex flex-row align-items-center justify-content-evenly" style="height: 100px; width:100%">
    <div class="p-2 ps-4 text-center align-items-center" style="font-size: 35px" > NAME </div>
    <div class="ps-4 flex-fill align-items-center">
        <div class="progress" role="progressbar" aria-valuenow="PERCENT" aria-valuemin="0" aria-valuemax="100" style="height: 40px">
            <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: PERCENT%"></div>
        </div>
    </div>
    <div class="ps-2 text-center align-items-center" style="width: 20%; font-size: 35px"> $AMOUNT / $GOAL </div>
</div>
`

var competition_base_template = `
<div class="d-flex flex-row align-items-center justify-content-evenly" style="height:100%; width:100%">
    <div class="p-1 text-center align-self-center blue-bg top-border left-border right-border bottom-border" style="font-size:30px; width:40%">NAME</div>
    ENTRIES
</div>
`

var competition_entry_template = `
<div class="d-flex flex-column">
    <div class="text-center option-text">
        OPTION
    </div>
    <div class="text-center cost-text">
        $AMOUNT
    </div>
</div>
`

var visible_incentives = Array(false, true, false)

var default_video = "./videos/1 LIJ1.mp4";
var videos_map = new Map();
videos_map.set("LEGO Indiana Jones: The Original Adventures", "./videos/1 LIJ1.mp4");
videos_map.set("LEGO Jurassic World", "./videos/2 LJW.mp4");
videos_map.set("LEGO Racers", "./videos/3 Racers.mp4");
videos_map.set("LEGO City Undercover", "./videos/4 Racers.mp4");
videos_map.set("LEGO City Forest Raceway", "./videos/5 LCFR.mp4");
videos_map.set("LEGO Star Wars: The Video Game", "./videos/6 LSW1 GBA.mp4");
videos_map.set("The LEGO Movie Videogame", "./videos/7 LM1.mp4");
videos_map.set("LEGO Marvel Super Heroes", "./videos/8 LMSH.mp4");
videos_map.set("Star Wars Advent Calendar", "./videos/9 SWAC.mp4");
videos_map.set("LEGO Pirates Of The Caribbean: The Video Game", "./videos/23 1-4.mp4");
videos_map.set("LEGO Harry Potter: Years 5-7", "./videos/11 5-7.mp4");
videos_map.set("LEGO Harry Potter: The Battle for Hogwarts", "./videos/13 BFH.mp4");
videos_map.set("LEGO Island", "./videos/14 LI.mp4");
videos_map.set("LEGO Star Wars: The Complete Saga", "./videos/15 + 20 + 29 TCS PC_DS.mp4");
videos_map.set("LEGO Batman 3: Beyond Gotham", "./videos/16 LB3.mp4");
videos_map.set("LEGO Star Wars II: The Original Trilogy", "./videos/12 + 17 LSW2.mp4");
videos_map.set("Lego Movie 2", "./videos/18 LIES.mp4");
videos_map.set("LEGO The Lord of the Rings", "./videos/22 lotr.mp4");
videos_map.set("LEGO Harry Potter: Years 1-4", "./videos/23 1-4.mp4");
videos_map.set("Galidor: Defenders of the Outer Dimension", "./videos/24 Galidor.mp4");
videos_map.set("LEGO Marvel Super Heroes 2", "./videos/25 LMSH2.mp4");
videos_map.set("LEGO Batman: The Videogame", "./videos/26 LB1 DS.mp4");
videos_map.set("Bionicle", "./videos/27 Bionicle.mp4");
videos_map.set("LEGO The Hobbit", "./videos/28 LTH.mp4");
videos_map.set("LEGO Funky Dots", "./videos/30 LFD.mp4");

function toTime(totalMillis, showDecimal=false, precision=2) {
    const millis = Math.floor(totalMillis%1000);
    const totalSeconds = Math.floor(totalMillis / 1000)
    const totalMinutes = Math.floor(totalSeconds / 60);

    const seconds = totalSeconds % 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    var timeOut = "";
    if(hours > 0){
        timeOut += hours.toString().padStart(2,'0') + ":";
    }else{
        timeOut += hours.toString().padStart(2,'0') + ":";
    }

    if(hours == 0 && minutes == 0){
        timeOut += "00:";
    }else if (hours > 0 && minutes == 0){
        timeOut += "00:";
    }else if(minutes > 0){
        timeOut += minutes.toString().padStart(2,'0') + ":";
    }

    if(seconds > 0){
        timeOut += seconds.toString().padStart(2,'0');
    }else if (hours > 0 || minutes > 0){
        timeOut += "00";
    }else{
        timeOut += "00";
    }

    if(showDecimal){
        timeOut += "." + (millis.toString().padStart(precision, '0').substring(0,precision));
    }

    return timeOut;
}

function updateDonations(donations_json) {
    document.getElementById("donation-total").innerHTML = "$" + donations_json["sumDonations"];
    document.getElementById("goal-amount").innerHTML = "$" + Math.ceil(donations_json["fundraisingGoal"]);

    var donation_percents = Math.ceil((donations_json["sumDonations"] / donations_json["fundraisingGoal"]) * 100);
    console.log(donation_percents);
    document.getElementById("donation-bar")["aria-valuenow"] = donation_percents;
    document.getElementById("donation-progress").style.width = donation_percents + "%";
    
}

function updateDonor(donor, i) {
    if (donor != null) {
        const donor_split = donor.split("/");
        if (donor_split[0] != null && donor_split[1] != null) {
            document.getElementById("donor-" + i + "-name").innerHTML = donor_split[0];
            document.getElementById("donor-" + i + "-amount").innerHTML = "$" + donor_split[1];
        }
    } else {
        document.getElementById("donor-" + i + "-name").innerHTML = "";
        document.getElementById("donor-" + i + "-amount").innerHTML = "";
    }
}

function updateIncentive(incentive, i) {
    if (incentive != null) {
        const incentive_split = incentive.split("/");
        if (incentive_split[0] != null && incentive_split[1] != null) {
            if (incentive_split.length > 3) {
                var name = incentive_split[0];

                var entries = "";
                for (var j = 1; j < incentive_split.length; j = j + 2) {
                    var option = incentive_split[j];
                    var amount = incentive_split[j + 1];
                    var entries = entries + competition_entry_template.replace("OPTION", option).replace("AMOUNT", amount);
                }

                var new_competition = competition_base_template.replace("NAME", name).replace("ENTRIES", entries);
                document.getElementById("incentive-" + i).innerHTML = new_competition;
                visible_incentives[i - 1] = true;
            } else {
                var name = incentive_split[0];
                var amount = incentive_split[1];
                var goal = incentive_split[2];
                var percent = (amount / goal) * 100;
                var new_incentive = goal_incentive_template.replace("NAME", name).replace("AMOUNT", amount).replace("GOAL", goal).replaceAll("PERCENT", percent);
                document.getElementById("incentive-" + i).innerHTML = new_incentive;
                visible_incentives[i - 1] = true;
            }
        } else {
            visible_incentives[i - 1] = false;
        }
    } else {
        visible_incentives[i - 1] = false;
    }
}

function updateAutomarathon(automarathon_json) {
    updateIncentive(automarathon_json.custom_fields["incentive-1"], 1);
    updateIncentive(automarathon_json.custom_fields["incentive-2"], 2);
    updateIncentive(automarathon_json.custom_fields["incentive-3"], 3);
    updateDonor(automarathon_json.custom_fields["donor-1"], 1);
    updateDonor(automarathon_json.custom_fields["donor-2"], 2);
    updateDonor(automarathon_json.custom_fields["donor-3"], 3);

    if (automarathon_json.streams.length != 0) {
        var stream = automarathon_json.streams[0];
        var event_id = stream.event;
        var event = null;

        for (const e of automarathon_json.events) {
            if (e.id == event_id) {
                event = e;
                break;
            }
        }

        if (event != null) {
            if (event.timer_start_time != null) {
                startDate = new Date(event.timer_start_time);
            } else {
                startDate = null;
            }

            if (event.timer_end_time != null) {
                actualEnd = new Date(event.timer_end_time);
            } else {
                actualEnd = null;
            }

            var title_item = document.getElementById("game-title");
            if (event.game != null && title_item != null) {
                title_item.innerHTML = event.game;
            }

            var details = "";

            if (event.category != null) {
                details = event.category;
            }

            if (event.console != null) {
                details = details + " | " + event.console;
            }

            if (event.estimate != null) {
                details = details + " | est. " + toTime(event.estimate * 1000, false);
            } else {
                details = details + " | est. --:--:--";
            }

            if (document.getElementById("game-details") != null) {
                document.getElementById("game-details").innerHTML = details;
            }

            for (const [index, runner] of Object.entries(stream.stream_runners)) {
                var element = document.getElementById("runner-" + index);
                if (element != null) {
                    element.innerHTML = automarathon_json.runners[runner].name;
                }
            }

            var active_comms = stream.active_commentators.split(";");
            var disabled_comms = stream.ignored_commentators.split(",");

            var commentators_str = "";
            for (const commentator of active_comms) {
                if (disabled_comms.includes(commentator)) {
                    continue;
                }
                commentators_str += commentator + " ";
            }

            if (document.getElementById("commentary") != null) {
                document.getElementById("commentary").innerHTML = commentators_str;
            }
        }
    }

    var current_millis = Date.now();
    var most_recent = automarathon_json["events"][0];
    var most_recent_diff = Infinity;

    for (const event of automarathon_json["events"]) {
        if (event.hasOwnProperty("event_start_time") && event["event_start_time"] != null) {
            var diff = event.event_start_time - current_millis;
            if (diff > 0 && diff < most_recent_diff) {
                most_recent = event;
                most_recent_diff = diff;
            }
        }
    }

    var runners_str = "";
    for (const runner of Object.values(most_recent.runner_state)) {
        runners_str += automarathon_json.runners[runner.runner].name + " & ";
    }
    runners_str = runners_str.slice(0, -2);
    runners_str += ":";

    var event_time_left = "";
    if (most_recent_diff == Infinity || most_recent_diff < 0) {
        event_time_left = "Soon";
    } else {
        var minutes = Math.floor(most_recent_diff / 60000);
        var hours = minutes / 60;
        
        if (hours < 1) {
            if (minutes <= 1) {
                event_time_left = "in 1 minute";
            } else {
                event_time_left = "in " + Math.ceil(minutes) + " minutes";
            }
        } else {
            if (hours < 2) {
                event_time_left = "in 1 hour";
            } else {
                event_time_left = "in " + Math.floor(hours) + " hours" ;
            }
        }
    }

    document.getElementById("next-runner-time").innerHTML = event_time_left;
    document.getElementById("next-runner-name").innerHTML = runners_str;
    document.getElementById("next-runner-game").innerHTML =  most_recent["game"];

    var vid_src = document.getElementById("inter-vid");
    if (vid_src != null) {
        var vid = default_video;
        if (videos_map.has(event.game)) {
            vid = videos_map.get(event.game);
        }

        if (vid_src.src != vid) {
            vid_src.src = vid;
        }
    }
}

var donation_link_base = "https://extralife.donordrive.com/api/participants/532270"
var donation_link_donations = "https://extralife.donordrive.com/api/participants/532270/donations"

$( document ).ready(function() {
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

function connect () {
    const socket = new WebSocket('ws://localhost:28010/ws');
    socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        updateAutomarathon(data);
    });

    socket.onclose = function (event) {
        setTimeout(function() {
            connect();
        }, 5000);
    }

    socket.onerror = function (event) {
        ws.close();
        setTimeout(function() {
            connect();
        }, 5000);
    }
}

connect();


var titleCarouselDOM  = document.getElementById('title-carousel');
var dataCarouselDOM  = document.getElementById('data-carousel');

var titleCarousel = bootstrap.Carousel.getOrCreateInstance(titleCarouselDOM)
var dataCarousel = bootstrap.Carousel.getOrCreateInstance(dataCarouselDOM);

var i = 0;

$( document ).ready(function() {
    setInterval(function() {
        i = i + 1;
        if (i > 5) {
            i = 0;
        }

        while (i > 0 && i < 4) {
            var incentive_index = i - 1;
            if (visible_incentives[incentive_index]) {
                break;
            } else {
               i = i + 1; 
            }
        }

        titleCarousel.to(i);
        dataCarousel.to(i);
    }, 5000);
});
    
$( document ).ready(function() {
    setInterval(function() {
        if (document.getElementById("main-timer") == null) return;
        if (startDate == null) {
            document.getElementById("main-timer").innerHTML = toTime(0);
        } else {
            var endDate = actualEnd == null ? new Date() : actualEnd;
            var timer = (endDate.getTime() - startDate.getTime());
            document.getElementById("main-timer").innerHTML = toTime(timer);
        }
    }, 500);
});
