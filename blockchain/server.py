import asyncio


async def handle_echo(reader, writer):
    while True:
        data = await reader.read(100)
        print(f"Received {data}")
        if data == b'\x00':
            break
        writer.write(data)
        await writer.drain()
    writer.close()


async def start_server():
    server = await asyncio.start_server(handle_echo, '127.0.0.1', 8888)
    async with server:
        await server.serve_forever()


if __name__ == '__main__':
    asyncio.run(start_server())
