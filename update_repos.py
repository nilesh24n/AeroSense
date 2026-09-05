#!/usr/bin/env python3
"""
GitHub Repository Bulk Update Script
Updates repository descriptions and topics for all your repos.

Requirements:
    pip install requests

Setup:
    1. Get your GitHub Personal Access Token:
       https://github.com/settings/tokens
       - Select "repo" scope
       - Copy the token
    
    2. Run this script:
       python3 update_repos.py YOUR_TOKEN_HERE
    
    3. Or set as environment variable:
       export GITHUB_TOKEN="your_token_here"
       python3 update_repos.py
"""

import requests
import sys
import os
from typing import Dict, List

# Configuration
OWNER = "nilesh24n"
BASE_URL = "https://api.github.com"

# Repository descriptions
REPOS_DESCRIPTIONS = {
    "ATS-engine": "Applicant Tracking System for recruitment workflows and candidate management",
    "AuthShield": "Client-side SHA-256 authentication system with Web Crypto API",
    "ChatWapped": "Modern real-time chat application with responsive design",
    "FlowHire_C2C": "Client-to-Client hiring platform connecting businesses with contractors",
    "NeoCalc": "Glassmorphic calculator with custom arithmetic parser and keyboard support",
    "SECONDOPENION": "Medical report explainer with AI principles and Web Speech API in English/Hindi",
    "TaskFlowPro": "Interactive task management app with confetti rewards and localStorage persistence",
    "TributePG": "Elegant tribute page for Dr. A. P. J. Abdul Kalam with interactive timeline",
    "my-web": "FlowMind productivity suite with dark/light theme support and task management"
}

# Repository topics
REPOS_TOPICS = {
    "AeroSense": ["air-quality", "smart-city", "iot", "ai", "environmental-monitoring", "hackathon"],
    "ATS-engine": ["recruitment", "applicant-tracking", "hiring", "hr-tech", "job-management"],
    "AuthShield": ["authentication", "security", "web-crypto", "sha-256", "password-hashing", "javascript"],
    "ChatWapped": ["chat", "messaging", "real-time", "web-app", "vanilla-js", "social"],
    "FlowHire_C2C": ["hiring", "gig-economy", "marketplace", "c2c", "contractors", "freelance"],
    "my-web": ["productivity", "task-management", "todo-app", "web-app", "glassmorphism", "vanilla-js"],
    "NeoCalc": ["calculator", "glassmorphism", "vanilla-js", "tools", "web-app", "ui-design"],
    "SECONDOPENION": ["healthcare", "medical", "ai", "web-speech-api", "health-tech", "india"],
    "TaskFlowPro": ["task-management", "productivity", "todo", "web-app", "vanilla-js", "confetti"],
    "TributePG": ["tribute", "biography", "html-css", "responsive-design", "indian-history", "education"]
}


def get_token() -> str:
    """Get GitHub token from command line or environment variable."""
    if len(sys.argv) > 1:
        return sys.argv[1]
    
    token = os.getenv("GITHUB_TOKEN")
    if token:
        return token
    
    print("❌ Error: GitHub token not provided!")
    print("\nUsage:")
    print("  python3 update_repos.py YOUR_TOKEN_HERE")
    print("\nOr set environment variable:")
    print("  export GITHUB_TOKEN='your_token_here'")
    print("  python3 update_repos.py")
    print("\nGet your token: https://github.com/settings/tokens")
    sys.exit(1)


def get_headers(token: str) -> Dict[str, str]:
    """Return request headers with authorization."""
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
    }


def update_description(repo: str, description: str, token: str) -> bool:
    """Update repository description."""
    url = f"{BASE_URL}/repos/{OWNER}/{repo}"
    headers = get_headers(token)
    payload = {"description": description}
    
    try:
        response = requests.patch(url, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"✅ {repo:20} - Description updated")
            return True
        else:
            print(f"❌ {repo:20} - Failed ({response.status_code}): {response.json().get('message', 'Unknown error')}")
            return False
    except Exception as e:
        print(f"❌ {repo:20} - Error: {str(e)}")
        return False


def update_topics(repo: str, topics: List[str], token: str) -> bool:
    """Update repository topics."""
    url = f"{BASE_URL}/repos/{OWNER}/{repo}/topics"
    headers = get_headers(token)
    headers["Accept"] = "application/vnd.github.mercy-preview+json"
    payload = {"names": topics}
    
    try:
        response = requests.put(url, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"✅ {repo:20} - Topics added: {', '.join(topics[:3])}{'...' if len(topics) > 3 else ''}")
            return True
        else:
            print(f"❌ {repo:20} - Failed ({response.status_code}): {response.json().get('message', 'Unknown error')}")
            return False
    except Exception as e:
        print(f"❌ {repo:20} - Error: {str(e)}")
        return False


def main():
    """Main execution function."""
    print("\n" + "="*70)
    print("🚀 GitHub Repository Bulk Update Script")
    print("="*70 + "\n")
    
    token = get_token()
    
    # Verify token by making a simple request
    print("🔐 Verifying GitHub token...")
    headers = get_headers(token)
    try:
        response = requests.get(f"{BASE_URL}/user", headers=headers, timeout=10)
        if response.status_code == 200:
            user = response.json()["login"]
            print(f"✅ Authenticated as: {user}\n")
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Error verifying token: {str(e)}")
        sys.exit(1)
    
    # Update descriptions
    print("📝 Updating Repository Descriptions:")
    print("-" * 70)
    desc_success = 0
    for repo, description in REPOS_DESCRIPTIONS.items():
        if update_description(repo, description, token):
            desc_success += 1
    
    print(f"\nDescriptions: {desc_success}/{len(REPOS_DESCRIPTIONS)} successful\n")
    
    # Update topics
    print("🏷️  Adding Repository Topics:")
    print("-" * 70)
    topics_success = 0
    for repo, topics in REPOS_TOPICS.items():
        if update_topics(repo, topics, token):
            topics_success += 1
    
    print(f"\nTopics: {topics_success}/{len(REPOS_TOPICS)} successful\n")
    
    # Summary
    print("="*70)
    print("📊 Update Summary:")
    print(f"   Descriptions: {desc_success}/{len(REPOS_DESCRIPTIONS)} ✅")
    print(f"   Topics:       {topics_success}/{len(REPOS_TOPICS)} ✅")
    print("="*70 + "\n")
    
    if desc_success == len(REPOS_DESCRIPTIONS) and topics_success == len(REPOS_TOPICS):
        print("🎉 All updates completed successfully!")
        print("\n✨ Next steps:")
        print("   1. Visit https://github.com/nilesh24n to see updated repos")
        print("   2. Manually change SECONDOPENION default branch from 'master' to 'main'")
        print("      URL: https://github.com/nilesh24n/SECONDOPENION/settings")
        return 0
    else:
        print("⚠️  Some updates failed. Check the output above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
