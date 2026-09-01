import http.server
import socketserver
import urllib.request
import urllib.parse
import sys

PORT = 8000

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/proxy_dasar_hukum':
            try:
                target_url = 'https://ppid.tangerangkota.go.id/dasar_hukum'
                req = urllib.request.Request(
                    target_url,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    }
                )
                with urllib.request.urlopen(req, timeout=15) as response:
                    content = response.read()
                    html = content.decode('utf-8', errors='ignore')
                    
                    # Inject <base> tag so all css/js/images resolve to ppid.tangerangkota.go.id
                    if '<head>' in html:
                        html = html.replace('<head>', '<head><base href="https://ppid.tangerangkota.go.id/">', 1)
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    # Do NOT send X-Frame-Options or CSP headers, allowing embed in iframe!
                    self.end_headers()
                    self.wfile.write(html.encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(f"<div style='padding:20px;font-family:sans-serif;'><h3>Gagal memuat halaman live:</h3><p>{e}</p></div>".encode('utf-8'))
        else:
            super().do_GET()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
        print(f"Proxy Server running at http://localhost:{PORT}")
        sys.stdout.flush()
        httpd.serve_forever()
