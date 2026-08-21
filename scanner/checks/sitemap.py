import requests
import xml.etree.ElementTree as ET
from urllib.parse import urlparse


def check_sitemap(url):
    parsed_url = urlparse(url)

    if not parsed_url.scheme or not parsed_url.netloc:
        return [{
            "module": "Sitemap",
            "severity": "High",
            "issue": "Invalid URL",
            "recommendation": "Provide a valid website URL"
        }]

    sitemap_url = f"{parsed_url.scheme}://{parsed_url.netloc}/sitemap.xml"

    try:
        response = requests.get(sitemap_url, timeout=10)

        if response.status_code == 404:
            return [{
                "module": "Sitemap",
                "severity": "Low",
                "issue": "sitemap.xml file is missing",
                "recommendation": "Create a sitemap.xml file if the website should be discoverable by search engines"
            }]

        if response.status_code != 200:
            return [{
                "module": "Sitemap",
                "severity": "Medium",
                "issue": f"sitemap.xml returned HTTP {response.status_code}",
                "recommendation": "Make sure sitemap.xml is publicly accessible"
            }]

        try:
            root = ET.fromstring(response.content)
        except ET.ParseError:
            return [{
                "module": "Sitemap",
                "severity": "High",
                "issue": "sitemap.xml contains invalid XML",
                "recommendation": "Fix the sitemap XML structure"
            }]

        if root.tag.endswith("urlset") or root.tag.endswith("sitemapindex"):
            return [{
                "module": "Sitemap",
                "severity": "Info",
                "issue": "sitemap.xml is present and contains valid XML",
                "recommendation": "No action required"
            }]

        return [{
            "module": "Sitemap",
            "severity": "Medium",
            "issue": "sitemap.xml has an unexpected XML structure",
            "recommendation": "Make sure the sitemap follows the standard sitemap XML format"
        }]

    except requests.RequestException as error:
        return [{
            "module": "Sitemap",
            "severity": "Medium",
            "issue": f"Unable to access sitemap.xml: {error}",
            "recommendation": "Check whether sitemap.xml is publicly accessible"
        }]