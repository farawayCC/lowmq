import express from 'express';
import path, { join } from 'path';
import * as url from 'url';
import fs from 'fs/promises';
import fs$1 from 'fs';
import { JSONFileSync, LowSync } from 'lowdb';
import { randomUUID } from 'crypto';
import http from 'http';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
// Note: for tests we build the project using tsc, so the root path is different (./dist/), while for the app itself it's the same as __dirname (./lowmq.js)
const isForTest = path.join(__dirname).includes('dist');
const rootPath = isForTest
    ? path.join(__dirname, '..')
    : path.join(__dirname);
const config = {
    dbFilePath: path.join(rootPath, 'resources', 'db.json'),
    messageFreezeTimeMinutes: 5,
    defaultPassword: 'woof',
};

/** Utility function to send RFC 9457 compliant error responses */
function sendProblemDetails(res, type, status, title, detail) {
    res.status(status).json({
        type,
        title,
        status,
        detail,
    });
}

const helpInfo = async (_, res) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'help.html');
        let helpHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8');
        helpHTMLContent = helpHTMLContent.replace(/'Authorization: token woof'/g, `Authorization: token ${config.defaultPassword}`);
        res.send(helpHTMLContent);
    }
    catch (error) {
        sendProblemDetails(res, 'file-read-error', 500, 'Error reading help.html file', error?.message);
    }
};
const controllerHtml = async (_, res) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'controller.html');
        const controllerHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8');
        res.send(controllerHTMLContent);
    }
    catch (error) {
        sendProblemDetails(res, 'file-read-error', 500, 'Error reading controller.html file', error?.message);
    }
};
const controllerJs = async (_, res) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'controller.js');
        const helpHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8');
        res.send(helpHTMLContent);
    }
    catch (error) {
        sendProblemDetails(res, 'file-read-error', 500, 'Error reading controller.js file', error?.message);
    }
};

const validPassword = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (typeof authHeader !== 'string')
        return sendProblemDetails(res, 'missing-authorization-header', 401, 'No auth header provided', 'Expected an Authorization header, got: ' + authHeader);
    const token = authHeader.split(' ').length === 2
        ? authHeader.split(' ')[1]
        : authHeader.split(' ')[0];
    if (!token)
        return sendProblemDetails(res, 'missing-token', 403, 'No token provided', 'Expected a token in the Authorization header, got: ' + authHeader);
    const pathToTokensFile = join(rootPath, 'resources', 'tokens');
    if (!fs$1.existsSync(pathToTokensFile))
        return sendProblemDetails(res, 'missing-tokens-file', 500, 'No tokens file found', 'Contact admin');
    const tokensFileData = fs$1.readFileSync(pathToTokensFile, 'utf-8');
    let approvedTokens = tokensFileData.split('\n');
    approvedTokens = approvedTokens.filter((h) => h !== '');
    const isValid = approvedTokens.includes(token);
    if (!isValid)
        return sendProblemDetails(res, 'invalid-token', 403, 'Invalid token provided', 'Token provided is not valid');
    next();
};

const generalRouter = express.Router();
generalRouter.get('', (_, res) => { res.send('All systems online'); });
generalRouter.get('/help', helpInfo);
generalRouter.get('/controller', controllerHtml);
generalRouter.get('/controller.js', controllerJs);
generalRouter.get('/login/verify', validPassword, (_, res) => res.send('ok'));

