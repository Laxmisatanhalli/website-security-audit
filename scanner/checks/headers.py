import sys
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


if len(sys.argv) < 2:
    print("Usage: python scanner.py <URL>")
    sys.exit(1)

url = sys.argv[1]

try:
    results = scan_website(url)

    for result in results:
        print(result)

except requests.exceptions.RequestException as e:
    print(f"Error scanning website: {e}")