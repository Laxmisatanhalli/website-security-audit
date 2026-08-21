import ssl
import socket
from datetime import datetime, timezone
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

    try:
        context = ssl.create_default_context()

        with socket.create_connection(
            (hostname, 443),
            timeout=10
        ) as sock:

            with context.wrap_socket(
                sock,
                server_hostname=hostname
            ) as secure_sock:

                certificate = secure_sock.getpeercert()

        expires_at = datetime.strptime(
            certificate["notAfter"],
            "%b %d %H:%M:%S %Y %Z"
        ).replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        days_remaining = (expires_at - now).days

        if days_remaining < 0:
            return [{
                "module": "SSL/TLS",
                "severity": "High",
                "issue": "SSL/TLS certificate has expired",
                "recommendation": "Renew the SSL/TLS certificate"
            }]

        if days_remaining <= 30:
            return [{
                "module": "SSL/TLS",
                "severity": "Medium",
                "issue": f"SSL/TLS certificate expires in {days_remaining} days",
                "recommendation": "Renew the SSL/TLS certificate soon"
            }]

        return [{
            "module": "SSL/TLS",
            "severity": "Info",
            "issue": f"SSL/TLS certificate is valid for {days_remaining} more days",
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

    except (KeyError, ValueError):
        return [{
            "module": "SSL/TLS",
            "severity": "High",
            "issue": "Unable to read SSL/TLS certificate information",
            "recommendation": "Check the website's SSL/TLS certificate"
        }]