import {connectToSocket, getEventForHost, toStringTime, getEventTimerValue, getEventById} from '../../../../js/automarathon.js'
import { LitElement, html, css, nothing } from 'https://esm.run/lit';
import {classMap} from 'https://esm.run/lit/directives/class-map.js';

class RunTimer extends LitElement {
    static properties = {
        startTime: {type: Number},
        endTime: {type: Number},
        pauseTime: {type: Number}
    };

    constructor() {
    }
    
    render() {}
}


