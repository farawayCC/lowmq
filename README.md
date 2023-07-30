# LowMQ
Simple to use message broker written in TS.
Utilizing the simplicity, power and omnipresence of HTTP requests.


# Run the broker server
### Production
- download the latest release `wget https://github.com/farawayCC/lowmq/releases/latest/download/lowmq.zip`
- unzip it `unzip -q lowmq.zip`
- Change the directory into unzipped folder `cd lowmq-latest`
- run using node `node dist/index.js`

The server is up. Navigate to http://yourDomain:8788/help for help

### Development
- clone the repository `git clone https://github.com/farawayCC/lowmq.git`
- install dependencies `npm i` or `yarn`
- start the server with `npm start` or `yarn start`

The server is up. Navigate to http://localhost:8788/help for help

# Usage
## Basic messaging
#### Add a message to the queue
curl -X POST -H "Authorization: token woof" -H "Content-Type: application/json" -d '{"key": "test", "value": "Hello World!"}' http://localhost:8788/msg
#### Get a message from the queue
curl -X GET -H "Authorization: token woof" "http://localhost:8788/msg?key=test"
#### Delete a message from the queue
curl -X DELETE -H "Authorization: token woof" "http://localhost:8788/msg?key=test&_id=123456789"
please note that the _id is the id of the message in the queue. You can get it from the GET request.

## NodeJS client
[NPM packet: lowmq-client](https://www.npmjs.com/package/lowmq-client)


# TODO
- [X] Keys list endpoint
- [ ] Add instructions for updating the server + check db and tokens are not rewritten
