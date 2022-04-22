import * as net from 'net'

const x = 3 * 2
console.log(`x = ${x}`)
net
    .createServer()
    .listen('127.0.0.1', 4000)
    .on('connection', socket => {
        console.log(`New connection from ${socket.remoteAddress}`)
    })