export class Transaction {
    readonly orig: string
    readonly dest: string
    readonly amount: number
    readonly _hash: number

    constructor(orig: string, dest: string, amount: number) {
        this.orig = orig
        this.dest = dest
        this.amount = amount
        this._hash = Math.random()
    }

    hash(): number {
        return this._hash
    }
}

export class Block {
    readonly transactions: Transaction[]
    readonly previousHash: number
    _hash: number

    constructor(transactions: Transaction[] = [], previousHash: number = 0) {
        this.transactions = transactions
        this.previousHash = previousHash
        this._hash = 0
    }

    async mine(maxSeconds: number): Promise<void> {
        return new Promise<void>(resolve => setTimeout(() => {
            this._hash = Math.random()
            resolve()
        }, Math.round(Math.random() * 1000 * maxSeconds)))
    }

    isMined(): boolean {
        return this._hash !== 0
    }

    hash(): number {
        return this._hash
    }
}

class Chain{
    readonly blocks: Block[] = []

    constructor() {
        const initialBlock = new Block()
        initialBlock.mine(5).then(() => this.blocks.push(initialBlock))
    }
}