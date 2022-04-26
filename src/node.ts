import {createServer, Server, Socket} from "net";


class Link {
    static messageId: number = 1
    readonly node: Node
    readonly socket: Socket
    readonly incoming: boolean
    readonly requests: {[id: number]: (data: any) => void} = {}

    constructor(node: Node, socket: Socket, incoming: boolean) {
        this.node = node
        this.socket = socket
        this.incoming = incoming
    }

    destroy(){
        this.socket.destroy()
    }

    request(verb: string, data: any, callback: (data: any) => void){
        const id = Link.messageId++
        this.socket.write(`${id}|${verb}|${JSON.stringify(data)}\n`)
        this.requests[id] = callback
    }

    dispatch(id: number, verb: string, data: any){
        /**
         * Either the message is:
         *  1. A response to a previous request
         *  2. A request to which I must respond
         *  The case where the message does not need to be answered (id is NaN) is handled by the node
         */
        console.log(`${id} ${verb} ${JSON.stringify(data)}`)
        if (id in this.requests){  // response to a request, call callback
            this.requests[id](data)
            delete this.requests[id]
        } else {  // request that needs a response
            const responseData = this.handle(verb, data)
            this.socket.write(`${id}||${JSON.stringify(responseData)}\n`)
        }
    }

    handle(verb: string, data: any): any{
        switch(verb){
            case 'info':
                return this.node.info()
        }
        return {}
    }
}

export class Node {
    readonly name: string
    readonly port: number
    readonly links: Link[] = []
    readonly server: Server

    constructor(name: string, port: number) {
        this.name = name
        this.port = port
        this.server = createServer()
            .on('connection', (socket: Socket) => {
                this.addLink(socket, true)
            })
    }

    addOutgoingLink(port: number){
        const socket = new Socket()
        socket.connect(port, '127.0.0.1', () => {
            this.addLink(socket, false)
        })
    }

    private addLink(socket: Socket, incoming: boolean){
        socket.setEncoding('utf-8')
        socket
            .on('data', (buffer: string) => {
                try{
                    const link = this.links.find(it => it.socket === socket)
                    const parts = buffer.split('|')
                    const id = Number(parts[0])
                    const verb = parts[1].trim()
                    let data: any = {}
                    if (parts.length > 2) try{
                        data = JSON.parse(parts[2])
                    } catch (e:any){
                        // ignore
                    }
                    if (isNaN(id)){
                        this.sink(verb, data)
                    } else {
                        link.dispatch(id, verb, data)
                    }
                } catch(e: any){
                    console.error(`Protocol error: ${buffer}`)
                }
            })
            .on('close', (hadError: boolean) => {
                this.cleanup()
            })
        this.links.push(new Link(this, socket, incoming))
        console.log(`${JSON.stringify(this.info())}`)
    }

    listen() {
        console.log(`Server ${this.name} listening on port ${this.port}`)
        this.server.listen(this.port)
    }

    cleanup() {
        const index = this.links.findIndex(it => it.socket.destroyed)
        if (index >= 0){
            console.log("Removing link from list")
            this.links.splice(index, 1)
        }
    }

    sink(verb: string, data: any){
        switch(verb){
            case 'connect':  // connect to some other node
                this.addOutgoingLink(data.port)
                break
            case 'quit':
                this.quit()
                break
        }
    }

    info(): any {
        return {
            "name": this.name,
            "port": this.port,
            "links": this.links.map(it => ({
                "incoming": it.incoming,
                "remotePort": it.socket.remotePort,
                "localPort": it.socket.localPort,
            }))
        }
    }

    quit() {
        console.log(`Server ${this.name} closing`)
        this.links.forEach(it => it.destroy())
        this.server.close()
    }
}