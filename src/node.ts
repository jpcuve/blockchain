import {createServer, Server, Socket} from "net";

export class Node {
    private readonly port: number
    private readonly outgoingSocketList: Socket[] = []
    private readonly incomingSocketList: Socket[] = []
    private readonly server: Server

    constructor(port: number) {
        this.port = port
        this.server = createServer()
            .on('connection', (socket: Socket) => {
                console.log(`New connection from ${socket.remoteAddress}`)
                this.addSocket(socket)
            })
    }

    addSocket(socket: Socket){
        this.incomingSocketList.push(socket)
        socket.setEncoding('utf-8')
        socket
            .on('data', (buffer: string) => {
                try {
                    const data = JSON.parse(buffer)
                    console.log(`Data received: ${JSON.stringify(data)}`)
                    this.dispatch(data)
                } catch(e: any){
                    console.error(`Not json: ${buffer}`)
                }
            })
            .on('close', (hadError: boolean) => {
                this.cleanup()
            })
    }

    dispatch(data: any){
        switch(data.type){
            case 'quit':
                this.quit()
                break
            default:
                console.log(`Unrecognized message type: ${JSON.stringify(data)}`)
                break
        }
    }

    listen() {
        this.server.listen(this.port)
    }

    cleanup() {
        const index = this.incomingSocketList.findIndex(s => s.destroyed)
        if (index >= 0){
            console.log("Removing socket from list")
            this.incomingSocketList.splice(index, 1)
        }
    }

    quit() {
        console.log("Closing server")
        this.incomingSocketList.forEach(socket => socket.destroy())
        this.server.close()
    }
}