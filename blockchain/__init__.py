from flask import Flask


def create_app() -> Flask:
    app = Flask(__name__)

    @app.route('/')
    def index():
        return "Blockchain"

    from blockchain.chain import chain
    chain.init_app(app)

    return app