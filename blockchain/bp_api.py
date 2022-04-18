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
        res = requests.get(f'{host}/api/register?port={current_app.port}', timeout=10)
        if not res.ok:
            raise RuntimeError(f"Cannot register to: {host}")
        registry.add_neighbour(host)
    return jsonify(status="ok")


@bp.route('/register')
def api_register():
    port = request.args.get('port')
    if port is not None:
        remote_host = f'{request.scheme}://{request.remote_addr}:{port}'
        registry.add_neighbour(remote_host)
    return current_app.name


@bp.route('/neighbours')
def api_neighbours():
    return jsonify(list(registry.neighbours))
