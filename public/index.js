document.addEventListener('DOMContentLoaded', () => {
    for (let i = 0; i < localStorage.length; i++) {
        let div = document.createElement("div");
        let localContent = localStorage.getItem(localStorage.key(i));
        div.innerHTML = localContent.substring(1,);
        div.setAttribute("class", "track_array row");
        div.setAttribute("draggable", "false");
        (localContent.charAt(0) == "n") ? div.querySelector(".collapsible_div").style.display = "none" : div.querySelector(".collapsible_div").style.display = "block";
        document.querySelector(".tracking_input").appendChild(div);
    }

    updatePage();

    document.addEventListener('dragover', function(e) { e.preventDefault() });

    let submit = document.querySelector('#submit_button');
    let tracking = document.querySelector('#track_number');
    let edit = document.querySelector('#edit');

    tracking.onkeyup = () => {
        if (tracking.value.length > 0) {
            submit.disabled = false;
        }
        else {
            submit.disabled = true;
        }
    }

    submit.onclick = () => {
        let trackingNum = tracking.value;
        if (localStorage.getItem(trackingNum)) {
            alert("You already added it");
            tracking.value = '';
            submit.disabled = true;
            return false;
        }
        
        findCarrier(trackingNum)

        tracking.value = '';
        submit.disabled = true;
        tracking.focus();
    };

    //toggles draggable and delete buttons
    /*edit.onclick = () => {
        document.querySelectorAll(".track_array").forEach((element) => {
            if (element.getAttribute("draggable") == "true") {
                element.setAttribute("draggable", "false");
            } else {
                element.setAttribute("draggable", "true");
            }
        });
    };*/
});

async function findCarrier(trackingNum, refresh = false) {
    let upsRegex = [/\b(1Z ?[0-9A-Z]{3} ?[0-9A-Z]{3} ?[0-9A-Z]{2} ?[0-9A-Z]{4} ?[0-9A-Z]{3} ?[0-9A-Z]|[\dT]\d\d\d ?\d\d\d\d ?\d\d\d)\b/];
    //[/^(1Z)[0-9A-Z]{16}$/, /^(T)+[0-9A-Z]{10}$/, /^[0-9]{9}$/, /^[0-9]{26}$/];
    let fedexRegex = [/(\b96\d{20}\b)|(\b\d{15}\b)|(\b\d{12}\b)/, /\b((98\d\d\d\d\d?\d\d\d\d|98\d\d) ?\d\d\d\d ?\d\d\d\d( ?\d\d\d)?)\b/, /^[0-9]{15}$/, /^926129\d{16}$/, /^6129\d{16}$/];
    //[/^[0-9]{20}$/, /^[0-9]{15}$/, /^[0-9]{12}$/]/// /^[0-9]{22}$/];
    let uspsRegex = [/(\b\d{30}\b)|(\b91\d+\b)|(\b\d{20}\b)/, /^E\D{1}\d{9}\D{2}$|^9\d{15,21}$/, /^91[0-9]+$/, /^[A-Za-z]{2}[0-9]+US$/];
    //[/^(94|93|92|94|95)[0-9]{20}$/, /^(94|93|92|94|95)[0-9]{22}$/, /^(70|14|23|03)[0-9]{14}$/, /^(M0|82)[0-9]{8}$/, /^([A-Z]{2})[0-9]{9}([A-Z]{2})$/];
    let fetchStr = '';

    upsRegex.forEach(element => {
        if (trackingNum.match(element) != null) {
            fetchStr = 'ups';
            //ups(trackingNum, refresh);
        }
    });

    if (fetchStr == '') {
        fedexRegex.forEach(element => {
            if (trackingNum.match(element) != null) {
                fetchStr = 'fedex';
                //fed(trackingNum, refresh);
            }
        });
    }

    if (fetchStr == '') {
        uspsRegex.forEach(element => {
            if (trackingNum.match(element) != null) {
                fetchStr = 'usps';
                //usps(trackingNum, refresh);
            }
        });
    }

    if (fetchStr == '') {
        alert("Tracking Number Error");
        return;
    }

    let data = {
        trackingNum: trackingNum,
    }
    console.log(fetchStr);
    const options = {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(data)
    };

    try {
        // call correct div creation function
        const response = await fetch(fetchStr + `/${trackingNum}`);
        switch (fetchStr) {
            case "usps":
                const uspsXML = await response.json();
                const parsedUspsXml = (new window.DOMParser()).parseFromString(uspsXML.xml, "text/xml");
                parseUSPS(parsedUspsXml, trackingNum, refresh);
                break;
            case "ups":
                const parsedJson = await response.json();
                parseUPS(parsedJson.package, refresh);
                break;
            case "fedex":
                const fedexXML = await response.json();
                const parsedFedexXml = (new window.DOMParser()).parseFromString(fedexXML.xml, "text/xml");
                parseFedEX(parsedFedexXml, trackingNum, refresh);
                break;
            default:
                break;
        }
    } catch (err) {
        console.log(err);
    }
}

