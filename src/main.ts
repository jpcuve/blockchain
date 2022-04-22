import * as net from 'net'

const x = 3 * 2
console.log(`x = ${x}`)
net
    .createServer()
    .listen(4000)
    .on('connection', socket => {
        console.log(`New connection from ${socket.remoteAddress}`)
        socket.on('data', buffer => {
            socket.write('hello world')
            socket.end()
        })
    })
console.log('Terminating for now')