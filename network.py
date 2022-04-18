from multiprocessing import Process
from time import sleep

import requests

from blockchain import create_app


def launch(port: int):
    app = create_app(node_name=f"node-{port}", port=port)
    app.run(port=port)


def announce(from_port: int, to_port: int):
    res = requests.get(f'http://localhost:{from_port}/api/announce?host=http://localhost:{to_port}', timeout=10)
    if not res.ok:
        raise RuntimeError("Cannot announce")


if __name__ == '__main__':
    node_count = 10
    processes = [Process(target=launch, args=(4000 + port,)) for port in range(node_count)]
    for p in processes:
        p.start()  # these processes never finish
    sleep(2)
    processes = [Process(target=announce, args=(4000 + port, 4000 + (port + 1) % node_count))
                 for port in range(node_count)]
    for p in processes:
        p.start()
    for p in processes:
        p.join()

