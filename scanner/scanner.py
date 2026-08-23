import json
import sys
import requests

from checks.headers import check_headers
from checks.ssl_check import check_ssl
from checks.robots import check_robots
from checks.sitemap import check_sitemap


def scan_website(url):
    results = []

    try:
        response = requests.get(url, timeout=10)

        results.extend(check_headers(response.headers))

    except requests.RequestException as error:
        results.append({
            "module": "HTTP Request",
            "severity": "High",
            "issue": f"Unable to access website: {error}",
            "recommendation": "Check the URL and make sure the website is reachable"
        })

        return results

    results.extend(check_ssl(url))
    results.extend(check_robots(url))
    results.extend(check_sitemap(url))

    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Please provide a website URL."
        }))
        sys.exit(1)

    url = sys.argv[1]

    results = scan_website(url)

    print(json.dumps(results))