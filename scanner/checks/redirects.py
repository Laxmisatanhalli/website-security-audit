import requests
from urllib.parse import urlparse


def check_redirects(url):
    """
    Module 8 - Redirect Analysis
    Checks HTTP -> HTTPS enforcement and counts redirect hops.
    """
    results = []
    parsed = urlparse(url)

    # HTTP -> HTTPS check
    if parsed.scheme == "https":
        http_url = "http://" + parsed.netloc + parsed.path
        try:
            resp = requests.get(http_url, timeout=10, allow_redirects=True)
            final_scheme = urlparse(resp.url).scheme
            if final_scheme != "https":
                results.append({
                    "module": "Redirect Analysis",
                    "severity": "High",
                    "issue": "HTTP requests are not redirected to HTTPS",
                    "recommendation": "Force all HTTP traffic to redirect to HTTPS",
                    "fix": {
                        "apache": "RewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]",
                        "nginx": "server {\n    listen 80;\n    return 301 https://$host$request_uri;\n}"
                    }
                })
            else:
                results.append({
                    "module": "Redirect Analysis",
                    "severity": "Info",
                    "issue": "HTTP requests correctly redirect to HTTPS",
                    "recommendation": "No action required"
                })
        except requests.RequestException as error:
            results.append({
                "module": "Redirect Analysis",
                "severity": "Low",
                "issue": f"Could not test HTTP endpoint: {error}",
                "recommendation": "Manually verify HTTP to HTTPS redirection"
            })

    # Redirect chain length + loop check
    try:
        resp = requests.get(url, timeout=10, allow_redirects=True)
        hop_count = len(resp.history)

        if hop_count > 3:
            results.append({
                "module": "Redirect Analysis",
                "severity": "Medium",
                "issue": f"Request went through {hop_count} redirects before reaching final destination",
                "recommendation": "Reduce the number of redirect hops to improve performance and reduce attack surface"
            })

        visited = [r.url for r in resp.history] + [resp.url]
        if len(visited) != len(set(visited)):
            results.append({
                "module": "Redirect Analysis",
                "severity": "High",
                "issue": "A redirect loop was detected",
                "recommendation": "Review redirect rules for circular references"
            })
    except requests.TooManyRedirects:
        results.append({
            "module": "Redirect Analysis",
            "severity": "High",
            "issue": "Too many redirects encountered (possible redirect loop)",
            "recommendation": "Review redirect configuration"
        })
    except requests.RequestException as error:
        results.append({
            "module": "Redirect Analysis",
            "severity": "Low",
            "issue": f"Unable to fully analyze redirects: {error}",
            "recommendation": "Manually verify redirect behavior"
        })

    if not results:
        results.append({
            "module": "Redirect Analysis",
            "severity": "Info",
            "issue": "No redirect issues detected",
            "recommendation": "No action required"
        })

    return results