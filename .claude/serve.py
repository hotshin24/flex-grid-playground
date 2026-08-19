#!/usr/bin/env python3
"""Static dev server for the flexbox playground.

Serves the project directory on 0.0.0.0 so phones/tablets on the same
Wi-Fi can open it. Sends no-cache headers so a reload always gets fresh files.

Threaded. The page loads four stylesheets and a module graph of ~30 files, and
a single-threaded server answers them one at a time — the browser waits on a
queue that would not exist on any real host. Lighthouse read that queue as the
site being slow, and the score swung 59~80 between runs on identical code.
"""
import functools
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 7788


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()


class Server(http.server.ThreadingHTTPServer):
    allow_reuse_address = True
    # Threads die with the process. Ctrl-C should not wait on a stuck request.
    daemon_threads = True


os.chdir(ROOT)
with Server(("0.0.0.0", PORT), functools.partial(Handler, directory=ROOT)) as httpd:
    print("serving %s at http://0.0.0.0:%d" % (ROOT, PORT), flush=True)
    httpd.serve_forever()
