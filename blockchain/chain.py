import hashlib
from time import time
from typing import List

from flask import Flask

from blockchain import to_json


class Transaction:
    def __init__(self, orig: str, dest: str, amount: float):
        self.orig = orig
        self.dest = dest
        self.amount = amount

    def __repr__(self):
        return str(to_json(self))

    def hash(self) -> bytes:
        m = hashlib.sha3_256()
        m.update(repr(self).encode('UTF8'))
        return m.digest()


class Block:
    def __init__(self, transactions: List[Transaction] = None, previous_hash: bytes = b''):
        self.timestamp = time()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.proof = 0

    def __repr__(self):
        return str(to_json(self))

    def hash(self) -> bytes:
        m = hashlib.sha3_256()
        m.update(repr(self).encode('UTF8'))
        return m.digest()

    def mine(self, length: int = 2):
        array = b'\x00' * length
        while self.hash()[:length] != array:
            self.proof += 1
        print(self.hash())


class Chain:
    def __init__(self, app: Flask = None):
        self.app = None
        self.blocks: List[Block] = [Block()]
        self.transactions: List[Transaction] = []
        if app is not None:
            self.init_app(app)

    def init_app(self, app: Flask):
        self.app = app

    def add_block(self):
        block = Block(self.transactions, previous_hash=self.blocks[-1].hash())
        block.mine()
        self.blocks.append(block)
        self.transactions = []

    def add_transaction(self, orig: str, dest: str, amount: float):
        self.transactions.append(Transaction(orig, dest, amount))

    def __repr__(self):
        return str(to_json(self))


chain = Chain()

if __name__ == '__main__':
    chain = Chain()
    chain.add_transaction("jp", "annie", 10.0)
    chain.add_transaction("annie", "martin", 5.0)
    chain.add_transaction("jp", "martin", 2.0)
    chain.add_block()
    print(repr(chain))
