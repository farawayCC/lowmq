import express from 'express'
import generalRouter from './router/general.js'
import { checkDefaults } from './helpers/utils.js'
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

app.use('', generalRouter)

checkDefaults()

const PORT = process.env.PORT || 8788
app.listen(PORT, () => {
    console.log(`LowMQ started with url: http://localhost:${PORT}`)
    console.log(`Basic tutorial and api reference: http://localhost:${PORT}/help`)
})

export default app
