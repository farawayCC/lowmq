import request from 'supertest'
import chai from 'chai'
const expect = chai.expect
import app from '../dist/app.js'
import { clearDB, defaultAuthValue } from './test.config.js'


before(function (done) {
    clearDB()
    done()
})

it('Server is up', function (done) {
    request(app).get('/').expect('All systems online').end(done);
});

const route = '/msg'
const msgName = 'test-message-key'

const n = 50

describe('Performance', function () {

    describe(`Add ${n} messages`, () => {
        const value = { 'meow': 'Cat', 'woof': 'Dog' }

        var responses = []

        before(async function () {
            for (let i = 0; i < n; i++) {
                const response = await request(app)
                    .post(route)
                    .set('Authorization', defaultAuthValue)
                    .send({ key: msgName, value });
                responses.push(response)
            }
        })

        it(`should have received ${n} successful responses`, () => {
            expect(responses.length).to.equal(n)
            for (let response of responses)
                expect(response.status).to.equal(200)
        });

        after(() => {
            clearDB()
        });
    });
});
