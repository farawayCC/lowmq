import express from 'express'
const messageRouter = express.Router()
import { validPassword } from '../middleware/general.js'
import * as ctrl from '../controllers/message.js'

messageRouter.use(validPassword)

messageRouter.get('/keys', ctrl.getKeys)
messageRouter.get('/msg', ctrl.getMessage)
messageRouter.put('/msg', ctrl.updateMessage)
messageRouter.post('/msg', ctrl.postMessage)
messageRouter.delete('/msg', ctrl.deleteMessage)
messageRouter.put('/msg/freeze', ctrl.freezeMessage)
messageRouter.put('/msg/unfreeze', ctrl.unfreezeMessage)
messageRouter.get('/msg/count', ctrl.countMessages)

export default messageRouter
