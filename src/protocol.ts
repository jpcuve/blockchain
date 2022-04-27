import {createServer, Socket} from 'net'
import {EventEmitter} from 'events'

class Link {
  static messageId: number = 500
  readonly name: string
  readonly socket: Socket
  readonly emitter: EventEmitter = new EventEmitter()
  readonly pending: Set<number> = new Set<number>()

  constructor(name: string, socket: Socket) {
    this.name = name
    this.socket = socket
    socket.setEncoding('utf-8')
    socket.on('data', (value: string) => {
      const parts = value.split('|')
      const id = Number(parts[0].trim())
      if (isNaN(id)){ // notification
        console.log(`${this.name}: notification: ${value.trim()}`)
        this.sink(parts[1].trim(), JSON.parse(parts[2].trim()))
      } else{
        if (parts.length === 3){ // request
          console.log(`${this.name}: request: ${value.trim()}`)
          const responseBody = this.handle(parts[1].trim(), JSON.parse(parts[2].trim()))
          this.socket.write(`${id}|${JSON.stringify(responseBody)}\r\n`)
        } else {  // response
          console.log(`${this.name}: response: ${value.trim()}`)
          this.emitter.emit('response', id, JSON.parse(parts[1].trim()))
        }
      }
    })
    setInterval(() => {
      socket.write(`*|timer|{"time":${new Date().getTime()}}\r\n`)
    }, 60_000)
    this.notify('connected', {
      name: this.name,
      localAddress: socket.localAddress,
      localPort: socket.localPort,
      remoteAddress: socket.remoteAddress,
      remotePort: socket.remotePort,
    })
  }

  sink(verb: string, body: any){
    console.log(`${this.name}: sinking: ${verb} ${JSON.stringify(body)}`)
  }

  handle(verb: string, body: any): any {
    console.log(`${this.name}: handling query: ${verb} ${JSON.stringify(body)}`)
    return {receivedVerb: verb, receivedBody: body}
  }

  query(verb: string, body: any): Promise<any>{
    return new Promise<any>((resolve: (value: any) => void, reject: (reason?: any) => void) => {
      const id = Link.messageId++
      this.socket.write(`${id}|${verb}|${JSON.stringify(body)}\r\n`)
      this.pending.add(id)
      console.log(`${this.name}: pending: ${JSON.stringify([...this.pending])}`)
      this.emitter.on('response', (inId: number, inVerb: string, inBody: any) => {
        if (this.pending.has(inId)){
          console.log(`${this.name}: removing ${inId} from pending`)
          this.pending.delete(inId)
          resolve(inBody)
        } else {
          // reject({message: `${this.name}: request not found: ${inId} (pending: ${JSON.stringify([...this.pending])})`})
        }
      })
    })
  }

  notify(verb: string, body: any){
    this.socket.write(`*|${verb}|${JSON.stringify(body)}\r\n`)
  }
}

class Server{
  readonly port: number
  links: Link[] = []

  constructor(port: number) {
    this.port = port
  }

  listen(){
    const server = createServer()
    server.listen(this.port)
    server.on('connection', (socket: Socket) => {
      this.links.push(new Link('server', socket))
    })
    server.on('close', (hadError: boolean) => {
      this.links = this.links.filter(it => !it.socket.destroyed)
    })
  }
}

class Client{
  readonly port: number

  constructor(port: number) {
    this.port = port
  }

  connect(){
    const socket = new Socket()
    socket.connect(this.port, '127.0.0.1', () => {
      const link = new Link('client', socket)
      setInterval(async () => {
        try{
          const data = await link.query('some_verb', {parameterOne: 'one', parameterTwo: 'two'})
          console.log(`Received data: ${data}`)
        } catch(e: any){
          console.error(e.message)
        }
      }, 5_000)
    })
  }
}

const server = new Server(4000)
server.listen()
setTimeout(() => {
  const client = new Client(4000)
  client.connect()
}, 1_000)
