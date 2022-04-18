from flask import Flask


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


def create_app(node_name: str = None) -> Flask:
    app = Flask(__name__ if node_name is None else node_name)

    @app.route('/')
    def index():
        return app.name

    from blockchain.chain import chain
    chain.init_app(app)

    return app
