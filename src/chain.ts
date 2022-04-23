import {createHash} from "crypto";

class Transaction {
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

class Block {
    readonly transactions: Transaction[]
    readonly previousHash: Buffer
    private proof: number = 0

    constructor(transactions: Transaction[] = [], previousHash: Buffer = Buffer.allocUnsafe(0)) {
        this.transactions = transactions
        this.previousHash = previousHash
    }

    mine(length: number = 2) {
        const comp = Buffer.allocUnsafe(length).fill(0)
        while (Buffer.compare(this.hash().slice(0, length), comp)){
            this.proof++
        }
    }

    hash(): Buffer {
        const hash = createHash('sha256')
        this.transactions.forEach(it => hash.update(it.hash()))
        hash.update(this.previousHash)
        const buffer = Buffer.allocUnsafe(8)
        buffer.writeUint32BE(this.proof)
        hash.update(buffer)
        return hash.digest()
    }
}