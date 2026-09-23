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


def check_dns_security(url):
    """
    Module 10 - DNS Security
    Requires the 'dnspython' package. Checks SPF, DMARC, DNSSEC (via DS record
    presence at the parent zone, best-effort), CAA, and name servers.
    DKIM is not checked here since it requires knowing the selector; see
    check_email_security for the passive email-related checks.
    """
    if not DNS_AVAILABLE:
        return [{
            "module": "DNS Security",
            "severity": "Low",
            "issue": "dnspython is not installed, DNS checks were skipped",
            "recommendation": "Install dnspython (`pip install dnspython`) to enable DNS security checks"
        }]

    domain = urlparse(url).hostname
    if not domain:
        return [{
            "module": "DNS Security",
            "severity": "High",
            "issue": "Invalid URL, could not determine domain",
            "recommendation": "Provide a valid website URL"
        }]

    resolver = dns.resolver.Resolver()
    resolver.timeout = 5
    resolver.lifetime = 5
    results = []

    # SPF (published as a TXT record starting with v=spf1)
    txt_records = _query(resolver, domain, "TXT")
    spf_records = [t for t in txt_records if "v=spf1" in t.lower()]
    if not spf_records:
        results.append({
            "module": "DNS Security",
            "severity": "Medium",
            "issue": "No SPF record found",
            "recommendation": "Publish an SPF TXT record to reduce email spoofing risk",
            "fix": {"dns_txt": "v=spf1 include:_spf.example.com ~all"}
        })
    elif len(spf_records) > 1:
        results.append({
            "module": "DNS Security",
            "severity": "Medium",
            "issue": "Multiple SPF records found (only one is allowed per RFC 7208)",
            "recommendation": "Merge into a single SPF TXT record"
        })
    else:
        results.append({
            "module": "DNS Security",
            "severity": "Info",
            "issue": "A single valid SPF record was found",
            "recommendation": "No action required"
        })

    # DMARC
    dmarc_records = _query(resolver, f"_dmarc.{domain}", "TXT")
    dmarc_present = [t for t in dmarc_records if "v=dmarc1" in t.lower()]
    if not dmarc_present:
        results.append({
            "module": "DNS Security",
            "severity": "Medium",
            "issue": "No DMARC record found",
            "recommendation": "Publish a DMARC record to control handling of spoofed email",
            "fix": {"dns_txt": "_dmarc TXT \"v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com\""}
        })
    else:
        policy = "unknown"
        for rec in dmarc_present:
            if "p=none" in rec.lower():
                policy = "none"
        if policy == "none":
            results.append({
                "module": "DNS Security",
                "severity": "Low",
                "issue": "DMARC policy is set to 'p=none' (monitor only, no enforcement)",
                "recommendation": "Consider moving to p=quarantine or p=reject once monitoring confirms legitimate senders are covered"
            })
        else:
            results.append({
                "module": "DNS Security",
                "severity": "Info",
                "issue": "DMARC record found with an enforcing policy",
                "recommendation": "No action required"
            })

    # CAA
    caa_records = _query(resolver, domain, "CAA")
    if not caa_records:
        results.append({
            "module": "DNS Security",
            "severity": "Low",
            "issue": "No CAA record found",
            "recommendation": "Publish a CAA record to restrict which CAs may issue certificates for this domain",
            "fix": {"dns_caa": '0 issue "letsencrypt.org"'}
        })
    else:
        results.append({
            "module": "DNS Security",
            "severity": "Info",
            "issue": "CAA record(s) present",
            "recommendation": "No action required"
        })

    # DNSSEC (best-effort: presence of DS record at the domain apex)
    try:
        ds_records = _query(resolver, domain, "DS")
        if ds_records:
            results.append({
                "module": "DNS Security",
                "severity": "Info",
                "issue": "DNSSEC appears to be enabled (DS record present)",
                "recommendation": "No action required"
            })
        else:
            results.append({
                "module": "DNS Security",
                "severity": "Medium",
                "issue": "No DS record found, DNSSEC may not be enabled",
                "recommendation": "Enable DNSSEC with your DNS provider to protect against DNS spoofing/cache poisoning"
            })
    except Exception:
        pass

    # Name servers
    ns_records = _query(resolver, domain, "NS")
    if len(ns_records) < 2:
        results.append({
            "module": "DNS Security",
            "severity": "Medium",
            "issue": f"Only {len(ns_records)} name server(s) found",
            "recommendation": "Use at least two geographically diverse name servers for redundancy"
        })

    return results