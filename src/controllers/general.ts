import { Request, Response } from 'express';
import {
    freezeMessage,
    isMessageFrozen,
    newMessage,
} from '../helpers/messageUtils.js';
import initLowDB from '../helpers/localDB/index.js';
import { Message } from '../config.js';


export const getMessage = async (req: Request, res: Response) => {
    const query = req.query;
    if (!query.key)
        return res.status(400).send('No key provided');

    // init db
    const db = await initLowDB();
    if (!db.data) {
        return res.status(500).send('DB not initialized');
    }

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

    await db.write()
    res.send(msg);
}

export const postMessage = async (req: Request, res: Response) => {
    const { key, value } = req.body
    if (!key || !value)
        return res.status(400).send('No Key or Value provided')

    const lowDB = await initLowDB()
    const dbData = lowDB.data
    if (!dbData)
        return res.status(500).send('DB not initialized')

    if (!dbData.messages || !dbData.messages[key]) {
        dbData.messages = {}
        dbData.messages[key] = []
    }

    const message = newMessage(key, value)
    dbData.messages[key].push(message)

    await lowDB.write()

    res.send(message);
}

export const deleteMessage = async (req: Request, res: Response) => {
    const query = req.query;
    const key: string = query.key as string;
    const _id: string = query._id as string;

    if (!key)
        return res.status(400).send('No Key provided')
    if (!_id)
        return res.status(400).send('No ID provided')

    const lowDB = await initLowDB()
    const dbData = lowDB.data
    if (!dbData)
        return res.status(500).send('DB not initialized')


    if (!dbData.messages || !dbData.messages[key]) {
        return res.status(404).send('No message found')
    }

    let messageIndex = -1
    dbData.messages[key].forEach(message => {
        if (message._id === _id)
            messageIndex = dbData.messages[key].indexOf(message)
    });
    if (messageIndex === -1)
        return res.status(404).send('No message found')

    const deletedMessages = dbData.messages[key].splice(messageIndex, 1)

    await lowDB.write()
    res.send(deletedMessages);
}
