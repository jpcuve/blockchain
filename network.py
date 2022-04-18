from multiprocessing import Process

from blockchain import create_app


def launch(port: int):
    app = create_app(node_name=f"node-{port}")
    app.run(port=port)


if __name__ == '__main__':
    for port in range(4000, 4010):
        p = Process(target=launch, args=(port,))
        p.start()
