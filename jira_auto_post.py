#!/usr/bin/env python3
"""
=== Jira Auto Bug Poster ===
Tu dong tao bug tren Jira qua REST API
Usage: python jira_auto_post.py
"""

import requests
import json
import os
from datetime import datetime

# ============================================================
# CONFIG - Thay doi cac gia tri nay cho phu hop
# ============================================================
JIRA_BASE_URL = "https://jira.fci.vn"
JIRA_EMAIL = "thuanlt11@fpt.com"          # Email dang nhap Jira
JIRA_API_TOKEN = "Dat0208@2013"     # API Token
PROJECT_KEY = "NCPP"                         # Project key

# ============================================================
# DANH SACH BUG CAN TAO
# ============================================================
BUGS_TO_CREATE = [
    {
        "summary": "Loi hien thi danh sach san pham khi filter theo category",
        "description": """h3. Mo ta loi
Khi filter san pham theo category tren trang listing, danh sach khong hien thi ket qua.

h3. Buoc reproduce
# Mo trang /products
# Chon category "Electronics"
# Nhan Filter

h3. Ket qua mong doi
Danh sach san pham hien thi dung theo category da chon.

h3. Ket qua thuc te
Trang hien thi "No products found" du co san pham trong category.""",
        "priority": "Critical",
        "component": "Frontend",
        "labels": ["bug", "frontend", "filter"],
        "assignee": "nguyenvana"
    },
    {
        "summary": "API tra ve 500 khi tao don hang voi so luong lon",
        "description": """h3. Mo ta loi
API /api/orders tra ve HTTP 500 khi tao don hang voi tren 100 items.

h3. Buoc reproduce
# Goi POST /api/orders
# Body chua danh sach > 100 items
# Kiem tra response

h3. Ket qua mong doi
API xu ly thanh cong hoac tra ve loi cu the.

h3. Ket qua thuc te
HTTP 500 Internal Server Error.""",
        "priority": "High",
        "component": "Backend",
        "labels": ["bug", "backend", "api"],
        "assignee": "tranthib"
    },
    {
        "summary": "UI bi lech tren mobile Safari iOS 17",
        "description": """h3. Mo ta loi
Giao dien bi lech khi truy cap bang Safari tren iOS 17.

h3. Thiet bi test
* iPhone 15 Pro - iOS 17.2
* Safari 17.2

h3. Ket qua mong doi
UI hien thi dung nhu design.

h3. Ket qua thuc te
Header bi overlap voi content, button khong click duc.""",
        "priority": "Medium",
        "component": "Frontend",
        "labels": ["bug", "frontend", "mobile", "ios"],
        "assignee": "hoangvane"
    }
]

# ============================================================
# PRIORITY MAPPING
# ============================================================
PRIORITY_MAP = {
    "Critical": "1",
    "High": "2",
    "Medium": "3",
    "Low": "4"
}

# ============================================================
# JIRA API FUNCTIONS
# ============================================================

def get_auth():
    """Tao authentication header"""
    return (JIRA_EMAIL, JIRA_API_TOKEN)

