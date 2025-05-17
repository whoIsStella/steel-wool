from mitmproxy import http

def request(flow: http.HTTPFlow) -> None:
    headers = flow.request.headers
    for h in ["User-Agent", "Referer", "X-Forwarded-For", "ETag"]:
        if h in headers:
            del headers[h]
