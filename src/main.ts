import {Node} from './node'

for (let i = 0; i < 10; i++){
    const node = new Node(`node-${i}`, 4000 + i)
    node.listen()
}
