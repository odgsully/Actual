#!/usr/bin/env python3
import csv, os, sys, pathlib, urllib.request, urllib.error

CSV_PATH = pathlib.Path(__file__).parent / "listings.csv"
IMAGES_DIR = pathlib.Path(__file__).parent / "images"
IMAGES_DIR.mkdir(exist_ok=True)

def safe_name(s):
    return "".join(c for c in s if c.isalnum() or c in ("-", "_", ".", " ")).strip()

def main():
    if not CSV_PATH.exists():
        print(f"Missing {CSV_PATH}")
        sys.exit(1)

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, start=1):
            raw = row.get("images") or ""
            urls = [u.strip() for u in raw.split("|") if u.strip()]
            if not urls:
                continue
            # folder name includes index + short address
            folder = IMAGES_DIR / f"{idx:02d}_{safe_name(row.get('address','unknown'))}"
            folder.mkdir(parents=True, exist_ok=True)

            for j, url in enumerate(urls, start=1):
                # preserve file extension if present
                ext = ".jpg"
                for e in [".webp", ".jpg", ".jpeg", ".png"]:
                    if url.lower().endswith(e):
                        ext = e
                        break
                out = folder / f"img_{j:02d}{ext}"
                try:
                    print(f"Downloading [{idx}/{j}]: {url} -> {out}")
                    urllib.request.urlretrieve(url, out)
                except urllib.error.HTTPError as e:
                    print(f"HTTP error for {url}: {e.code}")
                except urllib.error.URLError as e:
                    print(f"URL error for {url}: {e.reason}")
                except Exception as e:
                    print(f"Failed {url}: {e}")

if __name__ == "__main__":
    main()
