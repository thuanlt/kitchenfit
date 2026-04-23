#!/usr/bin/env python3
"""Test post 1 bug len Jira"""

import requests
import json

JIRA_BASE_URL = "https://jira.fci.vn"
JIRA_EMAIL = "thuanlt11@fpt.com"
JIRA_API_TOKEN = "Dat0208@2013"
PROJECT_KEY = "NCPP"

def test_connection():
    print("1. Test ket noi Jira...")
    try:
        resp = requests.get(
            f"{JIRA_BASE_URL}/rest/api/2/myself",
            auth=(JIRA_EMAIL, JIRA_API_TOKEN),
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            print(f"   OK! User: {data.get('displayName', 'N/A')}")
            return True
        else:
            print(f"   FAIL! Status: {resp.status_code}")
            print(f"   {resp.text[:300]}")
            return False
    except Exception as e:
        print(f"   Loi: {e}")
        return False

def get_priorities():
    print("2. Lay danh sach priority...")
    try:
        resp = requests.get(
            f"{JIRA_BASE_URL}/rest/api/2/priority",
            auth=(JIRA_EMAIL, JIRA_API_TOKEN),
            headers={"Accept": "application/json"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            for p in data:
                print(f"   {p['id']}: {p['name']}")
            return data
        else:
            print(f"   FAIL: {resp.status_code}")
            return None
    except Exception as e:
        print(f"   Loi: {e}")
        return None

def get_issue_types():
    print("3. Lay danh sach issue types...")
    try:
        resp = requests.get(
            f"{JIRA_BASE_URL}/rest/api/2/project/{PROJECT_KEY}",
            auth=(JIRA_EMAIL, JIRA_API_TOKEN),
            headers={"Accept": "application/json"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            print(f"   Project: {data.get('name')} ({data.get('key')})")
            issue_types = data.get("issueTypes", [])
            for it in issue_types:
                print(f"   - {it['name']} (id={it['id']}, subtask={it.get('subtask', False)})")
            return issue_types
        else:
            print(f"   FAIL: {resp.status_code} - {resp.text[:300]}")
            return None
    except Exception as e:
        print(f"   Loi: {e}")
        return None

def create_one_bug():
    print("4. Tao 1 bug test...")
    payload = {
        "fields": {
            "project": {"key": PROJECT_KEY},
            "issuetype": {"name": "Bug"},
            "summary": "[Auto] Test bug - Loi hien thi danh sach san pham",
            "description": "h3. Mo ta loi\nDay la bug test tu dong tao bang Jira REST API.\n\nh3. Buoc reproduce\n# Mo trang /products\n# Filter theo category\n\nh3. Ket qua mong doi\nDanh sach hien thi dung.\n\nh3. Ket qua thuc te\nTrang hien thi No products found.",
            "priority": {"name": "Medium"}
        }
    }

    try:
        resp = requests.post(
            f"{JIRA_BASE_URL}/rest/api/2/issue/",
            auth=(JIRA_EMAIL, JIRA_API_TOKEN),
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            json=payload,
            timeout=30
        )
        if resp.status_code == 201:
            data = resp.json()
            key = data.get("key", "N/A")
            url = f"{JIRA_BASE_URL}/browse/{key}"
            print(f"   SUCCESS! Created: {key}")
            print(f"   Link: {url}")
            return {"success": True, "key": key, "url": url}
        else:
            print(f"   FAIL! Status: {resp.status_code}")
            print(f"   Response: {resp.text[:500]}")
            return {"success": False, "error": resp.text[:500]}
    except Exception as e:
        print(f"   Loi: {e}")
        return {"success": False, "error": str(e)}

def main():
    print("=" * 50)
    print("JIRA TEST - Post 1 Bug")
    print(f"  Server:  {JIRA_BASE_URL}")
    print(f"  Email:   {JIRA_EMAIL}")
    print(f"  Project: {PROJECT_KEY}")
    print("=" * 50)
    print()

    if not test_connection():
        print("\nKhong ket noi duoc Jira! Kiem tra lai email/token.")
        return

    print()
    get_priorities()

    print()
    get_issue_types()

    print()
    result = create_one_bug()

    print()
    print("=" * 50)
    if result["success"]:
        print(f"BUG DA TAO: {result['key']}")
        print(f"LINK: {result['url']}")
    else:
        print("TAO BUG THAT BAI!")
    print("=" * 50)

if __name__ == "__main__":
    main()