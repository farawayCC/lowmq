import { Request, Response } from 'express';
import {
    freezeMessage,
    isMessageFrozen,
    newMessage,
} from '../helpers/messageUtils.js';
import initLowDB from '../helpers/localDB/index.js';
import config, { Message, rootPath } from '../config.js';
import { join } from 'path'
import fs from 'fs/promises'


export const getMessage = async (req: Request, res: Response) => {
    //TODO: add get by _id
    const query = req.query;
    if (!query.key)
        return res.status(400).send('No key provided as query for GET message request');

    // init db
    const db = await initLowDB();
    if (!db.data)
        return res.status(500).send('DB not initialized');

    if (!db.data.messages)
        return res.status(404).send('No messages found');


    // Get messages for query key
    const qk: string = query.key as string;
    const messagesForQuery = db.data.messages[qk] || []
    if (messagesForQuery.length === 0)
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
        db.data.messages[qk] = messagesForQuery.filter((m: Message) => m._id !== msg._id)
        // Remove the key if there are no more messages
        if (db.data.messages[qk].length === 0)
            delete db.data.messages[qk]
    }

    await db.write()
    res.send(msg);
}

export const postMessage = async (req: Request, res: Response) => {
    const { key, value } = req.body
    if (!key)
        return res.status(400).send('No Key provided in payload for GET message request')
    if (!value)
        return res.status(400).send('No Value provided in payload for GET message request')

    const freezeTime = typeof req.query.freezeTimeMin === 'string'
        ? parseInt(req.query.freezeTimeMin)
        : config.messageFreezeTimeMinutes

    const lowDB = await initLowDB()
    const dbData = lowDB.data
    if (!dbData)
        return res.status(500).send('DB not initialized. Contact admin')

    if (!dbData.messages || !dbData.messages[key]) {
        dbData.messages = {}
        dbData.messages[key] = []
    }

    const message = newMessage(key, value, freezeTime)
    dbData.messages[key].push(message)

    await lowDB.write()

    res.send(message);
}

export const deleteMessage = async (req: Request, res: Response) => {
    const query = req.query;
    const key: string = query.key as string;
    const _id: string = query._id as string || query.id as string;

    if (!key)
        return res.status(400).send('No Key provided as query for GET message request')
    if (!_id)
        return res.status(400).send('No ID provided as query for GET message request')

    const lowDB = await initLowDB()
    const dbData = lowDB.data

    if (!dbData)
        return res.status(500).send('DB not initialized. Contact admin')

    if (!dbData.messages)
        return res.status(404).send('No messages found. Messages are empty')

    if (!dbData.messages[key])
        return res.status(404).send(`No messages found for key: ${key}`)

    let messageIndex = -1
    dbData.messages[key].forEach(message => {
        if (message._id === _id)
            messageIndex = dbData.messages[key].indexOf(message)
    });
    if (messageIndex === -1)
        return res.status(404).send(`No messages found for _id: ${_id}`)

    const deletedMessages = dbData.messages[key].splice(messageIndex, 1)

    await lowDB.write()
    res.send(deletedMessages);
}

export const helpInfo = async (req: Request, res: Response) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'help.html')
        let helpHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8')
        helpHTMLContent = helpHTMLContent.replaceAll('Authorization: token woof', `Authorization: token ${config.defaultPassword}`)
        res.send(helpHTMLContent)
    } catch (error) {
        console.log("🚀 ~ file: general.ts ~ line 123 ~ helpInfo ~ error", error)
        res.status(500).send('Error reading help.html file')
    }
}
