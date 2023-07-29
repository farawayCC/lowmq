import express from 'express';
const router = express.Router();
import {
    getKeys,
    getMessage,
    postMessage,
    deleteMessage,
    countMessages,
    helpInfo
} from '../controllers/general.js';
import { validPassword } from '../middleware/general.js';


router.get('', (req, res) => { res.send('All systems online') });
router.get('/help', helpInfo);

router.get('/keys', validPassword, getKeys);

router.get('/msg', validPassword, getMessage);
router.post('/msg', validPassword, postMessage);
router.delete('/msg', validPassword, deleteMessage);

// endpoint that shows count of messages for each queue
router.get('/msg/count', validPassword, countMessages);


export default router
