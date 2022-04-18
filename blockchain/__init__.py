from flask import Flask
import logging


def to_json(o):
    ret = {}
    for key in o.__dict__.keys():
        value = getattr(o, key)
        if isinstance(value, int) or isinstance(value, float) or isinstance(value, str):
            ret[key] = value
        elif isinstance(value, bytes):
            ret[key] = value.hex()
        elif isinstance(value, list):
            ret[key] = [to_json(oo) for oo in value]
        elif value is not None:
            ret[key] = to_json(value)
    return ret


def create_app(node_name: str = None, port: int = 0, test: bool = False) -> Flask:
    app = Flask(__name__ if node_name is None else node_name)
    app.port = port
    app.development = app.config['ENV'] == 'development' or test
    logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s',
                        level=logging.DEBUG if app.development else logging.INFO)

    @app.route('/')
    def index():
        return app.name

    from blockchain.bp_api import bp
    app.register_blueprint(bp)
    from blockchain.chain import chain
    chain.init_app(app)
    from blockchain.registry import registry
    registry.init_app(app)

    return app
