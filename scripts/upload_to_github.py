import subprocess
import requests
import sys
from pathlib import Path

repo_dir = Path(__file__).resolve().parent.parent
video_path = repo_dir / "verifactu_gratuito_master_tour_16x9.mp4"

if not video_path.exists():
    print(f"Error: Video file not found at {video_path}")
    sys.exit(1)

file_size = video_path.stat().st_size
file_name = video_path.name
mime_type = "video/mp4"

print("Fetching GitHub authentication token and repository ID...")
token = subprocess.check_output(["gh", "auth", "token"]).decode().strip()
repo_id = subprocess.check_output(["gh", "api", "repos/DevilUpperCase/vertifactu-gratuito", "--jq", ".id"]).decode().strip()

print(f"Uploading {file_name} ({file_size / (1024*1024):.2f} MB) to repository {repo_id}...")

url = f"https://uploads.github.com/user-attachments/assets?name={file_name}&content_type={mime_type}&repository_id={repo_id}"
headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/json",
    "Content-Type": mime_type
}

with open(video_path, "rb") as f:
    res = requests.post(url, headers=headers, data=f)

print("Status:", res.status_code)
print("Response:", res.text)

if res.status_code in (200, 201):
    data = res.json()
    asset_url = data.get("url") or data.get("asset", {}).get("href")
    print(f"\n[SUCCESS] Uploaded to GitHub User-Attachments!")
    print(f"Asset URL: {asset_url}")
    
    with open(repo_dir / "GITHUB_VIDEO_URL.txt", "w", encoding="utf-8") as out:
        out.write(asset_url + "\n")
else:
    print(f"[ERROR] Upload failed with code {res.status_code}")
    sys.exit(1)
