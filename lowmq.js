import express from 'express';
import { randomUUID } from 'crypto';
import { JSONFileSync, LowSync } from 'lowdb';
import path, { join } from 'path';
import * as url from 'url';
import fs from 'fs/promises';
import fs$1 from 'fs';
import http from 'http';

const isMessageFrozen = (message) => {
    const now = new Date();
    const frozenTo = new Date(message.frozenTo);
    return now < frozenTo;
};
const freezeMessage = (message) => {
    const toMS = (minutes) => minutes * 60 * 1000;
    var freezeTime = toMS(message.freezeTimeMin);
    freezeTime = Math.max(freezeTime, toMS(1)); // 1 min minimum
    freezeTime = Math.min(freezeTime, toMS(60)); // 1 hour maximum
    message.frozenTo = new Date(new Date().getTime() + freezeTime);
    return message;
};
const newMessage = (key, value, freezeTime) => {
    const newId = randomUUID();
    return {
        _id: newId,
        key,
        value,
        frozenTo: new Date(0),
        freezeTimeMin: freezeTime
    };
};

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
// Note: for tests we build the project using tsc, so the root path is different (./dist/), while for the app itself it's the same as __dirname (./lowmq.js)
const isForTest = path.join(__dirname).includes('dist');
const rootPath = isForTest
    ? path.join(__dirname, '..')
    : path.join(__dirname);
const config = {
    dbFilePath: path.join(rootPath, 'resources', 'db.json'),
    messageFreezeTimeMinutes: 5,
    defaultPassword: 'woof'
};

// const lowdb = import('lowdb')
const initLowDB = () => {
    const adapter = new JSONFileSync(config.dbFilePath);
    const db = new LowSync(adapter);
    db.read();
    if (!db.data
        || typeof db.data !== 'object'
        || typeof db.data.messages !== 'object')
        db.data = { messages: {} };
    // We checked that db.data is not null
    return db;
};
class LowDB {
    static instance;
    db;
    constructor() {
        this.db = initLowDB();
    }
    // Returns valid db with .data and .messages
    static getDB() {
        if (!LowDB.instance)
            LowDB.instance = new LowDB();
        return LowDB.instance.db;
    }
}

const getKeys = (req, res) => {
    const db = LowDB.getDB();
    if (!db.data)
        return res.status(500).send('DB not initialized');
    if (!db.data.messages)
        return res.status(404).send('No messages found');
    const keys = Object.keys(db.data.messages);
    res.send(keys);
};
const getMessage = (req, res) => {
    //TODO: add get by _id
    const query = req.query;
    if (!query.key)
        return res.status(400).send('No key provided as query for GET message request');
    const db = LowDB.getDB();
    // Get messages for query key
    const qk = query.key;
    let messagesForQuery = db.data.messages[qk];
    if (!messagesForQuery || messagesForQuery.length === 0)
        return res.status(404).send('No messages found');
    // Get messages that are not frozen
    const activeMessages = messagesForQuery.filter((m) => !isMessageFrozen(m));
    if (activeMessages.length === 0)
        return res.status(404).send('No messages found');
    // Get random message
    const msgRandomIndex = Math.floor(Math.random() * activeMessages.length);
    let msg = activeMessages[msgRandomIndex];
    msg = freezeMessage(msg);
    // Delete the message if query parameter deleteAfterRead is true
    const toDelete = query.deleteAfterRead === 'true' || query.toDelete === 'true' || query.delete === 'true';
    if (toDelete) {
        messagesForQuery = messagesForQuery.filter((m) => m._id !== msg._id);
        // Remove the key if there are no more messages
        if (messagesForQuery.length === 0)
            delete db.data.messages[qk];
    }
    db.write();
    res.send(msg);
};
const postMessage = (req, res) => {
    const { key, value } = req.body;
    if (!key)
        return res.status(400).send('No Key provided in payload for GET message request');
    if (!value)
        return res.status(400).send('No Value provided in payload for GET message request');
    const freezeTime = typeof req.query.freezeTimeMin === 'string'
        ? parseInt(req.query.freezeTimeMin)
        : config.messageFreezeTimeMinutes;
    if (isNaN(freezeTime))
        return res.status(400).send('Invalid freezeTimeMin provided in query for POST message request');
    const db = LowDB.getDB();
    const allMessages = db.data.messages;
    if (!allMessages[key])
        allMessages[key] = [];
    const message = newMessage(key, value, freezeTime);
    allMessages[key]?.push(message);
    db.write();
    res.send(message);
};
/**
 * Find and update message. For simplicity, replaces current message value with new one
 */
