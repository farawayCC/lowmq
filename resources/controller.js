
// --- Variables ---
let token = localStorage.getItem("token");
let isTokenLegit = false
let serviceUrl = window.location.href.replace('/controller', '')
const defaultOptions = { headers: { "authorization": token } }

// --- Functions invocation---
main();

async function main() {
    await verifyToken();
    renderToken();
    await countMessages();
    setInterval(countMessages, 250);
}

// --- Functions ---

async function saveToken() {
    var tokenFromInput = document.getElementById("token").value;
    localStorage.setItem("token", tokenFromInput);
    token = tokenFromInput;
    defaultOptions.headers.authorization = token;

    verifyToken();
}

async function verifyToken() {
    await axios.get(serviceUrl + '/login/verify', { headers: { "authorization": token } })
        .then(() => {
            console.log('Token is legit')
            isTokenLegit = true
        })
        .catch((error) => {
            console.log('Token is not legit', error)
            isTokenLegit = false
        })
        .finally(() => renderToken())
}

function renderToken() {
    if (!token) return

    document.getElementById("current-token").innerHTML = "Current token: " + hideToken(token);

    if (isTokenLegit) {
        document.getElementById("current-token").classList.remove("red")
        document.getElementById("current-token").classList.add("green")
    } else {
        document.getElementById("current-token").classList.remove("green")
        document.getElementById("current-token").classList.add("red")
    }
}


async function addMessage() {
    if (!token) return
    if (!isTokenLegit) return

    const key = document.getElementById("add-msg-key").value;
    const value = document.getElementById("add-msg-value").value;

    await axios.post(
        serviceUrl + '/msg',
        { key: key, value: value },
        defaultOptions)
        .then((message) => {
            delete message.headers
            delete message.config
            delete message.request
            document.getElementById("add-msg-result").innerHTML = 'Response: ' + JSON.stringify(message, null, 2);
            getKeys();
        })
        .catch((error) => {
            console.log('Error on add message', error)
            document.getElementById("add-msg-result").innerHTML = "Error adding message: " + error.response.data + " (" + error.response.status + ")";
        });
}


async function countMessages() {
    if (!token) return
    if (!isTokenLegit) return


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

function hideToken(token) {
    if (!token) return
    if (token.length < 4) return token
    const leaveCount = 1
    // leave only first 2 and 1 last chars. Other chars replace with *
    return token.substring(0, leaveCount) + '*'.repeat(token.length - leaveCount * 2) + token.substring(token.length - 1)
}
