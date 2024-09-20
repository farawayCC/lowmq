import { Request, Response } from 'express'
import LowDB from '../helpers/localDB/index.js'
import { freezeMessage as freezeMessageFn, isMessageFrozen, makeNewMessage } from '../helpers/messageUtils.js'
import config from '../config.js'
import { sendProblemDetails } from '../helpers/http/problemDetails.js'

class ProblemDetailsTypes {
    static readonly noKeyProvided = 'no-key-provided'
    static readonly noValueProvided = 'no-value-provided'

    static readonly noMessagesFound = 'no-messages-found'

    static readonly invalidFreezeTime = 'invalid-freeze-time'
    static readonly invaildPayload = 'invalid-payload'
}

export const getKeys = (req: Request, res: Response) => {
    const db = LowDB.getDB()
    const keys = Object.keys(db.data.messages)
    res.send(keys)
}

export const getMessage = (req: Request, res: Response) => {
    const { key, deleteAfterRead } = req.query
    if (typeof key !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.noKeyProvided, 400, 'No key provided',
            'Expected string key in query parameter, got: ' + key)
    const toDelete = deleteAfterRead === 'true' || req.query.toDelete === 'true' || req.query.delete === 'true'

    const db = LowDB.getDB()
    const messages = db.data.messages[key]

    if (!messages || messages.length === 0)
        return res.sendStatus(204)

    const activeMessages = messages.filter(m => !isMessageFrozen(m))
    if (activeMessages.length === 0)
        return res.sendStatus(204)

    const randomIndex = Math.floor(Math.random() * activeMessages.length)
    let message = activeMessages[randomIndex]
    message = freezeMessageFn(message)

    if (toDelete) {
        db.data.messages[key] = messages.filter(m => m._id !== message._id)
        if (db.data.messages[key]?.length === 0)
            delete db.data.messages[key]
    }

    db.write()
    res.send(message)
}

export const postMessage = (req: Request, res: Response) => {
    // Check types like in getMessage
    const { key, value } = req.body
    if (typeof key !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.noKeyProvided, 400, 'No key provided',
            'Expected string key in payload, got: ' + key)
    if (value === undefined)
        return sendProblemDetails(res, ProblemDetailsTypes.noValueProvided, 400, 'No value provided',
            'Expected value in payload, got: ' + value)

    const freezeTime = typeof req.query.freezeTimeMin === 'string'
        ? parseInt(req.query.freezeTimeMin)
        : config.messageFreezeTimeMinutes

    if (isNaN(freezeTime))
        return sendProblemDetails(res, ProblemDetailsTypes.invalidFreezeTime, 400, 'Invalid freeze time',
            'Expected number in query parameter freezeTimeMin, got: ' + req.query.freezeTimeMin)

    const db = LowDB.getDB()
    const messages = db.data.messages

    if (!messages[key])
        messages[key] = []

    const newMessage = makeNewMessage(key, value, freezeTime)
    messages[key].push(newMessage)

    db.write()
    res.send(newMessage)
}

export const updateMessage = (req: Request, res: Response) => {
    const { key, newValue, id } = req.body
    if (typeof id !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload',
            'Expected string id in payload, got: ' + id)
    if (typeof key !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload',
            'Expected string key in payload, got: ' + key)
    if (newValue === undefined)
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload',
            'Expected value in payload, got: ' + newValue)

    const db = LowDB.getDB()
    const messages = db.data.messages

    if (!messages[key])
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No messages found',
            'No messages found for key: ' + key)

    const message = messages[key].find(m => m._id === id)
    if (!message)
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No message found',
            'No message found with id: ' + id)

    message.value = newValue
    db.write()
    res.send(message)
}

export const freezeMessage = (req: Request, res: Response) => {
    const { key, id } = req.body
    if (typeof id !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload',
            'Expected string id in payload, got: ' + id)
    if (typeof key !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload',
            'Expected string key in payload, got: ' + key)

    const db = LowDB.getDB()
    const messages = db.data.messages

    if (!messages[key])
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No messages found',
            'No messages found for key: ' + key)

    const message = messages[key].find(m => m._id === id)
    if (!message)
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No message found',
            'No message found with id: ' + id)

    const frozenMessage = freezeMessageFn(message)
    db.write()
    res.send(frozenMessage)
}

export const unfreezeMessage = (req: Request, res: Response) => {
    const { key, id, all } = req.body

    if (typeof key !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload',
            'Expected string key in payload, got: ' + key)

    const db = LowDB.getDB()
    const messages = db.data.messages

    if (!messages[key])
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No messages found',
            'No messages found for key: ' + key)

    let message
    if (typeof id === 'string') {
        // Unfreeze a specific message
        message = messages[key].find(m => m._id === id)
        if (!message)
            return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No message found',
                'No message found with id: ' + id)
    } else if (all === true || all === 'true') {
        // Unfreeze all messages for key
        messages[key].forEach(m => m.frozenTo = new Date(0))
        message = messages[key][0] // Hacky way to return a message
    } else {
        // Unfreeze first message
        const frozenMessages = messages[key].filter(m => isMessageFrozen(m))
        if (frozenMessages.length === 0)
            return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No active messages',
                'No active messages found for key: ' + key)

        message = frozenMessages[0]
    }

    message.frozenTo = new Date(0)
    db.write()
    res.send(message)
}

export const deleteMessage = (req: Request, res: Response) => {
    const { key, id } = req.body
    if (typeof id !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload',
            'Expected string id in payload, got: ' + id)
    if (typeof key !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload',
            'Expected string key in payload, got: ' + key)

    const db = LowDB.getDB()
    const messages = db.data.messages

    if (!messages[key])
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No messages found',
            'No messages found for key: ' + key)

    const messageIndex = messages[key].findIndex(m => m._id === id)
    if (messageIndex === -1)
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No message found',
            'No message found with id: ' + id)

    const deletedMessage = messages[key].splice(messageIndex, 1)[0]
    db.write()
    res.send(deletedMessage)
}

export const countMessages = (req: Request, res: Response) => {
    const db = LowDB.getDB()

    const counts: { [key: string]: number } = {}
    for (const [key, messages] of Object.entries(db.data.messages)) {
        counts[key] = messages?.length || 0
    }

    res.send(counts)
}
