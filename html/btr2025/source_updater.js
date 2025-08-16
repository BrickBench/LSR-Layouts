function updateAutomarathon(automarathon_json) {
    console.log(automarathon_json);
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
            var active_comms = stream.active_commentators.split(";");
            var disabled_comms = stream.ignored_commentators.split(",");

            var commentators_str = "";
            var commentator_list = [];
            for (const commentator of active_comms) {
                if (disabled_comms.includes(commentator)) {
                    continue;
                }
                commentator_list.push(commentator);
            }

            if (document.getElementById("commentary") != null) {
                setNames(commentator_list);
            }

            runners = []
            for (const runner of Object.values(event.runner_state)) {
                var runner_name = automarathon_json.runners[runner.runner].name; 
                var runner_time = "99:99:99";

                if (runner.result != null) {
                    runner_time = runner.result["SingleScore"]["score"];
                }

                runners.push([runner_name, runner_time])
            }

            runners.sort(function (a, b) {
                if (a[1] == "--:--:--" && b[1] != "--:--:--") {
                    return 1;
                } else if (a[1] != "--:--:--" && b[1] == "--:--:--") {
                    return -1;
                } else if (a[1] == b[1]) {
                    return a[0].localeCompare(b[0]);
                } else {
                    return a[1].localeCompare(b[1])
                }
            });

            for (const [idx, runner] of runners.entries()) {
                var good_idx = idx + 1;
                if (document.getElementById("runner-" + good_idx + "-name") != null) {
                    document.getElementById("runner-" + good_idx + "-name").innerHTML = good_idx + ": " + runner[0];
                    document.getElementById("runner-" + good_idx + "-time").innerHTML = runner[1];
                } 

                if (document.getElementById("runner-" + good_idx + "-name-time") != null) {
                    var indicator = good_idx + "th";
                    if (good_idx == 1) {
                        indicator = "1st";
                    } else if (good_idx == 2) {
                        indicator = "2nd";
                    } else if (good_idx == 3) {
                        indicator = "3rd";
                    }

                    document.getElementById("runner-" + good_idx + "-name-time").innerHTML = indicator + ". " + runner[0] + ": &nbsp;&nbsp;&nbsp;" + runner[1];
                    console.log("runner-" + good_idx + "-name-time" + ". " + indicator + ": " + runner[0] + ": " + runner[1]);
                }
            }
        }
    }
}

function resize2fit(el) {
  console
  if (!el.parentElement) return;
  el.style.setProperty("--font-size", "1em");
  const {width: max_width, height: max_height} = el.getBoundingClientRect();
  const {width, height} = el.children[0].getBoundingClientRect();
  el.style.setProperty("--font-size", Math.min(max_width/width, max_height/height)+"em");
}

function approxLength(name){
  let count = 0;
  for (let i = 0; i < name.length; i++) {
    if (name[i] == '1' || name[i] == 'I') {
      count+= 0.6;
    }else if (name[i] == '(' || name[i] == ')') {
      count+= 0.8;
    }else{
	count++;
    }
  }
	return count;
}

function setNames(names){
	names = names.map((name)=>{return name.replace('_', '')});
	names.sort((a, b) => approxLength(b) - approxLength(a));
	
	for(var i=0;i<names.length-1;i++){
		let name1 = names[i];
		let name2 = names[i+1];
		if(Math.abs(approxLength(name1)-approxLength(name2))<=3 && (Math.random() < 0.5)){
			let temp = names[i];
			names[i] = names[i+1];
			names[i+1] = temp;
		}
	}

	let em = 2.85;
	const emperchar = 0.115;
	const targetheight = 198;
	const targetwidth = 245;

	var list = document.getElementById("commentary");
	list.innerHTML = "";
	list.style.fontSize = em.toString()+"rem";

	list.style.paddingLeft = "5px";
	
	var numNames = 0;
	var largestWidth = -1;
	var dlength = 0;
	for(var name of names){
		const elem = document.createElement("div");
		elem.innerHTML = name.toUpperCase();
		elem.style.width = "fit-content";
		list.appendChild(elem);
		console.log("width",elem.clientWidth);
		if(largestWidth < elem.clientWidth){
			largestWidth = elem.clientWidth;
			dlength = approxLength(name);
		}
		numNames++;
	}
	console.log("Targ",targetwidth,largestWidth);
	console.log(largestWidth,numNames);

	let diff3 = 0;
	
	if(largestWidth > targetwidth){
		let diff = (largestWidth-targetwidth)/dlength;
		em -= (emperchar * diff);
		diff3 = (emperchar * diff);
		console.log("changed",em);
	}
	list.style.fontSize = em.toString()+"rem";

	var children2 = list.children;
		for (var i = 0; i < children2.length; i++) {
  			var divChild = children2[i];
			console.log("Width2",targetwidth,divChild.clientWidth);
		}

	let bumpdown = -1;
	if(numNames <= 2 && diff3 != 0){
		bumpdown = diff3 * 10;
	}	

	
	console.log(list.clientHeight);
	if(list.clientHeight > targetheight){
		em -= ((list.clientHeight-targetheight) * 0.053)/numNames;
		list.style.fontSize = em.toString()+"rem";
	}
	if(list.clientHeight < targetheight){
		let padding = 0.0035 * (targetheight-list.clientHeight)/numNames;
		padding = Math.min(0.45,padding);
		var children = list.children;
		for (var i = 0; i < children.length; i++) {
  			var divChild = children[i];
			if(bumpdown != -1 && i == 0){
				divChild.style.paddingTop=bumpdown.toString()+"px";
			}
			if(i != 0){
				divChild.style.paddingTop=padding.toString()+"rem";
			}
		}
	}
	
	console.log(list.clientHeight);
}

function connect () {
    const socket = new WebSocket('ws://10.10.0.221:28010/ws');
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
