import express from 'express'
import generalRouter from './router/general.js'
import { checkDefaults } from './helpers/utils.js'
import messageRouter from './router/message.js'
import { sendProblemDetails } from './helpers/http/problemDetails.js'
const app = express()


app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const allowedOrigins = ['http://localhost:3000']
app.use((req, res, next) => {
    const origin = req.headers.origin

    if (origin && allowedOrigins.includes(origin))
        res.header('Access-Control-Allow-Origin', origin)

    // Other CORS headers to allow various types of requests
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')

    next()
})

app.use(generalRouter)
app.use(messageRouter)

// 404
app.use((_, res) => sendProblemDetails(res, 'not-found', 404, 'Resource not found', 'The requested resource was not found on this server'))

checkDefaults()

const PORT = process.env.PORT || 8788
app.listen(PORT, () => {
    console.log(`LowMQ started with url: http://localhost:${PORT}`)
    console.log(`Basic tutorial and api reference: http://localhost:${PORT}/help`)
})

export default app
