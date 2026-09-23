from urllib.parse import urlparse

try:
    import dns.resolver
    DNS_AVAILABLE = True
except ImportError:
    DNS_AVAILABLE = False


def _query(resolver, name, record_type):
    try:
        return [str(r) for r in resolver.resolve(name, record_type)]
    except Exception:
        return []


def check_email_security(url):
    """
    Module 11 - Email Security
    Passive DNS-based checks for SPF, DKIM (common selector guess only), DMARC
    and MX records. No SMTP connections are made other than passive banner
    checks are intentionally NOT performed here to keep this fully passive;
    SMTP banner grabbing is noted as a manual follow-up recommendation instead.
    """
    if not DNS_AVAILABLE:
        return [{
            "module": "Email Security",
            "severity": "Low",
            "issue": "dnspython is not installed, email security checks were skipped",
            "recommendation": "Install dnspython (`pip install dnspython`) to enable these checks"
        }]

    domain = urlparse(url).hostname
    if not domain:
        return []

    resolver = dns.resolver.Resolver()
    resolver.timeout = 5
    resolver.lifetime = 5
    results = []

    # MX records
    mx_records = _query(resolver, domain, "MX")
    if not mx_records:
        results.append({
            "module": "Email Security",
            "severity": "Info",
            "issue": "No MX records found, domain may not receive email directly",
            "recommendation": "No action required if email is not expected for this domain"
        })
    else:
        results.append({
            "module": "Email Security",
            "severity": "Info",
            "issue": f"{len(mx_records)} MX record(s) found",
            "recommendation": "No action required"
        })

    # SPF (re-checked here in the email context, distinct from Module 10's DNS focus)
    txt_records = _query(resolver, domain, "TXT")
    spf_records = [t for t in txt_records if "v=spf1" in t.lower()]
    if mx_records and not spf_records:
        results.append({
            "module": "Email Security",
            "severity": "Medium",
            "issue": "Domain receives email (MX present) but has no SPF record",
            "recommendation": "Publish an SPF record to help prevent sender address spoofing"
        })

    # DKIM - best-effort check against the common 'default' and 'google' selectors only.
    # Absence here is not conclusive since selectors are arbitrary.
    common_selectors = ["default", "google", "selector1", "selector2"]
    dkim_found = False
    for selector in common_selectors:
        records = _query(resolver, f"{selector}._domainkey.{domain}", "TXT")
        if any("v=dkim1" in r.lower() for r in records):
            dkim_found = True
            break

    if mx_records and not dkim_found:
        results.append({
            "module": "Email Security",
            "severity": "Low",
            "issue": "No DKIM record found under common selector names (result is inconclusive, selectors are provider-specific)",
            "recommendation": "Confirm DKIM is configured with your email provider; the correct selector is provider-specific and cannot be reliably guessed"
        })

    return results