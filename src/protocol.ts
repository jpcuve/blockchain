import {createServer, Socket} from 'net'
import {EventEmitter} from 'events'

class Link {
  static messageId: number = 500
  readonly socket: Socket
  readonly emitter: EventEmitter = new EventEmitter()
  readonly pending: Set<number> = new Set<number>()

  constructor(socket: Socket) {
    this.socket = socket
    socket.setEncoding('utf-8')
    socket.on('data', (value: string) => {
      const parts = value.split('|')
      const id = Number(parts[0].trim())
      if (isNaN(id)){ // notification
        this.sink(parts[1].trim(), JSON.parse(parts[2].trim()))
      } else{
        if (parts.length == 3){ // request
          const responseBody = this.handle(parts[1].trim(), JSON.parse(parts[2].trim()))
          this.socket.write(`${id}|${JSON.stringify(responseBody)}\r\n`)
        } else {  // response
          this.emitter.emit('response', id, JSON.parse(parts[1].trim()))
        }
      }
    })
    setInterval(() => {
      socket.write(`*|timer|{"time":${new Date().getTime()}}\r\n`)
    }, 60_000)
    this.notify('connected', {})
  }

  sink(verb: string, body: any){
    console.log(`Sinking: ${verb} ${body}`)
  }

  handle(verb: string, body: any): any {
    return {receivedVerb: verb, receivedBody: body}
  }

  query(verb: string, body: any): Promise<any>{
    return new Promise<any>((resolve: (value: any) => void, reject: (reason?: any) => void) => {
      const id = Link.messageId++
      this.socket.write(`${id}|${verb}|${body}\r\n`)
      this.pending.add(id)
      this.emitter.on('response', (inId: number, inVerb: string, inBody: any) => {
        if (this.pending.has(inId)){
          this.pending.delete(inId)
          resolve(inBody)
        } else {
          reject('Request not found')
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
      this.links.push(new Link(socket))
    })
    server.on('close', (hadError: boolean) => {
      this.links = this.links.filter(it => !it.socket.destroyed)
    })
  }
}

const server = new Server(4000)
server.listen()