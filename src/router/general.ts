import express from 'express';
const router = express.Router();
import {
    getMessage,
    postMessage,
    deleteMessage,
    helpInfo
} from '../controllers/general.js';
import { validPassword } from '../middleware/general.js';


router.get('', (req, res) => { res.send('All systems online') });
router.get('/help', helpInfo);

router.get('/msg', validPassword, getMessage);
router.post('/msg', validPassword, postMessage);
router.delete('/msg', validPassword, deleteMessage);

export default router
