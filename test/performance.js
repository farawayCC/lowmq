import request from 'supertest'
import chai from 'chai'
const expect = chai.expect
import app from '../dist/app.js'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import axios from 'axios'
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

const host = 'http://localhost:8788'
const route = '/msg'
const msgName = 'test-message-key'

const n = 500

describe('Performance', function () {

    describe(`Add ${n} messages`, () => {
        const value = { 'meow': 'Cat', 'woof': 'Dog' }

        var responses = []

        before(async function () {
            for (let i = 0; i < n; i++) {
                const id = await axios.post(
                    `${host}${route}`,
                    { key: msgName, value },
                    { headers: { Authorization: defaultAuthValue } })
                responses.push(id)
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
