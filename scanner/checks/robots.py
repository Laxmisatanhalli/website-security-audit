import requests
from urllib.parse import urlparse


def check_robots(url):
    parsed_url = urlparse(url)

    if not parsed_url.scheme or not parsed_url.netloc:
        return [{
            "module": "Robots.txt",
            "severity": "High",
            "issue": "Invalid URL",
            "recommendation": "Provide a valid website URL"
        }]

    robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"

    try:
        response = requests.get(robots_url, timeout=10)

        if response.status_code == 404:
            return [{
                "module": "Robots.txt",
                "severity": "Low",
                "issue": "robots.txt file is missing",
                "recommendation": "Create a robots.txt file if crawler instructions are required"
            }]

        if response.status_code != 200:
            return [{
                "module": "Robots.txt",
                "severity": "Medium",
                "issue": f"robots.txt returned HTTP {response.status_code}",
                "recommendation": "Make sure robots.txt is publicly accessible"
            }]

        content = response.text

        for line in content.splitlines():
            line = line.strip()

            if line.lower() == "disallow: /":
                return [{
                    "module": "Robots.txt",
                    "severity": "Medium",
                    "issue": "robots.txt blocks all crawlers",
                    "recommendation": "Review the Disallow rule and make sure blocking the entire website is intentional"
                }]

        return [{
            "module": "Robots.txt",
            "severity": "Info",
            "issue": "robots.txt is present and accessible",
            "recommendation": "No action required"
        }]

    except requests.RequestException as error:
        return [{
            "module": "Robots.txt",
            "severity": "Medium",
            "issue": f"Unable to access robots.txt: {error}",
            "recommendation": "Check whether robots.txt is publicly accessible"
        }]