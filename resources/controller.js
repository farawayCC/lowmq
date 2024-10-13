
// --- Variables ---
let token = localStorage.getItem("token")
let isTokenLegit = false
let serviceUrl = window.location.href.replace('/controller', '')
const defaultOptions = { headers: { "authorization": token } }

// --- Functions invocation---
main()

async function main() {
    await verifyToken()
    renderToken()
    await countMessages()
    setInterval(countMessages, 250)
    await receiveVersion()
}

// --- Functions ---

async function saveToken() {
    var tokenFromInput = document.getElementById("token").value
    localStorage.setItem("token", tokenFromInput)
    token = tokenFromInput
    defaultOptions.headers.authorization = token

    verifyToken()
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

    document.getElementById("current-token").innerHTML = "Current token: " + hideToken(token)

    if (isTokenLegit) {
        document.getElementById("current-token").classList.remove("red")
        document.getElementById("current-token").classList.add("green")
    } else {
        document.getElementById("current-token").classList.remove("green")
        document.getElementById("current-token").classList.add("red")
    }
}

async function receiveVersion() {
    await axios.get(serviceUrl + '/version', defaultOptions)
        .then(response => response.data)
        .then((version) => {
            document.getElementById("version").innerHTML = "Version: " + version
        })
        .catch((error) => {
            console.log('Error on receive version', error)
            document.getElementById("version").innerHTML = "Error receiving version: " + error.response.data + " (" + error.response.status + ")"
        })
}


// Disabling eslint for the following function because it is used in the HTML file
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function addMessage() {
    if (!token) return
    if (!isTokenLegit) return

    const key = document.getElementById("add-msg-key").value
    let value = document.getElementById("add-msg-value").value

    try {
        value = JSON.parse(value)
    } catch (error) {
        document.getElementById("add-msg-result").innerHTML = "Value must be a valid JSON."
        return
    }

    await axios.post(
        serviceUrl + '/msg',
        { key: key, value: value },
        defaultOptions)
        .then((message) => {
            delete message.headers
            delete message.config
            delete message.request
            document.getElementById("add-msg-result").innerHTML = 'Response: ' + JSON.stringify(message, null, 2)
            getKeys()
        })
        .catch((error) => {
            console.log('Error on add message', error)
            document.getElementById("add-msg-result").innerHTML = "Error adding message: " + error.response.data + " (" + error.response.status + ")"
        })
}


async function getMessage() {
    if (!token) return
    if (!isTokenLegit) return

    const key = document.getElementById("get-msg-key").value

    await axios.get(serviceUrl + '/msg', { headers: { "authorization": token }, params: { key: key } })
        .then(response => response.data)
        .then((message) => {
            document.getElementById("get-msg-result").innerHTML = 'Response: ' + JSON.stringify(message, null, 2)
        })
        .catch((error) => {
            console.log('Error on get message', error)
            document.getElementById("get-msg-result").innerHTML = "Error getting message: " + error.response.data.title + " (" + error.response.status + ")"
        })
}


async function countMessages() {
    if (!token) return
    if (!isTokenLegit) return


    await axios.get(serviceUrl + '/msg/count', { headers: { "authorization": token } })
        .then(response => response.data)
        .then((countObject) => {
            const newData = JSON.stringify(countObject, null, 2)
            if (document.getElementById("count-msg-result").innerHTML != newData)
                document.getElementById("count-msg-result").innerHTML = newData
        })
        .catch((error) => {
            console.log('Error on count messages', error)
            document.getElementById("count-msg-result").innerHTML = "Error counting messages: " + error.response.data + " (" + error.response.status + ")"
        })
}

// Fetch all messages and populate the dropdown
async function getAllMessages() {
    if (!token) return
    if (!isTokenLegit) return

    await axios.get(serviceUrl + '/msg/all', defaultOptions)
        .then(response => response.data)
        .then((messages) => {
            const messageList = document.getElementById("message-list")
            messageList.innerHTML = '' // Clear the list before adding new options
            for (const [key, messageArray] of Object.entries(messages)) {
                messageArray.forEach(message => {
                    const option = document.createElement("option")
                    option.value = JSON.stringify({ key: key, id: message._id, value: message.value })
                    option.text = `${key}: ${JSON.stringify(message.value)}`
                    messageList.appendChild(option)
                })
            }
        })
        .catch((error) => {
            console.log('Error on getting all messages', error)
            document.getElementById("all-msg-result").innerHTML = "Error getting messages: " + error.response.data + " (" + error.response.status + ")"
        })
}

// Handle message selection from dropdown
function selectMessage() {
    const selectedMessage = document.getElementById("message-list").value
    if (!selectedMessage) return

    const message = JSON.parse(selectedMessage)
    document.getElementById("edit-msg-id").value = message.id
    document.getElementById("edit-msg-key").value = message.key
    document.getElementById("edit-msg-value").value = JSON.stringify(message.value, null, 2)
}

// Update a message with the new key and value
async function updateMessage() {
    const id = document.getElementById("edit-msg-id").value
    const key = document.getElementById("edit-msg-key").value
    let newValue = document.getElementById("edit-msg-value").value

    // newValue to json
    try {
        newValue = JSON.parse(newValue)
    } catch (error) {
        document.getElementById("edit-msg-result").innerHTML = "New value must be a valid JSON."
        return
    }

    if (!id || !key || !newValue) {
        document.getElementById("edit-msg-result").innerHTML = "All fields are required."
        return
    }

    await axios.put(serviceUrl + '/msg', { id, key, newValue }, defaultOptions)
        .then(response => response.data)
        .then((updatedMessage) => {
            document.getElementById("edit-msg-result").innerHTML = "Message updated: " + JSON.stringify(updatedMessage, null, 2)
            getAllMessages() // Refresh the list after update
        })
        .catch((error) => {
            console.log('Error on updating message', error)
            document.getElementById("edit-msg-result").innerHTML = "Error updating message: " + error.response.data + " (" + error.response.status + ")"
        })
}

/**
 * Converts a token to a hidden format. Does not hide tokens with less than 2 characters.
 * Hides the token only visually, does not change the actual token.
 * @param {*} token The token to convert 
 * @returns The token in C***CC format, limited to 3+3 characters
 */
function hideToken(token) {
    if (!token) return
    if (token.length < 2) return token

    const firstChar = token.charAt(0)
    const lastChar = token.charAt(token.length - 1)
    const middle = '***'

    return firstChar + middle + lastChar
}
