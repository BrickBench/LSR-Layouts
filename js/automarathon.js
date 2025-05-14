const host = "ws://localhost:28010";

export function connectToStateStream(onData) {
    const socket = new WebSocket(host + '/ws');
    socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        onData(data);
    });

    socket.onclose = function(_event) {
        setTimeout(function() {
            connectToStateStream(onData);
        }, 5000);
    }

    socket.onerror = function(_event) {
        socket.close();
        setTimeout(function() {
            connectToStateStream(onData);
        }, 5000);
    }
}

export function connectToVoiceStream(onData) {
    const socket = new WebSocket(host + '/ws/voice');
    socket.addEventListener("message", (voice) => {
        const data = JSON.parse(voice.data);
        onData(data);
    });

    socket.onclose = function(_event) {
        setTimeout(function() {
            connectToVoiceStream(onData);
        }, 5000);
    }

    socket.onerror = function(_event) {
        socket.close();
        setTimeout(function() {
            connectToVoiceStream(onData);
        }, 5000);
    }
}

/**
 * Return the next upcoming event, or null if there are no events upcoming.
 */
export function getNextEvent(stateData) {
    var current_millis = Date.now();
    var most_recent = null;
    var most_recent_diff = Infinity;

    for (const event of stateData["events"]) {
        if (event.hasOwnProperty("event_start_time") && event["event_start_time"] != null) {
            var diff = event.event_start_time - current_millis;
            if (diff > 0 && diff < most_recent_diff) {
                most_recent = event;
                most_recent_diff = diff;
            }
        }
    }

    return most_recent;
}

/**
 * Return the IDs of the runners present in the provided event.
 */
export function getEventRunners(event) {
    var runners = []
    for (const runner of Object.keys(event.runner_state)) {
        runners.push(runner);
    }

    return runners;
}

/**
 * Return the IDs of the provided stream runners in order
 * of appearance.
 */
export function getOrderedStreamRunners(stream) {
    var keys = Object.keys(stream.stream_runners);
    keys.sort();
    return keys.map((k) => stream.stream_runners[k]);
}

export function getEventById(stateData, eventId) {
    for (const event of stateData.events) {
        if (event.id == eventId) {
            return event;
        }
    }

    return null;
}

export function getStreamById(stateData, eventId) {
    for (const stream of stateData.streams) {
        if (stream.event == eventId) {
            return stream;
        }
    }

    return null;
}

export function getEventForHost(stateData, host) {
    for (const stream of stateData.streams) {
        if (stream.obs_host == host) {
            return stream.event;
        }
    }

    return null;
}

/**
 * Return the provided event's timer's elapsed time in milliseconds.
 */
export function getEventTimerValue(event) {
    if (event.timer_start_time == null) {
        return 0;
    } else {
        var start = event.timer_start_time;
        var end = event.timer_end_time;
        if (end == null) {
            end = new Date().getTime();
        }

        console.log("time", end - start)
        return end - start;
    }
}

export function toStringTime(totalMillis, forceHours = false, forceMinutes = false, showDecimal = false, precision = 2) {
    const millis = Math.floor(totalMillis % 1000);
    const totalSeconds = Math.floor(totalMillis / 1000)
    const totalMinutes = Math.floor(totalSeconds / 60);

    const hours = Math.floor(totalMinutes / 60);
    const seconds = totalSeconds % 60;
    const minutes = totalMinutes % 60;

    var timeOut = "";
    if (hours > 0 || forceHours) {
        timeOut += hours.toString().padStart(2, '0') + ":";
    }

    if (hours > 0 || minutes > 0 || forceHours || forceMinutes) {
        timeOut += minutes.toString().padStart(2, '0') + ":";
    }

    timeOut += seconds.toString().padStart(2, '0');

    if (showDecimal) {
        timeOut += "." + (millis.toString().padStart(precision, '0').substring(0, precision));
    }

    return timeOut;
}
