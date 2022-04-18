import hashlib
import struct
from time import time
from typing import List

from flask import Flask


class Transaction:
    def __init__(self, orig: str, dest: str, amount: float):
        self.orig = orig
        self.dest = dest
        self.amount = amount

    def hash(self) -> bytes:
        m = hashlib.md5()
        m.update(self.orig.encode('UTF8'))
        m.update(self.dest.encode('UTF8'))
        m.update(struct.pack('!d', self.amount))
        return m.digest()


class Block:
    def __init__(self, transactions: List[Transaction] = None, previous_hash: bytes = b''):
        self.timestamp = time()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.proof = 0

    def hash(self) -> bytes:
        m = hashlib.md5()
        m.update(struct.pack('!d', self.timestamp))
        if self.transactions is not None:
            for transaction in self.transactions:
                m.update(transaction.hash())
        m.update(self.proof.to_bytes(16, byteorder='big'))
        m.update(self.previous_hash)
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


chain = Chain()

if __name__ == '__main__':
    chain = Chain()
    chain.add_transaction("jp", "annie", 10.0)
    chain.add_transaction("annie", "martin", 5.0)
    chain.add_transaction("jp", "martin", 2.0)
    chain.add_block()
