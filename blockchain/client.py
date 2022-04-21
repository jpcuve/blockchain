import asyncio


async def tcp_echo_client():
    reader, writer = await asyncio.open_connection('127.0.0.1', 8888)
    for i in range(100):
        writer.write(f"Message {i}\n".encode('utf8'))
        await writer.drain()
        data = await reader.read(100)  # if this data does not contain newline, it is not complete
        print(f"Received: {data.decode()}")
    writer.write(b'\x00')  # means please close the connection
    await writer.drain()
    writer.close()
    await writer.wait_closed()


if __name__ == '__main__':
    asyncio.run(tcp_echo_client())
