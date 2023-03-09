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
const msgName = 'test-message-key'

describe('Basic messages operations', function () {

    describe('Post and Get new messages', () => {
        const value = {
            'meow': 'Cat',
            'woof': 'Dog'
        }

        it('can post a message', async () => {
            const responseNewMsg = await request(app)
                .post(route)
                .set('Authorization', defaultAuthValue)
                .send({ key: msgName, value });
            expect(responseNewMsg.statusCode).to.equals(200)
        });

        it('can get a message', async () => {
            const responseReadMsg = await request(app)
                .get(route)
                .set('Authorization', defaultAuthValue)
                .query({ 'key': msgName });
            const messageObjectValue = responseReadMsg.body.value
            expect(responseReadMsg.statusCode).to.equals(200)
            expect(messageObjectValue).to.have.property(Object.keys(value)[0])
            expect(messageObjectValue).to.have.property(Object.keys(value)[1])
            expect(messageObjectValue.meow).to.equals(Object.values(value)[0])
            expect(messageObjectValue.woof).to.equals(Object.values(value)[1])
        });

        it('can get a message only once', async () => {
            const responseReadAlreadyFetchedMsg = await request(app)
                .get(route)
                .set('Authorization', defaultAuthValue)
                .query({ 'key': msgName });
            expect(responseReadAlreadyFetchedMsg.statusCode).to.equals(404)
        })

        it('can get an empty message', async () => {
            const responseReadEmptyMsg = await request(app)
                .get(route)
                .set('Authorization', defaultAuthValue)
                .query({ 'key': 'empty' });
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

    describe('Can count messages', () => {
        it('can count messages', async () => {
            const responseCountMsg = await request(app)
                .get(route + '/count')
                .set('Authorization', defaultAuthValue);
            expect(responseCountMsg.statusCode).to.equals(200)
            expect(responseCountMsg.body).to.have.property(msgName)
            expect(responseCountMsg.body[msgName]).to.equals(1)
        });
    })

    describe('Delete messages', () => {
        before(() => clearDB())

        it('can delete a message', async () => {
            const value = {
                'meow': 'Cat',
                'woof': 'Dog'
            }
            const responseNewMsg = await request(app)
                .post(route)
                .set('Authorization', defaultAuthValue)
                .send({ key: msgName, value });
            const responseDeleteMsg = await request(app)
                .delete(route)
                .set('Authorization', defaultAuthValue)
                .query({ '_id': responseNewMsg.body._id, 'key': msgName });
            expect(responseDeleteMsg.statusCode).to.equals(200)
        });

        it('can not get a deleted message', async () => {
            const responseReadDeletedMsg = await request(app)
                .get(route)
                .set('Authorization', defaultAuthValue)
                .query({ 'key': msgName });
            expect(responseReadDeletedMsg.statusCode).to.equals(404)
        });
    });
});

describe('Basic auth', () => {
    it('can not post a message without auth', async () => {
        const response = await request(app)
            .post(route)
            .send({ key: 'test', value: 'test' });
        expect(response.statusCode).to.equals(401)
    });

    it('can not get a message without auth', async () => {
        const response = await request(app)
            .get(route)
            .query({ 'key': 'test' });
        expect(response.statusCode).to.equals(401)
    });

    it('can not delete a message without auth', async () => {
        const response = await request(app)
            .delete(route)
            .query({ 'key': 'test' });
        expect(response.statusCode).to.equals(401)
    });
});

describe('Advanced messages operations', () => {
    describe('Message deletion', () => {
        before(async () => {
            clearDB()
            // create test message
            await request(app)
                .post(route)
                .set('Authorization', defaultAuthValue)
                .send({ key: 'test', value: 'test' });
        })

        it('can delete message after reading', async () => {
            const response = await request(app)
                .get(route)
                .set('Authorization', defaultAuthValue)
                .query({ 'key': 'test', 'deleteAfterRead': true });
            expect(response.statusCode).to.equals(200)
            expect(response.body.value).to.equals('test')
            const messages = JSON.parse(fs.readFileSync(pathToDB, 'utf8')).messages
            expect(messages).to.not.have.property('test')
        })
    })

    describe('Freeze time', () => {
        it('can set custom freeze time', async () => {
            const freezeTimeMin = 1
            const responsePost = await request(app)
                .post(route)
                .set('Authorization', defaultAuthValue)
                .query({ 'freezeTimeMin': freezeTimeMin })
                .send({ key: 'test', value: 'test' });
            const responseRead = await request(app)
                .get(route)
                .set('Authorization', defaultAuthValue)
                .query({ 'key': 'test' });
            expect(responsePost.statusCode).to.equals(200)
            expect(responseRead.statusCode).to.equals(200)
            const messages = JSON.parse(fs.readFileSync(pathToDB, 'utf8')).messages
            const message = messages.test[messages.test.length - 1]
            const frozenTo = new Date(message.frozenTo)
            expect(frozenTo).to.be.greaterThan(new Date())
            expect(frozenTo).to.be.lessThanOrEqual(new Date(Date.now() + freezeTimeMin * 60 * 1000))
        })
    })

    afterEach(() => {
        clearDB()
    })
})
