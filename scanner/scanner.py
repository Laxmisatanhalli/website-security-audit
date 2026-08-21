import requests
from checks.headers import check_headers
from checks.ssl_check import check_ssl
from checks.robots import check_robots
from checks.sitemap import check_sitemap

def scan_website(url):

    response = requests.get(url, timeout=10)

    results = []

    results.extend(check_headers(response.headers))
    results.extend(check_ssl(url))
    results.extend(check_robots(url))
    results.extend(check_sitemap(url))

    return results


results = scan_website("https://example.com")

for result in results:
    print(result)