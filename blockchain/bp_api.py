import requests
from flask import Blueprint, jsonify, request, current_app
from blockchain.registry import registry

bp = Blueprint('api', __name__, url_prefix='/api')


@bp.route('/')
def api_index():
    return jsonify(status="ok")


@bp.route('/announce')
def api_announce():
    host = request.args.get('host')
    if host is not None:
        res = requests.get(f'{host}/api/register?node-name={current_app.name}&port={current_app.port}', timeout=10)
        if not res.ok:
            raise RuntimeError(f"Cannot register to: {host}")
        registry.add_neighbour(res.text, host)
    return jsonify(status="ok")


@bp.route('/register')
def api_register():
    node_name = request.args.get('node-name')
    port = request.args.get('port')
    if node_name is not None and port is not None:
        remote_host = f'{request.scheme}://{request.remote_addr}:{port}'
        registry.add_neighbour(node_name, remote_host)
    return current_app.name
