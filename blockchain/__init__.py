from flask import Flask


def create_app(node_name: str = None) -> Flask:
    app = Flask(__name__ if node_name is None else node_name)

    @app.route('/')
    def index():
        return app.name

    from blockchain.chain import chain
    chain.init_app(app)

    return app