const updateMessage = (req, res) => {
    const { key, id, newValue } = req.body;
    if (!key)
        return res.status(400).send('No key provided');
    if (!id)
        return res.status(400).send('No id provided');
    if (!newValue)
        return res.status(400).send('No newValue provided');
    const db = LowDB.getDB();
    if (!db.data)
        return res.status(500).send('DB not initialized. Contact admin');
    if (!db.data.messages)
        db.data.messages = {};
    const messages = db.data.messages[key];
    if (!messages)
        return res.status(500).send("Collection for key doesn't exist");
    const targetMessage = messages.find(msg => msg._id === id);
    if (!targetMessage)
        return res.status(404).send("Message not found");
    targetMessage.value = newValue;
    db.write();
    res.send(targetMessage);
};
const deleteMessage = (req, res) => {
    const query = req.query;
    const key = query.key;
    const _id = query._id || query.id;
    if (!key)
        return res.status(400).send('No Key provided as query for GET message request');
    if (!_id)
        return res.status(400).send('No ID provided as query for GET message request');
    const db = LowDB.getDB();
    if (!db.data)
        return res.status(500).send('DB not initialized. Contact admin');
    if (!db.data.messages)
        return res.status(404).send('No messages found. Messages are empty');
    const messages = db.data.messages[key];
    if (!messages)
        return res.status(404).send(`No messages found for key: ${key}`);
    let messageIndex = -1;
    messages.forEach(message => {
        if (message._id === _id)
            messageIndex = messages.indexOf(message);
    });
    if (messageIndex === -1)
        return res.status(404).send(`No messages found for _id: ${_id}`);
    const deletedMessages = messages.splice(messageIndex, 1);
    // Remove the key if there are no more messages
    if (messages.length === 0)
        delete db.data.messages[key];
    db.write();
    res.send(deletedMessages);
};
/**
 * Counts the number of messages for each key
 */
const countMessages = (req, res) => {
    const db = LowDB.getDB();
    const counts = {};
    for (const [key, messages] of Object.entries(db.data.messages)) {
        counts[key] = messages?.length || 0;
    }
    res.send(counts);
};
const helpInfo = async (req, res) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'help.html');
        let helpHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8');
        helpHTMLContent = helpHTMLContent.replace(/'Authorization: token woof'/g, `Authorization: token ${config.defaultPassword}`);
        res.send(helpHTMLContent);
    }
    catch (error) {
        res.status(500).send('Error reading help.html file');
    }
};
const controllerHtml = async (req, res) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'controller.html');
        let controllerHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8');
        res.send(controllerHTMLContent);
    }
    catch (error) {
        res.status(500).send('Error reading controller.html file');
    }
};
const controllerJs = async (req, res) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'controller.js');
        let helpHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8');
        res.send(helpHTMLContent);
    }
    catch (error) {
        res.status(500).send('Error reading controller.js file');
    }
};
const freezeMessageController = async (req, res) => {
    try {
        const { key, id } = req.query;
        if (!key || typeof key !== 'string' || !id)
            return res.status(400).send("Invalid key or id");
        const db = LowDB.getDB();
        db.read();
        if (!db.data)
            return res.status(500).send("DB is empty");
        const messages = db.data.messages[key];
        if (!messages)
            return res.status(404).send(`No messages found for key: ${key}`);
        const index = messages.findIndex(msg => msg._id === id);
        if (index === -1)
            return res.status(404).send(`No messages found for _id: ${id}`);
        const frozenMessage = freezeMessage(messages[index]);
        messages[index] = frozenMessage;
        db.write();
        res.json(messages[index]);
    }
    catch (e) {
        res.status(500).send(e?.message || 'Freeze message error');
    }
};

const validPassword = (req, res, next) => {
    // get password from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).send('No auth header provided');
    const token = authHeader.split(' ').length === 2
        ? authHeader.split(' ')[1]
        : authHeader.split(' ')[0];
    if (!token)
        return res.status(403).send('No token provided');
    // check if password is valid agains the resources/tokens file
    const pathToTokensFile = join(rootPath, 'resources', 'tokens');
    if (!fs$1.existsSync(pathToTokensFile))
        return res.status(500).send('No tokens file found. Contact admin');
    const tokensFileData = fs$1.readFileSync(pathToTokensFile, 'utf-8');
    let approvedTokens = tokensFileData.split('\n');
    approvedTokens = approvedTokens.filter((h) => h !== '');
    const isValid = approvedTokens.includes(token);
    if (!isValid)
        return res.status(403).send('Invalid token provided');
    next();
};

const router = express.Router();
router.get('', (req, res) => { res.send('All systems online'); });
router.get('/help', helpInfo);
router.get('/controller', controllerHtml);
router.get('/controller.js', controllerJs);
router.get('/keys', validPassword, getKeys);
router.get('/msg', validPassword, getMessage);
router.put('/msg', validPassword, updateMessage);
router.post('/msg', validPassword, postMessage);
router.delete('/msg', validPassword, deleteMessage);
router.put('/msg/freeze', validPassword, freezeMessageController);
// endpoint that shows count of messages for each queue
router.get('/msg/count', validPassword, countMessages);
router.get('/login/verify', validPassword, (_, res) => res.send('ok'));

const checkDefaults = () => {
    // Check if tokens file exists
    const pathToTokensFile = join(rootPath, 'resources', 'tokens');
    if (!fs$1.existsSync(pathToTokensFile))
        fs$1.writeFileSync(pathToTokensFile, config.defaultPassword, 'utf-8');
    // Warn if default password is still in use
    else if (fs$1.readFileSync(pathToTokensFile, 'utf-8').includes(config.defaultPassword))
        console.warn('Default password is still in use. Please change it in resources/tokens');
    // Check if db file exists
    const emptyDB = '{}';
    if (!fs$1.existsSync(config.dbFilePath))
        fs$1.writeFileSync(config.dbFilePath, emptyDB, 'utf-8');
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = ['http://localhost:3000'];
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin))
        res.header('Access-Control-Allow-Origin', origin);
    // Other CORS headers to allow various types of requests
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});
app.use('', router);
checkDefaults();
const PORT = process.env.PORT || 8788;
app.listen(PORT, () => {
    console.log(`LowMQ started with url: http://localhost:${PORT}`);
    console.log(`Basic tutorial and api reference: http://localhost:${PORT}/help`);
});

http.createServer(app);
