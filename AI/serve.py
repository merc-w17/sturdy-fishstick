import http.server
import socketserver
import threading
import webbrowser

PORT = 8000

close_event = threading.Event()

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/__close__":
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(b"<script>window.close()</script>")
            close_event.set()
            return
        return super().do_GET()

httpd = socketserver.TCPServer(("", PORT), Handler)

def server_thread():
    httpd.serve_forever()

t = threading.Thread(target=server_thread, daemon=True)
t.start()

webbrowser.open(f"http://localhost:{PORT}")

print(f"Serving at http://localhost:{PORT}")
print("Type 'close' and press Enter to stop the server.")

try:
    while True:
        cmd = input().strip().lower()
        if cmd == "close":
            import urllib.request
            try:
                urllib.request.urlopen(f"http://localhost:{PORT}/__close__")
            except:
                pass
            break
finally:
    httpd.shutdown()
    print("Server stopped.")