function updatePage() {
    //collapses or expands
    document.querySelectorAll(".collapse_button").forEach((button) => {
        button.onclick = (event) => {
            //based on collapse button
            let grandParent = event.target.parentElement.parentElement;
            let trackingNum = grandParent.firstChild.innerHTML.substring(21,);
            let div = localStorage.getItem(trackingNum);
            if (grandParent.parentElement.parentElement.querySelector(".collapsible_div").hasChildNodes()) {
                if (grandParent.parentElement.parentElement.querySelector(".collapsible_div").style.display == "none") {
                    event.target.classList.remove("bi-plus")
                    event.target.classList.add("bi-dash");
                    grandParent.parentElement.parentElement.querySelector(".collapsible_div").style.display = "block";
                    div = "b" + div.substring(1,);
                    div = div.substring(0, div.indexOf("bi-plus")) + "bi-dash" + div.substring(div.indexOf("bi-plus") + 7,);
                } else {
                    event.target.classList.remove("bi-dash");
                    event.target.classList.add("bi-plus");
                    grandParent.parentElement.parentElement.querySelector(".collapsible_div").style.display = "none";
                    div = "n" + div.substring(1,);
                    div = div.substring(0, div.indexOf("bi-dash")) + "bi-plus" + div.substring(div.indexOf("bi-dash") + 7,);
                }
                localStorage.setItem(trackingNum, div);
            }
        };
    });

    //sends them back
    document.querySelectorAll(".update_button").forEach((button) => {
        button.onclick = (event) => {
            let trackingNum = event.target.parentElement.parentElement.firstChild.innerHTML.substring(21,);
            findCarrier(trackingNum, true);
        };
    });

    document.querySelectorAll(".delete_button").forEach((button) => {
        button.onclick = (event) => {
            let grandParent = event.target.parentElement.parentElement;
            let trackingNum = grandParent.firstChild.innerHTML.substring(21,); 
            console.log(trackingNum);
            grandParent.parentElement.parentElement.parentElement.parentElement.remove();
            localStorage.removeItem(trackingNum);
        };
    });

    const draggables = document.querySelectorAll('.track_array');
    const input = document.querySelector('.tracking_input');

    draggables.forEach(element => { 
        element.addEventListener("dragstart", () => {
            element.classList.add("dragging");
        });

        element.addEventListener("dragend", () => {
            element.classList.remove("dragging");
        });
    });

    input.addEventListener('dragover', e => {
        e.preventDefault();
        //e.clientY is current Y mouse position
        const afterElement = getDragAfterElement(input, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) {
            input.appendChild(draggable);
        } else {
            input.insertBefore(draggable, afterElement);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.track_array:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0  && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

//creates an array using the UPS eleemnts then calls createDiv(array)
function parseUPS(package, refresh) {
    const UPSArray = [package.trackingNumber, package.deliveryDate[0].date.substring(0,4) + "-" + package.deliveryDate[0].date.substring(4,6) + "-" + package.deliveryDate[0].date.substring(6,)];
    const objArray = [];
    package.activity.forEach((element, index) => {
        let date = element.date.substring(0,4) + "-" + element.date.substring(4, 6) + "-" + element.date.substring(6,);
        let time = element.time.substring(0,2) + ":" + element.time.substring(2, 4);
        let location = "";
        let addressArray = [element.location.address.city, element.location.address.stateProvince, element.location.address.postalCode, element.location.address.country];
        let boolArray = [element.location.address.city != "" ? true : false, element.location.address.stateProvince != "" ? true : false, element.location.address.postalCode != "" ? true : false, element.location.address.country != "" ? true : false];

        for (let i = 0; i < addressArray.length; i++) {
            if (boolArray[i]) {
                location == "" ? location += addressArray[i] : location += ", " + addressArray[i];
            }
        }

        let trackSummary = {
            location: location,
            description: element.status.description,
            date: date,
            time: time
        };

        objArray.push(trackSummary);
    });
    UPSArray.push(objArray);
    createDiv(UPSArray, refresh);
}

function parseDHL(shipment, refresh) {
    const DHLArray = [shipment.id, "Expected Delivery Date"];
    const objArray = [];
    "2020-12-07T21:30:00"
    objArray.push({
        location: shipment.status.location.address.addressLocality,
        description: shipment.status.description,
        date: shipment.status.timestamp,
        time: shipment.status.timestamp,
    })

    shipment.events.forEach((element) => {
        let date = element.timestamp;
        let time = element.timestamp;
        let location = element.location.address.addressLocality;
        let description = element.description;

        let trackSummary = {
            location: location,
            description: description,
            date: date,
            time: time
        };

        objArray.push(trackSummaryu);
    });

    DHLArray.push(objArray);
    createDive(DHLArray, refresh);
    /*
        shipment.id = tracking number
        shipment.service = service
        shipment.status.timestamp = current time stamp
        shipment.status.location.address.addressLocality =  current lcoation "MILAN- ITALY"
        shipment.status.description = current description
        shipment.events (array).timestamp/location/address.addressLocality/description...*/
}

//creates an array from FedEx's XML and calls createDiv
function parseFedEX(result, trackingNum, refresh) {
    console.log(result);
    //tracking, scheduled delivery date, [{location, description, date, time}, ...]
    const events = result.getElementsByTagName("Events")[0];
    const fedExArray = [trackingNum];
    const location = events.getElementsByTagName("City")[0].childNodes[0].nodeValue + ", " + events.getElementsByTagName("StateOrProvinceCode")[0].childNodes[0].nodeValue + ", " + events.getElementsByTagName("CountryCode")[0].childNodes[0].nodeValue;
    const timeDate = events.getElementsByTagName("Timestamp")[0].childNodes[0].nodeValue;
    if (result.getElementsByTagName("ServiceCommitMessage")[0].childNodes[0].nodeValue != "No scheduled delivery date available at this time.") {
        console.log(result.getElementsByTagName("ServiceCommitMessage")[0].childNodes[0].nodeValue);
        console.log(vents.getElementsByTagName("Timestamp")[0].childNodes[0].nodeValue);
    } else {
        console.log("No scheduled delivery date available at this time.");
    }

    //will need to turn this into an array later...
    let trackSummary = [{
        location: location,
        description: events.getElementsByTagName("EventDescription")[0].childNodes[0].nodeValue,
        date: timeDate.substring(11, 16),
        time: timeDate.substring(0, 10)
    }];
    fedExArray.push(result.getElementsByTagName("DateOrTimestamp")[0].childNodes[0].nodeValue);
    fedExArray.push(trackSummary)
    createDiv(fedExArray, refresh);
}

function parseUSPS(result, trackingNum, refresh) {
    //tracking, scheduled delivery date, [Object(location, description, date, time)]
    const uspsArray = [trackingNum];
    const trackArray = [];
    const city = result.getElementsByTagName("EventCity");
    const state = result.getElementsByTagName("EventState");
    const country = result.getElementsByTagName("EventCountry");
    const zipCode = result.getElementsByTagName("EventZIPCode");
    const expectedDeliveryDate = result.getElementsByTagName("ExpectedDeliveryDate");
    if (expectedDeliveryDate != null && expectedDeliveryDate.results != null && expectedDeliveryDate.results.length > 0) {
        uspsArray.push(result.getElementsByTagName("ExpectedDeliveryDate")[0].childNodes[0].nodeValue);
    } else {
        uspsArray.push("");
    }
    //loop over every tracksummary and track detail to find
    for (let i = 0; i < city.length; i++) {
        let addressArray = [city[i].childNodes, state[i].childNodes, zipCode[i].childNOdes, country[i].childNodes];
        let location = "";
        let event = result.getElementsByTagName("Event")[i].childNodes[0].nodeValue;
        let date = result.getElementsByTagName("EventDate")[i].childNodes[0].nodeValue;
        let time = (result.getElementsByTagName("EventTime")[i].childNodes.length != 0) ? result.getElementsByTagName("EventTime")[i].childNodes[0].nodeValue : "";
        
        //sets location
        for (let i = 0; i < addressArray.length; i++) {
            if (addressArray[i] != undefined && addressArray[i].length != 0) {
                location == "" ? location += addressArray[i][0].nodeValue : location += ", " + addressArray[i][0].nodeValue;
            }
        }

        //creates a track summary object
        let trackSummary = {
            location: location,
            description: event,
            date: getNumDate(date),
            time: getTime(time)
        };
        trackArray.push(trackSummary);
    }
    uspsArray.push(trackArray);
    createDiv(uspsArray, refresh);
}

//returns a YYY/MM/DD format
function getNumDate(date) {
    let length = date.length;
    let day = date.substring(length - 8, length - 6);
    let year = date.substring(length - 4,);
    let letterMonth = date.substring(0, length - 9);
    let numMonth = "";
    switch (letterMonth.toLowerCase()) {
        case "january":
            numMonth = "01";
            break;
        case "february":
            numMonth = "02";
            break;
        case "march":
            numMonth = "03";
            break;
        case "april":
            numMonth = "04";
            break;
        case "may":
            numMonth = "05";
            break;
        case "june":
            numMonth = "06";
            break;
        case "july":
            numMonth = "07";
            break;
        case "august":
            numMonth = "08";
            break;
        case "september":
            numMonth = "09";
            break;
        case "october":
            numMonth = "10";
            break;
        case "november":
            numMonth = "11";
            break;
        case "december":
            numMonth = "12";
            break;
        default:
            numMonth = "";
    }
    return year + "-" + numMonth + "-" + day;
}

//returns a 24 hour time
function getTime(time) {
    let length = time.length;
    let period = time.substring(length - 2,);
    let hour = "";
    let minute = "";
    //if length is 7 it does not have a leading number
    if (length == 7) {
        hour = "0" + time.charAt(0);
        minute = time.substring(2, 4);
        if (period.toLowerCase() == "pm") {
            hour = String(Number(hour) + 12);
        }
    } else if (length ==  8) {
        hour = time.substring(0, 2);
        minute = time.substring(3, 5);
    } else {
        hour = "00";
        minute = "00";
    }
    return hour + ":" + minute;
}

//creates a div with h1 elements containing the package information (tracking number, scheduled delivery, last activity)
function createDiv(detailArray, refresh) {
    //tracking, scheduled delivery date, [{location, description, date, time}, ...]
    //row div
    const divHolder = document.createElement('div');
    const colDiv = document.createElement('div');
    const cardDiv = document.createElement("div");
    const cardHeaderDiv = document.createElement("div");
    const rowDiv = document.createElement("div");
    const trackingNumDiv = document.createElement("div");
    const deliveryDiv = document.createElement("div");
    const buttonDiv = document.createElement("div");

    const strArray = [];
    let trackingNum = "";

    //creating HTML elements
    const title = document.createElement('input');
    const deleteButton = document.createElement('button');
    const collapseButton = document.createElement('button');
    const updateButton = document.createElement('button');
    //list items
    const collapseUl = document.createElement('ul');
    let numOfTrack = document.querySelectorAll('.track_array').length;
    divHolder.setAttribute("class", "track_array row");
    colDiv.className = "col-12";
    cardDiv.setAttribute("class", "card mx-auto");
    cardHeaderDiv.className = "card-header";
    rowDiv.className = "row";
    trackingNumDiv.setAttribute("class", "col-4 tracking_num");
    deliveryDiv.className = "col-4";
    buttonDiv.className = "col-4";
    buttonDiv.style.textAlign = "right";

    //creating and styling the collapse button floating to top right
    title.setAttribute("type", "text");
    title.setAttribute("placeholder", "Enter a Title Here");
    title.setAttribute("id", "setTitle");
    title.innerHTML = "Enter Title Here";

    collapseUl.setAttribute("class", "collapsible_div list-group list-group-flush");
    collapseButton.setAttribute("class", "collapse_button btn btn-success bi bi-plus");
    updateButton.setAttribute("class", "update_button btn btn-warning bi-arrow-counterclockwise");
    deleteButton.setAttribute("class", "delete_button btn btn-danger bi bi-trash");
    if (detailArray[2].length != 1) {
        buttonDiv.appendChild(collapseButton);
    }
    buttonDiv.appendChild(updateButton);
    buttonDiv.appendChild(deleteButton);


    //adds
    detailArray.forEach((element, index) => {
        switch (index) {
            case 0:
                trackingNumDiv.innerHTML = "Tracking Number: <br>" + element + "";
                trackingNum = element;
                rowDiv.append(trackingNumDiv);
                break;
            case 1:
                deliveryDiv.innerHTML = "Scheduled Delivery Date: <br>" + element + "";
                rowDiv.append(deliveryDiv);
                break;
            case 2:
                break;
            default:
                console.log("broke");
        }
    });

    rowDiv.append(buttonDiv);
    cardHeaderDiv.appendChild(rowDiv);
    //cardDiv.appendChild(title);
    cardDiv.appendChild(cardHeaderDiv);

    detailArray[2].forEach((element, index) => {
        let str = ""
        strArray.push(document.createElement("li"));
        str = (element.time != "") ? element.time : "";
        str += (element.date != "") ? " " + element.date : "";
        str += (element.location != "") ? "\t" + element.location : "";
        if (element.location != "") {
            str += (element.description != "") ?  ", " + element.description  : "";
        } else {
            str += (element.description != "") ?  " " + element.description  : "";
        }
        strArray[index].innerHTML = str;
        strArray[index].style.margin = "0";
        strArray[index].setAttribute("class", "list-group-item");
        index != 0 ? collapseUl.appendChild(strArray[index]) : cardDiv.appendChild(strArray[index]);
    });
    collapseUl.style.display = "none";
    cardDiv.appendChild(collapseUl);
    colDiv.appendChild(cardDiv);
    divHolder.appendChild(colDiv);

    divHolder.setAttribute("draggable", "false");

    //if the user clicked the refresh button append every row to the parent track_array
    if (refresh) {
        localStorage.removeItem(trackingNum);
        document.querySelectorAll(".track_array").forEach((element) => {
            element.querySelectorAll(".row").forEach((e) => {
                if (e.firstChild.innerHTML.substring(17,) == trackingNum){
                    element.parentElement.replaceChild(divHolder, element);
                }
            });
        });
        localStorage.setItem(trackingNum, "n" + divHolder.innerHTML);
    } else {
        if (numOfTrack === 0) {
            document.querySelector('.tracking_input').append(divHolder);
        } else {
            document.querySelector('.tracking_input').insertBefore(divHolder, document.querySelector(".droppable_div"));
        }
        localStorage.setItem(trackingNum, "n" +  divHolder.innerHTML);
    }
    updatePage();
}

