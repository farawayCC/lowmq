import express from 'express';
const router = express.Router();
import {
    getMessage,
    postMessage,
    deleteMessage
} from '../controllers/general.js';


router.get('', (req, res) => { res.send('All systems online') });

router.get('/msg', getMessage);
router.post('/msg', postMessage);
router.delete('/msg', deleteMessage);

export default router
