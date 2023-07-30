
// --- Variables ---
const token = localStorage.getItem("token");
let serviceUrl = window.location.href.replace('/controller', '')
const defaultOptions = { headers: { "authorization": token } }

// --- Functions invocation---
renderToken();
countMessages();
setInterval(countMessages, 250);

// --- Functions ---

function saveToken() {
    var token = document.getElementById("token").value;
    localStorage.setItem("token", token);
    alert("Token saved");
    window.location.reload();
}

function renderToken() {
    if (!token) return

    document.getElementById("token").value = token;
    document.getElementById("current-token").innerHTML = "Current token: " + token;
}


async function addMessage() {
    if (!token) return

    const key = document.getElementById("add-msg-key").value;
    const value = document.getElementById("add-msg-value").value;

    await axios.post(
        serviceUrl + '/msg',
        { key: key, value: value },
        defaultOptions)
        .then((message) => {
            document.getElementById("add-msg-result").innerHTML = JSON.stringify(message, null, 2);
            getKeys();
        })
        .catch((error) => {
            console.log('Error on add message', error)
            document.getElementById("add-msg-result").innerHTML = "Error adding message: " + error.response.data + " (" + error.response.status + ")";
        });
}


async function countMessages() {
    if (!token) return


    await axios.get(serviceUrl + '/msg/count', { headers: { "authorization": token } })
        .then(response => response.data)
        .then((count) => {
            document.getElementById("count-msg-result").innerHTML = JSON.stringify(count, null, 2);
        })
        .catch((error) => {
            console.log('Error on count messages', error)
            document.getElementById("count-msg-result").innerHTML = "Error counting messages: " + error.response.data + " (" + error.response.status + ")";
        });
}
