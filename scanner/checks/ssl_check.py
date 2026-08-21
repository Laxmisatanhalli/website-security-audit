import ssl
import socket
from urllib.parse import urlparse


def check_ssl(url):
    parsed_url = urlparse(url)
    hostname = parsed_url.hostname

    if not hostname:
        return [{
            "module": "SSL/TLS",
            "severity": "High",
            "issue": "Invalid URL",
            "recommendation": "Provide a valid website URL"
        }]

    port = 443

    try:
        context = ssl.create_default_context()

        with socket.create_connection((hostname, port), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as secure_sock:
                certificate = secure_sock.getpeercert()

                return [{
                    "module": "SSL/TLS",
                    "severity": "Info",
                    "issue": "SSL/TLS certificate is valid",
                    "recommendation": "No action required"
                }]

    except ssl.SSLCertVerificationError:
        return [{
            "module": "SSL/TLS",
            "severity": "High",
            "issue": "SSL/TLS certificate verification failed",
            "recommendation": "Install a valid SSL/TLS certificate"
        }]

    except (ssl.SSLError, socket.timeout, socket.error) as error:
        return [{
            "module": "SSL/TLS",
            "severity": "High",
            "issue": f"SSL/TLS connection failed: {error}",
            "recommendation": "Check the website's SSL/TLS configuration"
        }]