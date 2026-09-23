def get_linux_recommendations():
    """
    Module - Linux Server Hardening
    Not tied to any live probe (the scanner has no shell access to the
    target's server) - these are standing best-practice recommendations
    surfaced alongside the rest of the report. Returns a single finding
    since scanner.py appends it directly.
    """
    checklist = [
        "Disable root SSH login, use SSH keys instead of passwords",
        "Keep the OS and packages patched (e.g. unattended-upgrades)",
        "Enable and configure a firewall (ufw/firewalld) restricting inbound ports",
        "Install fail2ban or equivalent to block brute-force attempts",
        "Disable unused services and close unused ports",
        "Run application processes as least-privilege, non-root users",
        "Enable centralized logging and alerting",
    ]

    return {
        "module": "Linux Server Hardening",
        "severity": "Info",
        "issue": "Standing Linux server hardening recommendations",
        "recommendation": "; ".join(checklist),
        "data": {"checklist": checklist}
    }