def get_headers():
    """Tao request headers"""
    return {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

def test_connection():
    """Test ket noi den Jira"""
    print("Dang test ket noi den Jira...")
    try:
        resp = requests.get(
            f"{JIRA_BASE_URL}/rest/api/2/myself",
            auth=get_auth(),
            headers=get_headers(),
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            print(f"  Ket noi thanh cong! User: {data.get('displayName', 'N/A')}")
            return True
        else:
            print(f"  Ket noi that bai! Status: {resp.status_code}")
            print(f"  Response: {resp.text[:200]}")
            return False
    except Exception as e:
        print(f"  Loi ket noi: {e}")
        return False

def get_project_info():
    """Lay thong tin project"""
    try:
        resp = requests.get(
            f"{JIRA_BASE_URL}/rest/api/2/project/{PROJECT_KEY}",
            auth=get_auth(),
            headers=get_headers(),
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            print(f"  Project: {data.get('name', 'N/A')} ({data.get('key', 'N/A')})")
            return data
        else:
            print(f"  Khong lay duoc project info: {resp.status_code}")
            return None
    except Exception as e:
        print(f"  Loi lay project info: {e}")
        return None

def create_bug(bug_data):
    """Tao 1 bug tren Jira"""
    fields = {
        "project": {"key": PROJECT_KEY},
        "issuetype": {"name": "Bug"},
        "summary": bug_data["summary"],
        "description": bug_data.get("description", ""),
        "priority": {"id": PRIORITY_MAP.get(bug_data.get("priority", "Medium"), "3")},
    }

    if "labels" in bug_data:
        fields["labels"] = bug_data["labels"]

    if "component" in bug_data:
        fields["components"] = [{"name": bug_data["component"]}]

    if "assignee" in bug_data:
        fields["assignee"] = {"name": bug_data["assignee"]}

    payload = {"fields": fields}

    try:
        resp = requests.post(
            f"{JIRA_BASE_URL}/rest/api/2/issue/",
            auth=get_auth(),
            headers=get_headers(),
            json=payload,
            timeout=30
        )

        if resp.status_code == 201:
            data = resp.json()
            key = data.get("key", "N/A")
            url = f"{JIRA_BASE_URL}/browse/{key}"
            print(f"    Created: {key} - {url}")
            return {"success": True, "key": key, "url": url}
        else:
            error_msg = resp.text[:300]
            print(f"    Failed: {resp.status_code} - {error_msg}")
            return {"success": False, "error": error_msg}

    except Exception as e:
        print(f"    Exception: {e}")
        return {"success": False, "error": str(e)}

def batch_create_bugs(bugs_list):
    """Tao nhieu bug cung luc"""
    results = []
    total = len(bugs_list)
    success = 0
    failed = 0

    print(f"\nBat dau tao {total} bugs tren Jira...\n")

    for i, bug in enumerate(bugs_list, 1):
        priority = bug.get("priority", "Medium")
        print(f"  [{i}/{total}] {priority} | {bug['summary'][:60]}...")
        result = create_bug(bug)
        results.append(result)
        if result["success"]:
            success += 1
        else:
            failed += 1

    print(f"\n{'='*50}")
    print(f"KET QUA:")
    print(f"  Thanh cong: {success}")
    print(f"  That bai:   {failed}")
    print(f"  Tong cong:  {total}")
    print(f"{'='*50}")

    return results

def create_bugs_from_json(json_file):
    """Doc bugs tu file JSON va tao tren Jira"""
    if not os.path.exists(json_file):
        print(f"File khong ton tai: {json_file}")
        return []

    with open(json_file, "r", encoding="utf-8") as f:
        bugs = json.load(f)

    print(f"\nDoc {len(bugs)} bugs tu file: {json_file}")
    return batch_create_bugs(bugs)

# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 50)
    print("JIRA AUTO BUG POSTER")
    print(f"  Server:  {JIRA_BASE_URL}")
    print(f"  Project: {PROJECT_KEY}")
    print(f"  Time:    {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

    # Check config
    if JIRA_API_TOKEN == "YOUR_API_TOKEN_HERE":
        # Try env variable
        env_token = os.environ.get("JIRA_API_TOKEN", "")
        if env_token:
            global JIRA_API_TOKEN
            JIRA_API_TOKEN = env_token
        else:
            print("\nCHUA CAU HINH API TOKEN!")
            print("\nHuong dan lay API Token:")
            print("  1. Dang nhap Jira: https://jira.fci.vn")
            print("  2. Vao Profile -> Account settings")
            print("  3. Chon 'Security' -> 'Create and manage API tokens'")
            print("  4. Click 'Create API token'")
            print("  5. Copy token va dan vao JIRA_API_TOKEN trong script nay")
            print("\n  Hoac dat environment variable:")
            print("  set JIRA_API_TOKEN=your_token_here")
            return

    # Test connection
    if not test_connection():
        print("\nKhong the ket noi den Jira. Kiem tra lai:")
        print("  - Email va API Token chinh xac")
        print("  - URL Jira dung")
        print("  - Co quyen truy cap Jira")
        return

    # Get project info
    get_project_info()

    # Create bugs
    results = batch_create_bugs(BUGS_TO_CREATE)

    # Save results
    result_file = f"jira_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(result_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nKet qua da luu vao: {result_file}")

if __name__ == "__main__":
    main()