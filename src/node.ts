import {createServer, Server, Socket} from "net";


class Link {
    static messageId: number = 1
    readonly name: string
    readonly socket: Socket
    readonly incoming: boolean
    readonly resolves: {[id: number]: (data: any) => void} = {}
    buffer: string = ''

    constructor(name: string, socket: Socket, incoming: boolean) {
        this.name = name
        this.socket = socket
        this.incoming = incoming
        socket.setEncoding('utf-8')
        socket.on('data', (value: string) => {
            // console.log(`${this.name}: data: ${value}`)
            this.buffer += value
            while (true){
                const nl = this.buffer.indexOf('\n')
                if (nl < 0){
                    break
                }
                const parts = this.buffer.substring(0, nl).split('|')
                this.buffer = this.buffer.substring(nl + 1)
                const id = Number(parts[0].trim())
                if (isNaN(id)){ // notification
                    // console.log(`${this.name}: notification: ${value.trim()}`)
                    this.sink(parts[1].trim(), JSON.parse(parts[2].trim()))
                } else{
                    if (parts.length === 3){ // request
                        // console.log(`${this.name}: request: ${value.trim()}`)
                        const responseBody = this.handle(parts[1].trim(), JSON.parse(parts[2].trim()))
                        this.socket.write(`${id}|${JSON.stringify(responseBody)}\r\n`)
                    } else {  // response
                        // console.log(`${this.name}: response: ${value.trim()}`)
                        this.resolves[id](JSON.parse(parts[1].trim()))
                        delete this.resolves[id]
                    }
                }

            }
        })
        this.notify('connected', {
            name: this.name,
            localAddress: socket.localAddress,
            localPort: socket.localPort,
            remoteAddress: socket.remoteAddress,
            remotePort: socket.remotePort,
        })
    }

    destroy(){
        this.socket.destroy()
    }

    sink(verb: string, body: any){
        console.log(`${this.name}: sinking: ${verb} ${JSON.stringify(body)}`)
    }

    handle(verb: string, body: any): any {
        console.log(`${this.name}: handling query: ${verb} ${JSON.stringify(body)}`)
        return {receivedVerb: verb, receivedBody: body}
    }

    query(verb: string, body: any): Promise<any>{
        return new Promise<any>((resolve: (value: any) => void) => {
            const id = Link.messageId++
            this.socket.write(`${id}|${verb}|${JSON.stringify(body)}\r\n`)
            this.resolves[id] = resolve
        })
    }

    notify(verb: string, body: any){
        this.socket.write(`*|${verb}|${JSON.stringify(body)}\r\n`)
    }
}

export class Node {
    readonly name: string
    readonly port: number
    readonly server: Server
    links: Link[] = []

    constructor(name: string, port: number) {
        this.name = name
        this.port = port
        this.server = createServer()
            .on('connection', (socket: Socket) => {
                socket.on('close', () => {
                    this.links = this.links.filter(it => !it.socket.destroyed)
                })
                this.links.push(new Link(this.name, socket, true))
            })
    }

    connect(port: number){
        const socket = new Socket()
        socket.connect(port, '127.0.0.1', () => {
            this.links.push(new Link(this.name, socket, false))
        })
    }

    listen() {
        console.log(`Server ${this.name} listening on port ${this.port}`)
        this.server.listen(this.port)
    }

    quit() {
        console.log(`Server ${this.name} closing`)
        this.links.forEach(it => it.destroy())
        this.server.close()
    }
}

export const createLink: (port: number) => Promise<Link> = port => {
    return new Promise<Link>((resolve: (value: Link) => void) => {
        const socket = new Socket()
        socket.connect(port, '127.0.0.1', () => {
            resolve(new Link('client', socket, false))
        })
    })
}
