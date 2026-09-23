import json
import sys
from urllib.parse import urlparse
import requests

from checks.headers import check_headers
from checks.ssl_check import check_ssl
from checks.robots import check_robots
from checks.sitemap import check_sitemap
from checks.cookies import check_cookies
from checks.info_disclosure import check_info_disclosure, check_phpinfo_exposure
from checks.directory_listing import check_directory_listing
from checks.sensitive_files import check_sensitive_files
from checks.http_methods import check_http_methods
from checks.redirects import check_redirects
from checks.server_info import check_server_info
from checks.dns_security import check_dns_security
from checks.cms_detection import check_cms_detection
from checks.wordpress import check_wordpress
from checks.performance import check_performance
from checks.email_security import check_email_security
from checks.codeigniter_check import check_codeigniter
from checks.php_security import check_php_security
from checks.config_audit import audit_apache, audit_nginx, generate_apache_vhost, generate_nginx_server_block
from checks.linux_hardening import get_linux_recommendations
from checks.cloudflare_check import check_cloudflare_passive, check_cloudflare_api


def scan_website(url, cf_zone_id=None, cf_api_token=None):
    results = []

    try:
        response = requests.get(url, timeout=10)
    except requests.RequestException as error:
        results.append({
            "module": "HTTP Request",
            "severity": "High",
            "issue": f"Unable to access website: {error}",
            "recommendation": "Check the URL and make sure the website is reachable"
        })
        return results

    # --- Checks that need the initial response/headers ---
    results.extend(check_headers(response.headers))
    results.extend(check_info_disclosure(response.headers))
    results.extend(check_server_info(url, response.headers))
    results.extend(check_php_security(url, response.headers, page_body=response.text))

    # --- Checks that make their own requests ---
    results.extend(check_ssl(url))
    results.extend(check_robots(url))
    results.extend(check_sitemap(url))
    results.extend(check_cookies(url))
    results.extend(check_directory_listing(url))
    results.extend(check_sensitive_files(url))
    results.extend(check_phpinfo_exposure(url))
    results.extend(check_http_methods(url))
    results.extend(check_redirects(url))
    results.extend(check_dns_security(url))
    results.extend(check_performance(url, response.headers))
    results.extend(check_email_security(url))

    # CMS detection first, so WordPress/CodeIgniter checks can skip
    # themselves on sites that clearly aren't running that platform.
    cms_results = check_cms_detection(url)
    results.extend(cms_results)
    detected_cms = [r["data"]["cms"] for r in cms_results if "data" in r]
    results.extend(check_wordpress(url, detected_cms))
    results.extend(check_codeigniter(url, detected_cms))

    # Cloudflare: passive detection always runs; active API validation only
    # runs if the caller supplied credentials for this website.
    results.append(check_cloudflare_passive(response.headers))
    results.extend(check_cloudflare_api(cf_zone_id, cf_api_token))

    # Linux Server Security: standing recommendations, not tied to a probe.
    results.append(get_linux_recommendations())

    # Apache/Nginx audits are compiled from everything gathered above, then
    # used to generate one consolidated hardened config per server type.
    # The generated config text is attached inside each audit finding's
    # `data` field so the overall return value stays a flat findings array
    # (required by the existing Node scanner.service.js / scanRunner.service.js
    # contract, which does results.filter(...) / results.find(...) on a list).
    hostname = urlparse(url).hostname or "yourdomain.com"
    apache_config = generate_apache_vhost(results, hostname)
    nginx_config = generate_nginx_server_block(results, hostname)

    results.append(audit_apache(results, generated_config=apache_config))
    results.append(audit_nginx(results, generated_config=nginx_config))

    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Please provide a website URL."}))
        sys.exit(1)

    target_url = sys.argv[1]
    zone_id = sys.argv[2] if len(sys.argv) > 2 else None
    api_token = sys.argv[3] if len(sys.argv) > 3 else None

    output = scan_website(target_url, cf_zone_id=zone_id, cf_api_token=api_token)
    print(json.dumps(output))