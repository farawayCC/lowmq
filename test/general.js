import request from 'supertest'
import chai from 'chai'
const expect = chai.expect
import app from '../dist/app.js'
import fs from 'fs'
import path from 'path'
import * as url from "url";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));


const defaultAuthValue = 'Basic woof'
// before all
const pathToDB = path.join(__dirname, '../', 'resources', 'db.json')
const clearDB = () => {
    fs.unlinkSync(pathToDB)
    fs.writeFileSync(pathToDB, '{}')
}
before(function (done) {
    clearDB()
    done()
})

it('Server is up', function (done) {
    request(app).get('/').expect('All systems online').end(done);
});

const route = '/msg'

describe('Basic messages operations', function () {

    describe('Post and Get new messages', () => {
        const value = {
            'meow': 'Cat',
            'woof': 'Dog'
        }
        var responseNewMsg
        var responseReadMsg
        var responseReadAlreadyFetchedMsg
        var responseReadEmptyMsg
        const msgName = 'test-message-key'

        before(async () => {
            responseNewMsg = await request(app)
                .post(route)
                .set('Authorization', defaultAuthValue)
                .send({ key: msgName, value });
            responseReadMsg = await request(app)
                .get(route)
                .set('Authorization', defaultAuthValue)
                .query({ 'key': msgName });
            responseReadAlreadyFetchedMsg = await request(app)
                .get(route)
                .set('Authorization', defaultAuthValue)
                .query({ 'key': msgName });
            responseReadEmptyMsg = await request(app)
                .get(route)
                .set('Authorization', defaultAuthValue)
                .query({ 'key': 'empty' });
        })

        it('can post a message', () => {
            expect(responseNewMsg.statusCode).to.equals(200)
        });

        it('can get a message', () => {
            const messageObjectValue = responseReadMsg.body.value
            expect(responseReadMsg.statusCode).to.equals(200)
            expect(messageObjectValue).to.have.property(Object.keys(value)[0])
            expect(messageObjectValue).to.have.property(Object.keys(value)[1])
            expect(messageObjectValue.meow).to.equals(Object.values(value)[0])
            expect(messageObjectValue.woof).to.equals(Object.values(value)[1])
        });

        it('can get a message only once', () => {
            expect(responseReadAlreadyFetchedMsg.statusCode).to.equals(404)
        })

        it('can get an empty message', () => {
            expect(responseReadEmptyMsg.statusCode).to.equals(404)
        })

        it('can freeze a message', async () => {
            const db = JSON.parse(fs.readFileSync(pathToDB, 'utf8'))
            const messagesForKey = db.messages[msgName]
            const message = messagesForKey[messagesForKey.length - 1]
            const frozenTo = new Date(message.frozenTo)
            expect(message).to.have.property('frozenTo')
            expect(frozenTo).to.be.greaterThan(new Date())
        })
    });

    describe('Delete messages', () => {
        const value = {
            'meow': 'Cat',
            'woof': 'Dog'
        }
        var responseNewMsg
        var responseDeleteMsg
        var responseReadDeletedMsg
        const msgName = 'test-message-key'

        before(async () => {
            clearDB()
            responseNewMsg = await request(app)
                .post(route)
                .set('Authorization', defaultAuthValue)
                .send({ key: msgName, value });
            responseDeleteMsg = await request(app)
                .delete(route)
                .set('Authorization', defaultAuthValue)
                .query({ '_id': responseNewMsg.body._id, 'key': msgName });
            responseReadDeletedMsg = await request(app)
                .get(route)
                .set('Authorization', defaultAuthValue)
                .query({ 'key': msgName });
        })

        it('can delete a message', () => {
            expect(responseDeleteMsg.statusCode).to.equals(200)
        });

        it('can not get a deleted message', () => {
            expect(responseReadDeletedMsg.statusCode).to.equals(404)
        });
    });
});

