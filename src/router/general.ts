import express from 'express'
const router = express.Router()
import {
    getKeys,
    getMessage,
    postMessage,
    updateMessage,
    deleteMessage,
    countMessages,
    helpInfo,
    controllerHtml,
    controllerJs,
    freezeMessageController,
} from '../controllers/general.js'
import { validPassword } from '../middleware/general.js'


router.get('', (req, res) => { res.send('All systems online') })
router.get('/help', helpInfo)
router.get('/controller', controllerHtml)
router.get('/controller.js', controllerJs)

router.get('/keys', validPassword, getKeys)

router.get('/msg', validPassword, getMessage)
router.put('/msg', validPassword, updateMessage)
router.post('/msg', validPassword, postMessage)
router.delete('/msg', validPassword, deleteMessage)

router.put('/msg/freeze', validPassword, freezeMessageController)

// endpoint that shows count of messages for each queue
router.get('/msg/count', validPassword, countMessages)

router.get('/login/verify', validPassword, (_, res) => res.send('ok'))


export default router
