import express from 'express';
const router = express.Router();
import initLowDB, { Data } from '../helpers/localDB/index.js';

router.get('', (req, res) => { res.send('All systems online') });

router.get('/msg', async (req, res) => {
    const query = req.query;
    console.log('Query Key: ', query.key);
    res.send(`Message: ${query.key}`);
});

router.post('/msg', async (req, res) => {
    const { key, value } = req.body
    if (!key || !value)
        return res.status(400).send('No Key or Value provided')

    console.log('User trying to post Key:', key);
    console.log('User trying to post Value:', value);

    const lowDB = await initLowDB()
    const dbData: Data = lowDB.data
    console.log("🚀 ~ file: general.ts ~ line 23 ~ router.post ~ dbData", dbData)

    if (dbData.messages[key] || dbData.messages[key].length === 0)
        dbData.messages[key] = []

    dbData.messages[key].push(value)
    console.log("🚀 ~ file: general.ts ~ line 25 ~ router.post ~ dbData", dbData)
    console.log('DB:', dbData);
    await lowDB.write()

    res.send('Message posted');
});

export default router
