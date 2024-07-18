import { before, it, describe, afterEach } from 'mocha'
import request from 'supertest'
import chai from 'chai'
const expect = chai.expect
import app from '../dist/app.js'
import fs from 'fs'
import { clearDB, defaultAuthValue, pathToDB } from './test.config.js'


before(function (done) {
    clearDB()
    done()
})

it('Server is up', function (done) {
    request(app).get('/').expect('All systems online').end(done)
})

const route = '/msg'

describe('Advanced messages operations', () => {
    describe('Message deletion', () => {
        before(async () => {
            clearDB()
            // create test message
            await request(app)
                .post(route)
                .set('Authorization', defaultAuthValue)
                .send({ key: 'test', value: 'test' })
        })

        it('can delete message after reading', async () => {
            const response = await request(app)
                .get(route)
                .set('Authorization', defaultAuthValue)
                .query({ 'key': 'test', 'deleteAfterRead': true })
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
                .send({ key: 'test', value: 'test' })
            const responseRead = await request(app)
                .get(route)
                .set('Authorization', defaultAuthValue)
                .query({ 'key': 'test' })
            expect(responsePost.statusCode).to.equals(200)
            expect(responseRead.statusCode).to.equals(200)
            const messages = JSON.parse(fs.readFileSync(pathToDB, 'utf8')).messages
            const message = messages.test[messages.test.length - 1]
            const frozenTo = new Date(message.frozenTo)
            expect(frozenTo).to.be.greaterThan(new Date())
            expect(frozenTo).to.be.lessThanOrEqual(new Date(Date.now() + freezeTimeMin * 60 * 1000))
        })

        it('can freeze message', async () => {
            const responsePost = await request(app)
                .post(route)
                .set('Authorization', defaultAuthValue)
                .send({ key: 'test', value: 'test' })

            expect(new Date(responsePost.body.frozenTo)).to.be.lessThan(new Date())

            const responseFreeze = await request(app)
                .put('/msg/freeze')
                .set('Authorization', defaultAuthValue)
                .send({ 'key': 'test', 'id': responsePost.body._id })

            expect(responseFreeze.statusCode).to.equals(200)
            expect(new Date(responseFreeze.body.frozenTo)).to.be.greaterThan(new Date())
        })
    })

    describe('list all keys', async () => {
        before(async () => {
            clearDB()
            await request(app)
                .post(route)
                .set('Authorization', defaultAuthValue)
                .send({ key: 'test', value: 'test' })
            await request(app)
                .post(route)
                .set('Authorization', defaultAuthValue)
                .send({ key: 'kittens', value: 'Meow' })
        })

        it('can list all keys', async () => {
            const response = await request(app)
                .get('/keys')
                .set('Authorization', defaultAuthValue)
            expect(response.statusCode).to.equals(200)
            expect(response.body).to.have.property('keys')
            expect(response.body).to.be.an('array')
            expect(response.body).to.include('test')
            expect(response.body).to.include('kittens')
            expect(response.body.length).to.equals(2)
        })
    })

    describe('unfreeze', async () => {
        describe('unfreeze message by id', async () => {
            let message
            before(async () => {
                clearDB()
                // create test message
                await request(app)
                    .post(route)
                    .set('Authorization', defaultAuthValue)
                    .send({ key: 'test', value: 'test' })
                // freeze message by reading it
                message = await request(app)
                    .get('/msg')
                    .set('Authorization', defaultAuthValue)
                    .query({ 'key': 'test' })
            })

            it('can unfreeze message by id', async () => {
                const response = await request(app)
                    .put('/msg/unfreeze')
                    .set('Authorization', defaultAuthValue)
                    .send({ 'key': 'test', 'id': message.body._id })
                expect(response.statusCode).to.equals(200)
                expect(new Date(response.body.frozenTo)).to.be.lessThan(new Date())
            })
        })

        describe('unfreeze one message by key', async () => {
            before(async () => {
                clearDB()
                // create test message
                await request(app)
                    .post(route)
                    .set('Authorization', defaultAuthValue)
                    .send({ key: 'test', value: 'test' })
                // freeze message by reading it
                await request(app)
                    .get('/msg')
                    .set('Authorization', defaultAuthValue)
                    .query({ 'key': 'test' })
            })

            it('can unfreeze one message by key', async () => {
                const response = await request(app)
                    .put('/msg/unfreeze')
                    .set('Authorization', defaultAuthValue)
                    .send({ 'key': 'test' })
                expect(response.statusCode).to.equals(200)
                expect(new Date(response.body.frozenTo)).to.be.lessThan(new Date())
            })
        })

        describe('unfreeze all messages by key', async () => {
            before(async () => {
                clearDB()
                // create test messages
                await request(app)
                    .post(route)
                    .set('Authorization', defaultAuthValue)
                    .send({ key: 'test', value: 'test' })
                await request(app)
                    .post(route)
                    .set('Authorization', defaultAuthValue)
                    .send({ key: 'test', value: 'test' })
                // freeze message by reading them
                await request(app)
                    .get('/msg')
                    .set('Authorization', defaultAuthValue)
                    .query({ 'key': 'test' })
                await request(app)
                    .get('/msg')
                    .set('Authorization', defaultAuthValue)
                    .query({ 'key': 'test' })
            })

            it('can unfreeze all messages by key', async () => {
                const response = await request(app)
                    .put('/msg/unfreeze')
                    .set('Authorization', defaultAuthValue)
                    .send({ 'key': 'test', 'all': true })
                expect(response.statusCode).to.equals(200)

                const messages = JSON.parse(fs.readFileSync(pathToDB, 'utf8')).messages
                messages.test.forEach(message => {
                    expect(new Date(message.frozenTo)).to.be.lessThan(new Date())
                })
            })

            afterEach(() => {
                clearDB()
            })
        })
    })
})
