import {Node} from './node'
import {Block} from './chain'

/*
for (let i = 0; i < 10; i++){
    const node = new Node(`node-${i}`, 4000 + i)
    node.listen()
}
*/

const block = new Block()
block.mine()
console.log(`Block nonce: ${block.nonce}`)