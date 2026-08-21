import requests
from checks.headers import check_headers

def scan_website(url):

    response = requests.get(url, timeout=10)

    results = []

    results.extend(check_headers(response.headers))

    return results


results = scan_website("https://example.com")

for result in results:
    print(result)