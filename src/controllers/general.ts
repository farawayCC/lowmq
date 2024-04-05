import { Request, Response } from 'express';
import {
    freezeMessage,
    isMessageFrozen,
    newMessage,
} from '../helpers/messageUtils.js';
import LowDB from '../helpers/localDB/index.js';
import config, { Message, rootPath } from '../config.js';
import { join } from 'path'
import fs from 'fs/promises'


export const getKeys = (req: Request, res: Response) => {
    const db = LowDB.getDB();
    if (!db.data)
        return res.status(500).send('DB not initialized');

    if (!db.data.messages)
        return res.status(404).send('No messages found');

    const keys = Object.keys(db.data.messages)
    res.send(keys);
}


export const getMessage = (req: Request, res: Response) => {
    //TODO: add get by _id
    const query = req.query;
    if (!query.key)
        return res.status(400).send('No key provided as query for GET message request');

    const db = LowDB.getDB();

    // Get messages for query key
    const qk: string = query.key as string;
    let messagesForQuery = db.data.messages[qk]
    if (!messagesForQuery || messagesForQuery.length === 0)
        return res.status(404).send('No messages found');

    // Get messages that are not frozen
    const activeMessages = messagesForQuery.filter((m: Message) => !isMessageFrozen(m))
    if (activeMessages.length === 0)
        return res.status(404).send('No messages found');

    // Get random message
    const msgRandomIndex = Math.floor(Math.random() * activeMessages.length);
    let msg = activeMessages[msgRandomIndex];
    msg = freezeMessage(msg)

    // Delete the message if query parameter deleteAfterRead is true
    const toDelete = query.deleteAfterRead === 'true' || query.toDelete === 'true' || query.delete === 'true';
    if (toDelete) {
        messagesForQuery = messagesForQuery.filter((m: Message) => m._id !== msg._id)
        // Remove the key if there are no more messages
        if (messagesForQuery.length === 0)
            delete db.data.messages[qk]
    }

    db.write()
    res.send(msg);
}


export const postMessage = (req: Request, res: Response) => {
    const { key, value } = req.body
    if (!key)
        return res.status(400).send('No Key provided in payload for GET message request')
    if (!value)
        return res.status(400).send('No Value provided in payload for GET message request')

    const freezeTime = typeof req.query.freezeTimeMin === 'string'
        ? parseInt(req.query.freezeTimeMin)
        : config.messageFreezeTimeMinutes

    if (isNaN(freezeTime))
        return res.status(400).send('Invalid freezeTimeMin provided in query for POST message request')

    const db = LowDB.getDB();

    const allMessages = db.data.messages
    if (!allMessages[key])
        allMessages[key] = []

    const message = newMessage(key, value, freezeTime)
    allMessages[key]?.push(message)

    db.write()

    res.send(message);
}

/**
 * Find and update message. For simplicity, replaces current message value with new one
 */
export const updateMessage = (req: Request, res: Response) => {
    const { key, id, newValue } = req.body

    if (!key)
        return res.status(400).send('No key provided')
    if (!id)
        return res.status(400).send('No id provided')
    if (!newValue)
        return res.status(400).send('No newValue provided')

    const db = LowDB.getDB();
    if (!db.data)
        return res.status(500).send('DB not initialized. Contact admin')

    if (!db.data.messages)
        db.data.messages = {}

    const messages = db.data.messages[key]
    if (!messages)
        return res.status(500).send("Collection for key doesn't exist")

    const targetMessage = messages.find(msg => msg._id === id)
    if (!targetMessage)
        return res.status(404).send("Message not found")
    targetMessage.value = newValue

    db.write()

    res.send(targetMessage);
}


export const deleteMessage = (req: Request, res: Response) => {
    const query = req.query;
    const key: string = query.key as string;
    const _id: string = query._id as string || query.id as string;

    if (!key)
        return res.status(400).send('No Key provided as query for GET message request')
    if (!_id)
        return res.status(400).send('No ID provided as query for GET message request')

    const db = LowDB.getDB();

    if (!db.data)
        return res.status(500).send('DB not initialized. Contact admin')

    if (!db.data.messages)
        return res.status(404).send('No messages found. Messages are empty')

    const messages = db.data.messages[key]
    if (!messages)
        return res.status(404).send(`No messages found for key: ${key}`)

    let messageIndex = -1
    messages.forEach(message => {
        if (message._id === _id)
            messageIndex = messages.indexOf(message)
    });
    if (messageIndex === -1)
        return res.status(404).send(`No messages found for _id: ${_id}`)

    const deletedMessages = messages.splice(messageIndex, 1)

    // Remove the key if there are no more messages
    if (messages.length === 0)
        delete db.data.messages[key]

    db.write()
    res.send(deletedMessages);
}


/**
 * Counts the number of messages for each key
 */
export const countMessages = (req: Request, res: Response) => {
    const db = LowDB.getDB();

    const counts: { [key: string]: number } = {}
    for (const [key, messages] of Object.entries(db.data.messages)) {
        counts[key] = messages?.length || 0
    }

    res.send(counts);
}


export const helpInfo = async (req: Request, res: Response) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'help.html')
        let helpHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8')
        helpHTMLContent = helpHTMLContent.replace(/'Authorization: token woof'/g,
            `Authorization: token ${config.defaultPassword}`)
        res.send(helpHTMLContent)
    } catch (error) {
        res.status(500).send('Error reading help.html file')
    }
}


export const controllerHtml = async (req: Request, res: Response) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'controller.html')
        let controllerHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8')
        res.send(controllerHTMLContent)
    } catch (error) {
        res.status(500).send('Error reading controller.html file')
    }
}

export const controllerJs = async (req: Request, res: Response) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'controller.js')
        let helpHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8')
        res.send(helpHTMLContent)
    } catch (error) {
        res.status(500).send('Error reading controller.js file')
    }
}

export const freezeMessageController = async (req: Request, res: Response) => {
    try {
        const { key, id } = req.query
        if (!key || typeof key !== 'string' || !id) return res.status(400).send("Invalid key or id")

        const db = LowDB.getDB()
        db.read()

        if (!db.data) return res.status(500).send("DB is empty")

        const messages = db.data.messages[key]
        if (!messages) return res.status(404).send(`No messages found for key: ${key}`)

        const index = messages.findIndex(msg => msg._id === id)
        if (index === -1) return res.status(404).send(`No messages found for _id: ${id}`)

        const frozenMessage = freezeMessage(messages[index])
        messages[index] = frozenMessage
        db.write()

        res.json(messages[index])
    } catch (e) {
        res.status(500).send((e as Error)?.message || 'Freeze message error')
    }
}
