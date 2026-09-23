import requests


def check_performance(url, headers):
    """
    Module 12 - Performance & Optimization
    Passive checks derived from response headers of a single request.
    """
    results = []

    encoding = headers.get("Content-Encoding", "").lower()
    if "gzip" not in encoding and "br" not in encoding:
        results.append({
            "module": "Performance & Optimization",
            "severity": "Low",
            "issue": "Response is not compressed (no gzip or Brotli detected)",
            "recommendation": "Enable compression to reduce payload size and improve load times",
            "fix": {
                "apache": "LoadModule deflate_module modules/mod_deflate.so\nAddOutputFilterByType DEFLATE text/html text/css application/javascript",
                "nginx": "gzip on;\ngzip_types text/plain text/css application/javascript application/json;"
            }
        })
    elif "br" in encoding:
        results.append({
            "module": "Performance & Optimization",
            "severity": "Info",
            "issue": "Brotli compression is enabled",
            "recommendation": "No action required"
        })
    else:
        results.append({
            "module": "Performance & Optimization",
            "severity": "Info",
            "issue": "GZIP compression is enabled",
            "recommendation": "Consider adding Brotli for further size reduction"
        })

    cache_control = headers.get("Cache-Control")
    if not cache_control:
        results.append({
            "module": "Performance & Optimization",
            "severity": "Low",
            "issue": "No Cache-Control header set for browser caching",
            "recommendation": "Set Cache-Control headers for static assets to leverage browser caching",
            "fix": {
                "apache": "ExpiresActive On\nExpiresByType text/css \"access plus 1 month\"",
                "nginx": "location ~* \\.(css|js|png|jpg)$ { expires 30d; }"
            }
        })

    try:
        resp = requests.get(url, timeout=10)
        http_version = getattr(resp.raw, "version", None)
        if http_version != 20:
            results.append({
                "module": "Performance & Optimization",
                "severity": "Low",
                "issue": "HTTP/2 does not appear to be in use",
                "recommendation": "Enable HTTP/2 (and HTTP/3 where supported) for improved performance",
                "fix": {
                    "apache": "Protocols h2 http/1.1",
                    "nginx": "listen 443 ssl http2;"
                }
            })
        else:
            results.append({
                "module": "Performance & Optimization",
                "severity": "Info",
                "issue": "HTTP/2 is in use",
                "recommendation": "No action required"
            })
    except requests.RequestException:
        pass

    connection = headers.get("Connection", "").lower()
    if connection == "close":
        results.append({
            "module": "Performance & Optimization",
            "severity": "Low",
            "issue": "KeepAlive does not appear to be enabled (Connection: close)",
            "recommendation": "Enable KeepAlive to reduce connection overhead for repeat requests",
            "fix": {
                "apache": "KeepAlive On\nMaxKeepAliveRequests 100\nKeepAliveTimeout 5"
            }
        })

    return results