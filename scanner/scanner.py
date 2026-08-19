import requests

def scan_website(url):
    response = requests.get(url, timeout=10)
    headers = response.headers

    results = []

    security_headers = {
        "X-Frame-Options": "Medium",
        "X-Content-Type-Options": "Low",
        "Content-Security-Policy": "High",
        "Strict-Transport-Security": "High"
    }

    for header, severity in security_headers.items():
        if header not in headers:
            results.append({
                "module": "HTTP Security Headers",
                "severity": severity,
                "issue": f"{header} header is missing",
                "recommendation": f"Add the {header} security header"
            })

    return results


results = scan_website("https://example.com")

for result in results:
    print(result)