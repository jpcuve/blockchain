import {createServer, Server, Socket} from "net";

class Link {
    socket: Socket
    incoming: boolean

    constructor(socket: Socket, incoming: boolean) {
        this.socket = socket
        this.incoming = incoming
    }

    destroy(){
        this.socket.destroy()
    }

    dispatch(node: Node, id: number, verb: string, data: any){
        console.log(`${id} ${verb} ${JSON.stringify(data)}`)
        switch(verb){
            case 'info':
                const info = node.info()
                console.log(`${JSON.stringify(node.info())}`)
                this.respond(id, info)
                break
            case 'quit':
                node.quit()
                break
            case 'connect':
                node.addOutgoingLink(data.port)
                break
        }
    }

    respond(id: number, data: any){
        this.socket.write(`${id}|${JSON.stringify(data)}\n`)
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
                    link.dispatch(this, id, verb, data)
                } catch(e: any){
                    console.error(`Protocol error: ${buffer}`)
                }
            })
            .on('close', (hadError: boolean) => {
                this.cleanup()
            })
        this.links.push(new Link(socket, incoming))
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