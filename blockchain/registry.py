from flask import Flask


class Registry:
    def __init__(self, app: Flask = None):
        self.app = None
        self.neighbours = {}
        if app is not None:
            self.init_app(app)

    def init_app(self, app: Flask):
        self.app = app

    def add_neighbour(self, node_name: str, host: str):
        self.neighbours[node_name] = host
        self.app.logger.info(f"{self.app.name}: registered {node_name} to {host}")


registry = Registry()