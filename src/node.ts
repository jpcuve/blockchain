import {createServer, Server, Socket} from "net";


class Link {
    static messageId: number = 1
    readonly node: Node
    readonly name: string
    readonly socket: Socket
    readonly incoming: boolean
    readonly resolves: {[id: number]: (data: any) => void} = {}
    buffer: string = ''
    closing: boolean = false

    constructor(node: Node, socket: Socket, incoming: boolean) {
        this.node = node
        this.name = node.name
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
                        this.stream(responseBody, undefined, id)
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

    private stream(body: any = {}, verb: string = undefined, id: number = NaN){
        const list = [isNaN(id) ? '*' : id]
        if (verb){
            list.push(verb)
        }
        list.push(JSON.stringify(body))
        this.socket.write(`${list.join('|')}\r\n`, () => {
            if (this.closing){
                this.socket.end(() => {
                    this.socket.destroy()
                    console.log(`${this.name}: closed`)
                })
            }
        })
    }

    close(){
        this.closing = true
    }

    sink(verb: string, body: any){
        console.log(`${this.name}: sinking: ${verb} ${JSON.stringify(body)}`)
        switch(verb){
            case 'kill':
                this.node.close()
                break
        }
    }

    handle(verb: string, body: any): any {
        console.log(`${this.name}: handling query: ${verb} ${JSON.stringify(body)}`)
        return {receivedVerb: verb, receivedBody: body}
    }

    query(verb: string, body: any): Promise<any>{
        return new Promise<any>((resolve: (value: any) => void) => {
            const id = Link.messageId++
            this.stream(body, verb, id)
            this.resolves[id] = resolve
        })
    }

    notify(verb: string, body: any){
        this.stream(body, verb)
    }
}

export class Node {
    readonly name: string
    readonly port: number
    readonly server: Server
    links: Link[] = []

    constructor(name: string, port: number = 0) {
        this.name = name
        this.port = port
        this.server = createServer()
            .on('connection', (socket: Socket) => {
                socket.on('close', () => {
                    this.links = this.links.filter(it => !it.socket.destroyed)
                })
                this.links.push(new Link(this, socket, true))
            })
    }

    connect(port: number): Promise<Link> {
        return new Promise<Link>((resolve: (link: Link) => void) => {
            const socket = new Socket()
            socket.connect(port, '127.0.0.1', () => {
                const link = new Link(this, socket, false)
                this.links.push(link)
                resolve(link)
            })
        })
    }

    listen(): Promise<void> {
        return new Promise<void>((resolve: () => void) => {
            this.server.listen(this.port, () => {
                console.log(`Server ${this.name} listening on port ${this.port}`)
                resolve()
            })
        })
    }

    close() {
        this.links.forEach(it => it.close())
        this.server.close()
    }
}
