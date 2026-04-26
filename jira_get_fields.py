#!/usr/bin/env python3
"""Lay thong tin cac custom field bat buoc"""
import requests
import json

JIRA_BASE_URL = "https://jira.fci.vn"
JIRA_EMAIL = "thuanlt11@fpt.com"
JIRA_API_TOKEN = "Dat0208@2013"
PROJECT_KEY = "NCPP"
auth = (JIRA_EMAIL, JIRA_API_TOKEN)
headers = {"Accept": "application/json"}

# 1. Lay components cua project
print("=== COMPONENTS ===")
resp = requests.get(f"{JIRA_BASE_URL}/rest/api/2/project/{PROJECT_KEY}", auth=auth, headers=headers, timeout=10)
if resp.status_code == 200:
    data = resp.json()
    for c in data.get("components", []):
        print(f"  {c['id']}: {c['name']}")

# 2. Lay metadata cua issue type Bug de xem cac field bat buoc
print("\n=== FIELD META FOR BUG ===")
resp = requests.get(
    f"{JIRA_BASE_URL}/rest/api/2/issue/createmeta",
    params={"projectKeys": PROJECT_KEY, "issuetypeNames": "Bug", "expand": "projects.issuetypes.fields"},
    auth=auth,
    headers=headers,
    timeout=15
)
if resp.status_code == 200:
    data = resp.json()
    projects = data.get("projects", [])
    if projects:
        issue_types = projects[0].get("issuetypes", [])
        if issue_types:
            fields = issue_types[0].get("fields", {})
            for key, val in fields.items():
                required = val.get("required", False)
                name = val.get("name", "N/A")
                schema = val.get("schema", {}).get("type", "")
                allowed_values = val.get("allowedValues", None)
                if required or "customfield" in key:
                    flag = "*REQUIRED*" if required else ""
                    print(f"  {key}: {name} {flag} (type={schema})")
                    if allowed_values:
                        for av in allowed_values[:10]:
                            print(f"    -> {av.get('id', '?')}: {av.get('name', av.get('value', '?'))}")
else:
    print(f"FAIL: {resp.status_code} - {resp.text[:300]}")

# 3. Lay tat ca custom fields
print("\n=== ALL CUSTOM FIELDS ===")
resp = requests.get(f"{JIRA_BASE_URL}/rest/api/2/field", auth=auth, headers=headers, timeout=10)
if resp.status_code == 200:
    data = resp.json()
    for f in data:
        fid = f.get("id", "")
        if "customfield" in fid:
            fname = f.get("name", "")
            if fid in ["customfield_13810", "customfield_10532"]:
                print(f"  ** {fid}: {fname} **")
                print(f"     schema: {f.get('schema', {})}")
else:
    print(f"FAIL: {resp.status_code}")