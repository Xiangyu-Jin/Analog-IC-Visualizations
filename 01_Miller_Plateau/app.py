import webview
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer

def get_base_path():
    try:
        # 兼容 PyInstaller 打包后的临时目录
        return sys._MEIPASS
    except Exception:
        return os.path.dirname(os.path.abspath(__file__))

def start_server(path):
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=path, **kwargs)
        def log_message(self, format, *args):
            pass # 关闭控制台的 HTTP 请求日志
            
    # 自动绑定一个空闲端口
    server = TCPServer(("127.0.0.1", 0), Handler)
    port = server.server_address[1]
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, port

def main():
    base_path = get_base_path()
    server, port = start_server(base_path)
    
    # 创建独立桌面窗口并加载本地服务器
    webview.create_window(
        'MOSFET Miller Plateau Interactive Viewer', 
        url=f'http://127.0.0.1:{port}/index.html',
        width=1350, 
        height=850,
        min_size=(1000, 600),
        background_color='#f0f2f5'
    )
    
    # 启动 WebView 循环
    webview.start()
    
    # 窗口关闭后停止本地服务器
    server.shutdown()

if __name__ == '__main__':
    main()
