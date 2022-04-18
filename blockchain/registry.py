from flask import Flask


class Registry:
    def __init__(self, app: Flask = None):
        self.app = None
        self.neighbours = set()
        if app is not None:
            self.init_app(app)

    def init_app(self, app: Flask):
        self.app = app

    def add_neighbour(self, host: str):
        self.neighbours.add(host)
        self.app.logger.info(f"{self.app.name}: neighbours {self.neighbours}")


registry = Registry()