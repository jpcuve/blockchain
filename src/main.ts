import {Node} from './node'
import {Block} from './chain'
import {Socket} from 'net'

const args = process.argv.slice(2)
switch(args[0]){
    case 'start':
        for (let i = 0; i < 10; i++){
            const node = new Node(`node-${i}`, 4000 + i)
            node.listen().then()
        }
        break
    case 'net':
        for (let i = 0; i < 10; i++){
            (async () => {
                const node = new Node('client')
                const link = await node.connect(4000 + i)
                for (let j = 0; j < 3; j++) {
                    link.notify('connect', {port: 4000 + ((i + j + 1) % 10)})
                }
                node.close()
                // link.close()
            })()
        }
        break
    case 'stop':
        for (let i = 0; i < 10; i++){
            (async () => {
                const node = new Node('client')
                const link = await node.connect(4000 + i)
                link.notify('kill', {})
                node.close()
            })()
        }
        break
    case 'test':
        const block = new Block()
        block.mine()
        console.log(`Block nonce: ${block.nonce}`)
        break
}
