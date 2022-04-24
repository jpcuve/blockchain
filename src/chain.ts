import {createHash} from "crypto";

export class Transaction {
    readonly orig: string
    readonly dest: string
    readonly amount: number

    constructor(orig: string, dest: string, amount: number) {
        this.orig = orig
        this.dest = dest
        this.amount = amount
    }

    hash(): Buffer {
        const buffer = Buffer.allocUnsafe(8)
        buffer.writeDoubleBE(this.amount)
        return createHash('sha256')
            .update(this.orig)
            .update(this.dest)
            .update(buffer)
            .digest()
    }
}

export class Block {
    static BUFFER_ZERO = Buffer.allocUnsafe(64).fill(0)
    readonly transactions: Transaction[]
    readonly previousHash: Buffer
    nonce: number = 0

    constructor(transactions: Transaction[] = [], previousHash: Buffer = Buffer.allocUnsafe(0)) {
        this.transactions = transactions
        this.previousHash = previousHash
    }

    mine(length: number = 2) {
        while (!this.isValid(length)){
            this.nonce++
        }
    }

    isValid(length: number = 2): boolean {
        return Buffer.compare(this.hash().slice(0, length), Block.BUFFER_ZERO.slice(0, length)) === 0
    }

    hash(): Buffer {
        const hash = createHash('sha256')
        this.transactions.forEach(it => hash.update(it.hash()))
        hash.update(this.previousHash)
        const buffer = Buffer.allocUnsafe(4)
        buffer.writeUint32BE(this.nonce)
        hash.update(buffer)
        return hash.digest()
    }
}

class Chain{
    readonly blocks: Block[] = []

    constructor() {
        const initialBlock = new Block()
        initialBlock.mine()
        this.blocks.push(initialBlock)
    }
}