window.addEventListener("load", loadHandler);
const info = document.getElementById("game-container");

function loadHandler() {
    getVals();
}

function performAction(circleId, actionType) {
    $.post('/game/action', {
        circle_id: circleId,
        action_type: actionType
        },
        function(response) {
            console.log("Action result:", response.message);
            // After action + shuffle, reload from server
            //info.innerHTML = response;
            //location.reload();
    });
    getVals();

    // Also send happiness average for point tracking
    const happinessElements = document.querySelectorAll('.character');
    let happinessValues = [];

    happinessElements.forEach(el => {
        const match = el.innerText.match(/\(Happiness: (-?\d+)\)/);
        if (match) {
            happinessValues.push(parseInt(match[1]));
        }
    });

    if (happinessValues.length > 0) {
        const sum = happinessValues.reduce((a, b) => a + b, 0);
        const average = sum / happinessValues.length;

        $.post('/updatePoints', { average }, function(response) {
            console.log(response.message);
        });
    }
}

function resetHappiness() {
    $.post('/resetHappiness', {}, function(response) {
        alert(response.message);
    });
    getVals();
}

function getVals() {
    let xhr = new XMLHttpRequest();
    xhr.addEventListener("load", responseReceivedHandler);
    xhr.responseType = "";
    xhr.open("GET", "/game/values");
    xhr.send();
}

function responseReceivedHandler() {
    //We received something that is healthy
    if (this.status === 200) {
        //Creating a new, empty div
        //Adding the response to this new div
        document.getElementById("game-container").innerHTML = "";
        let newElement = document.createElement("div");
        newElement.innerHTML = this.response;
        document.getElementById("game-container").appendChild(newElement);
        //info.innerHTML = this.response;
        //Appending the div to the subInfo tag
    } else {
        //Handling an unsuccessful database lookup
        //info.innerHTML = "Query error";
    }
}