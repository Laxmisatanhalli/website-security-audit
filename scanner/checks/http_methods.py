import requests

RISKY_METHODS = {
    "PUT": "High",
    "DELETE": "High",
    "TRACE": "Medium",
    "CONNECT": "Medium",
}


def check_http_methods(url):
    """
    Module 7 - HTTP Methods
    Sends a single non-intrusive OPTIONS request and inspects the Allow header.
    Does not attempt to invoke risky methods.
    """
    try:
        response = requests.options(url, timeout=10)
    except requests.RequestException as error:
        return [{
            "module": "HTTP Methods",
            "severity": "Low",
            "issue": f"Unable to send OPTIONS request: {error}",
            "recommendation": "Verify the server accepts OPTIONS requests"
        }]

    allow_header = response.headers.get("Allow") or response.headers.get("Access-Control-Allow-Methods")

    if not allow_header:
        return [{
            "module": "HTTP Methods",
            "severity": "Info",
            "issue": "Server did not return an Allow header for OPTIONS",
            "recommendation": "No action required, or verify OPTIONS handling manually"
        }]

    methods = [m.strip().upper() for m in allow_header.split(",")]
    results = []

    for method in methods:
        if method in RISKY_METHODS:
            results.append({
                "module": "HTTP Methods",
                "severity": RISKY_METHODS[method],
                "issue": f"Potentially risky HTTP method enabled: {method}",
                "recommendation": f"Disable {method} unless explicitly required by the application",
                "fix": {
                    "apache": f'<LimitExcept GET POST HEAD>\n    Require all denied\n</LimitExcept>',
                    "nginx": f'if ($request_method !~ ^(GET|POST|HEAD)$) {{ return 405; }}'
                }
            })

    if not results:
        results.append({
            "module": "HTTP Methods",
            "severity": "Info",
            "issue": f"Enabled methods appear reasonable: {', '.join(methods)}",
            "recommendation": "No action required"
        })

    return results