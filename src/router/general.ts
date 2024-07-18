import express from 'express'
const generalRouter = express.Router()
import {
    helpInfo,
    version,
    controllerHtml,
    controllerJs,
} from '../controllers/general.js'
import { validPassword } from '../middleware/general.js'


generalRouter.get('', (_, res) => { res.send('All systems online') })
generalRouter.get('/help', helpInfo)
generalRouter.get('/version', version)
generalRouter.get('/controller', controllerHtml)
generalRouter.get('/controller.js', controllerJs)

generalRouter.get('/login/verify', validPassword, (_, res) => res.send('ok'))


export default generalRouter
