import request from 'supertest'
import chai from 'chai'
const expect = chai.expect
import app from '../dist/app.js'


it('Server is up', function (done) {
    request(app).get('/').expect('All systems online').end(done);
});

const route = '/msg'

describe('Basic messages operations', function () {
    this.timeout(5000);

    describe('Post and Get new messages', () => {
        var responseNewMsg
        var responseReadMsg
        const msgName = 'test-message-key'

        before(async () => {
            const value = {
                'meow': 'Cat',
                'woof': 'Dog'
            }
            responseNewMsg = await request(app)
                .post(route)
                .send({ key: msgName, value });
            responseReadMsg = await request(app)
                .get(route)
                .query({ 'key': msgName });
        })

        it('can post a message', () => {
            expect(responseNewMsg.statusCode).to.equals(200)
        });

        it('can get a message', () => {
            expect(responseReadMsg.statusCode).to.equals(200)
            expect(responseReadMsg.body).to.have.property(msgName)
            expect(responseReadMsg.body[msgName]).to.have.property('meow')
            expect(responseReadMsg.body[msgName]).to.have.property('Woof')
            expect(responseReadMsg.body[msgName].meow).to.equals('Cat')
            expect(responseReadMsg.body[msgName].woof).to.equals('Dog')
            expect(Object.keys(responseReadMsg.body[msgName]).length).to.equals(2)
        });
    });
});

