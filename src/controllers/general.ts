import { Request, Response } from 'express';
import {
    freezeMessage,
    isMessageFrozen,
    newMessage,
} from '../helpers/messageUtils.js';
import initLowDB from '../helpers/localDB/index.js';
import config, { Message } from '../config.js';


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

    await db.write()
    res.send(msg);
}

export const postMessage = async (req: Request, res: Response) => {
    const { key, value } = req.body
    if (!key)
        return res.status(400).send('No Key provided in payload for GET message request')
    if (!value)
        return res.status(400).send('No Value provided in payload for GET message request')

    const lowDB = await initLowDB()
    const dbData = lowDB.data
    if (!dbData)
        return res.status(500).send('DB not initialized. Contact admin')

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
    const currentUrl = req.protocol + '://' + req.get('host')// + req.originalUrl;
    console.log("🚀 ~ file: general.ts ~ line 109 ~ helpInfo ~ urlUserCurrentlyIn", currentUrl)
    const defaultPassword = config.defaultPassword;
    const postMsgCommand = `curl -X POST -H "Authorization: token ${defaultPassword}" -H "Content-Type: application/json" -d '{"key": "test", "value": "Hello World!"}' ${currentUrl}/msg`
    const getMsgCommand = `curl -X GET -H "Authorization: token ${defaultPassword}" "${currentUrl}/msg?key=test"`
    const deleteMsgCommand = `curl -X DELETE -H "Authorization: token ${defaultPassword}" "${currentUrl}/msg?key=test&_id=123456789"`
    res.send(`
    <h1>WolfMQ</h1>
    Simple to use message queue for your projects. Build as a simple REST API with little amount of dependencies.<br>
    <h2>API</h2>
    <ul>
        <li><b>GET</b> /msg?key=</li>
        Returns a random message for the given key. Freezes the message for 5 minutes.
        <li><b>POST</b> /msg</li>
        Creates a new message for the given key. Returns the created message.
        <li><b>DELETE</b> /msg?key=&_id=</li>
        Deletes the message with the given ID for the given key. Returns the deleted message.
    </ul>

    <h2>Example</h2>
    <ol> 
    <li>Create a <b>new message</b> for the key "test":</li>
    <code>${postMsgCommand}</code><br>

    <li><b>Get a message</b> for the key "test":</li>
    <code>${getMsgCommand}</code><br>
    
    <li><b>Delete the message</b> with the given ID for the key "test":</li>
    <code>${deleteMsgCommand}</code><br>
    <small>Please pay attention that you need to provide a valid id which you have received as a response in GET /msg or POST /msg requests</small>
    `)
}