const makeDefaultDb = () => ({ messages: {} });
const initLowDB = () => {
    const adapter = new JSONFileSync(config.dbFilePath);
    const db = new LowSync(adapter);
    db.read();
    if (!db.data
        || typeof db.data !== 'object'
        || typeof db.data.messages !== 'object')
        db.data = makeDefaultDb();
    // We checked that db.data is not null
    return db;
};
class LowDB {
    // eslint-disable-next-line no-use-before-define
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

const checkDefaults = () => {
    // Check if tokens file exists
    const pathToTokensFile = join(rootPath, 'resources', 'tokens');
    if (!fs$1.existsSync(pathToTokensFile))
        fs$1.writeFileSync(pathToTokensFile, config.defaultPassword, 'utf-8');
    // Warn if default password is still in use
    else if (fs$1.readFileSync(pathToTokensFile, 'utf-8').includes(config.defaultPassword))
        console.warn('Default password is still in use. Please change it in resources/tokens');
    // Check if db file exists
    const emptyDB = JSON.stringify(makeDefaultDb());
    if (!fs$1.existsSync(config.dbFilePath))
        fs$1.writeFileSync(config.dbFilePath, emptyDB, 'utf-8');
};

const isMessageFrozen = (message) => {
    const now = new Date();
    const frozenTo = new Date(message.frozenTo);
    return now < frozenTo;
};
const freezeMessage$1 = (message) => {
    const toMS = (minutes) => minutes * 60 * 1000;
    let freezeTime = toMS(message.freezeTimeMin);
    freezeTime = Math.max(freezeTime, toMS(1)); // 1 min minimum
    freezeTime = Math.min(freezeTime, toMS(60)); // 1 hour maximum
    message.frozenTo = new Date(new Date().getTime() + freezeTime);
    return message;
};
const makeNewMessage = (key, value, freezeTime) => {
    const newId = randomUUID();
    return {
        _id: newId,
        key,
        value,
        frozenTo: new Date(0),
        freezeTimeMin: freezeTime,
    };
};

class ProblemDetailsTypes {
    static noKeyProvided = 'no-key-provided';
    static noValueProvided = 'no-value-provided';
    static noMessagesFound = 'no-messages-found';
    static invalidFreezeTime = 'invalid-freeze-time';
    static invaildPayload = 'invalid-payload';
}
const getKeys = (req, res) => {
    const db = LowDB.getDB();
    const keys = Object.keys(db.data.messages);
    res.send(keys);
};
const getMessage = (req, res) => {
    const { key, deleteAfterRead } = req.query;
    if (typeof key !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.noKeyProvided, 400, 'No key provided', 'Expected string key in query parameter, got: ' + key);
    const toDelete = deleteAfterRead === 'true' || req.query.toDelete === 'true' || req.query.delete === 'true';
    const db = LowDB.getDB();
    const messages = db.data.messages[key];
    if (!messages || messages.length === 0)
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No messages found', 'No messages found for key: ' + key);
    const activeMessages = messages.filter(m => !isMessageFrozen(m));
    if (activeMessages.length === 0)
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No active messages', 'No active messages found for key: ' + key);
    const randomIndex = Math.floor(Math.random() * activeMessages.length);
    let message = activeMessages[randomIndex];
    message = freezeMessage$1(message);
    if (toDelete) {
        db.data.messages[key] = messages.filter(m => m._id !== message._id);
        if (db.data.messages[key]?.length === 0)
            delete db.data.messages[key];
    }
    db.write();
    res.send(message);
};
const postMessage = (req, res) => {
    // Check types like in getMessage
    const { key, value } = req.body;
    if (typeof key !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.noKeyProvided, 400, 'No key provided', 'Expected string key in payload, got: ' + key);
    if (value === undefined)
        return sendProblemDetails(res, ProblemDetailsTypes.noValueProvided, 400, 'No value provided', 'Expected value in payload, got: ' + value);
    const freezeTime = typeof req.query.freezeTimeMin === 'string'
        ? parseInt(req.query.freezeTimeMin)
        : config.messageFreezeTimeMinutes;
    if (isNaN(freezeTime))
        return sendProblemDetails(res, ProblemDetailsTypes.invalidFreezeTime, 400, 'Invalid freeze time', 'Expected number in query parameter freezeTimeMin, got: ' + req.query.freezeTimeMin);
    const db = LowDB.getDB();
    const messages = db.data.messages;
    if (!messages[key])
        messages[key] = [];
    const newMessage = makeNewMessage(key, value, freezeTime);
    messages[key]?.push(newMessage);
    db.write();
    res.send(newMessage);
};
const updateMessage = (req, res) => {
    const { key, newValue, id } = req.body;
    if (typeof id !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload', 'Expected string id in payload, got: ' + id);
    if (typeof key !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload', 'Expected string key in payload, got: ' + key);
    if (newValue === undefined)
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload', 'Expected value in payload, got: ' + newValue);
    const db = LowDB.getDB();
    const messages = db.data.messages;
    if (!messages[key])
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No messages found', 'No messages found for key: ' + key);
    const message = messages[key]?.find(m => m._id === id);
    if (!message)
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No message found', 'No message found with id: ' + id);
    message.value = newValue;
    db.write();
    res.send(message);
};
const freezeMessage = (req, res) => {
    const { key, id } = req.body;
    if (typeof id !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload', 'Expected string id in payload, got: ' + id);
    if (typeof key !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload', 'Expected string key in payload, got: ' + key);
    const db = LowDB.getDB();
    const messages = db.data.messages;
    if (!messages[key])
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No messages found', 'No messages found for key: ' + key);
    const message = messages[key]?.find(m => m._id === id);
    if (!message)
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No message found', 'No message found with id: ' + id);
    const frozenMessage = freezeMessage$1(message);
    db.write();
    res.send(frozenMessage);
};
const deleteMessage = (req, res) => {
    const { key, id } = req.body;
    if (typeof id !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload', 'Expected string id in payload, got: ' + id);
    if (typeof key !== 'string')
        return sendProblemDetails(res, ProblemDetailsTypes.invaildPayload, 400, 'Invalid payload', 'Expected string key in payload, got: ' + key);
    const db = LowDB.getDB();
    const messages = db.data.messages;
    if (!messages[key])
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No messages found', 'No messages found for key: ' + key);
    const messageIndex = messages[key]?.findIndex(m => m._id === id) || -1;
    if (messageIndex === -1)
        return sendProblemDetails(res, ProblemDetailsTypes.noMessagesFound, 404, 'No message found', 'No message found with id: ' + id);
    const deletedMessage = messages[key]?.splice(messageIndex, 1)[0];
    db.write();
    res.send(deletedMessage);
};
const countMessages = (req, res) => {
    const db = LowDB.getDB();
    const counts = {};
    for (const [key, messages] of Object.entries(db.data.messages)) {
        counts[key] = messages?.length || 0;
    }
    res.send(counts);
};

const messageRouter = express.Router();
messageRouter.use(validPassword);
messageRouter.get('/keys', getKeys);
messageRouter.get('/msg', getMessage);
messageRouter.put('/msg', updateMessage);
messageRouter.post('/msg', postMessage);
messageRouter.delete('/msg', deleteMessage);
messageRouter.put('/msg/freeze', freezeMessage);
messageRouter.get('/msg/count', countMessages);

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
app.use(generalRouter);
app.use(messageRouter);
// 404
app.use((_, res) => sendProblemDetails(res, 'not-found', 404, 'Resource not found', 'The requested resource was not found on this server'));
checkDefaults();
const PORT = process.env.PORT || 8788;
app.listen(PORT, () => {
    console.log(`LowMQ started with url: http://localhost:${PORT}`);
    console.log(`Basic tutorial and api reference: http://localhost:${PORT}/help`);
});

http.createServer(app);
