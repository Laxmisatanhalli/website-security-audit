import socket
import requests
from urllib.parse import urlparse


def check_server_info(url, headers):
    """
    Module 9 - Server Information
    Collects best-effort, passive server/network information.
    This is informational and does not assign severities beyond Info,
    except where it usefully flags something (e.g. IPv6-only or unreachable).
    """
    results = []
    parsed = urlparse(url)
    hostname = parsed.hostname

    info = {
        "ip_address": None,
        "server_header": headers.get("Server"),
        "http_version": None,
        "compression": headers.get("Content-Encoding"),
        "cdn_or_proxy_hint": None,
    }

    try:
        info["ip_address"] = socket.gethostbyname(hostname)
    except socket.gaierror:
        pass

    # Lightweight CDN / reverse proxy heuristic from response headers
    cdn_headers = {
        "cf-ray": "Cloudflare",
        "x-amz-cf-id": "Amazon CloudFront",
        "x-cache": "CDN/Proxy cache header present",
        "x-served-by": "Fastly/CDN",
        "x-vercel-id": "Vercel",
    }
    for h, label in cdn_headers.items():
        if h in {k.lower() for k in headers.keys()}:
            info["cdn_or_proxy_hint"] = label
            break

    try:
        resp = requests.get(url, timeout=10)
        info["http_version"] = "HTTP/2" if getattr(resp.raw, "version", None) == 20 else "HTTP/1.x"
    except requests.RequestException:
        pass

    results.append({
        "module": "Server Information",
        "severity": "Info",
        "issue": (
            f"IP: {info['ip_address'] or 'unresolved'}, "
            f"Server: {info['server_header'] or 'not disclosed'}, "
            f"Compression: {info['compression'] or 'none detected'}, "
            f"CDN/Proxy: {info['cdn_or_proxy_hint'] or 'not detected'}"
        ),
        "recommendation": "Informational only, no action required",
        "data": info
    })

    return results