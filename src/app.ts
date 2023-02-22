import express from 'express';
import generalRouter from './router/general.js';
import authRouter from './router/auth.js';
import { checkDefaults } from './helpers/utils.js';
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('', generalRouter)
app.use('', authRouter)

checkDefaults();

const PORT = process.env.PORT || 8788;
app.listen(PORT, () => {
    console.log(`LowMQ started with url: http://localhost:${PORT}`)
    console.log(`Basic tutorial and api reference: http://localhost:${PORT}/help`);
});

export default app;
