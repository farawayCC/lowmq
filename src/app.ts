import express from 'express';
import { Low, JSONFile } from 'lowdb';
import { join, dirname } from 'path';
import generalRouter from './router/general.js';
import authRouter from './router/auth.js';
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('', generalRouter)
app.use('', authRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
