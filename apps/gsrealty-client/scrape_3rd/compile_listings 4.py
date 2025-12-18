# compile_listings.py
# Purpose: visit Redfin/Zillow listing pages, extract normalized fields, write CSV, package ZIP.

import os, re, csv, json, zipfile, datetime, pathlib, textwrap
from typing import Dict, Any, List, Optional, Tuple

# ----------------------------
# CONFIG
# ----------------------------
URLS = [
    "https://www.redfin.com/AZ/Tempe/233-E-Erie-Dr-85282/home/27927515",
    "https://www.redfin.com/AZ/Phoenix/100-W-Northern-Ave-85021/unit-13/home/192618271",
    "https://www.zillow.com/homedetails/5971-E-Orange-Blossom-Ln-Phoenix-AZ-85018/7567189_zpid/",
    "https://www.zillow.com/homedetails/233-E-Erie-Dr-Tempe-AZ-85282/7595016_zpid/",
    "https://www.zillow.com/homedetails/9934-E-Graythorn-Dr-Scottsdale-AZ-85262/8083198_zpid/",
]

OUT_DIR = pathlib.Path("out")
CSV_PATH = OUT_DIR / "listings.csv"
ZIP_PATH = OUT_DIR / "property-scrapes-redfin-zillow.zip"

# Throttle politely if you expand this list.
NAV_TIMEOUT_MS = 40_000

# ----------------------------
# UTILITIES
# ----------------------------
def norm_num(s: Optional[str]) -> Optional[float]:
    if not s:
        return None
    s2 = s.replace(",", "").strip()
    try:
        if s2.endswith("+"):  # e.g., "3+"
            s2 = s2[:-1]
        return float(s2)
    except:
        # Try to pull the first number in the string
        m = re.search(r"[-+]?\d*\.?\d+", s2)
        return float(m.group()) if m else None

def first_match(text: str, patterns: List[re.Pattern]) -> Optional[str]:
    for p in patterns:
        m = p.search(text)
        if m:
            # group 1 if present, else whole match
            return m.group(1) if m.groups() else m.group(0)
    return None

def try_jsonloads(s: str) -> Optional[Any]:
    try:
        return json.loads(s)
    except Exception:
        return None

def collapse_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()

# ----------------------------
# EXTRACTION LOGIC
# ----------------------------
def extract_json_ld(html: str) -> List[Dict[str, Any]]:
    """Return list of JSON-LD dicts."""
    out = []
    for m in re.finditer(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
                         html, flags=re.DOTALL|re.IGNORECASE):
        raw = m.group(1).strip()
        # JSON-LD may contain multiple objects or be wrapped in script-safe chars
        # Try a few cleanup passes
        for cand in [raw, raw.replace("\n", " ")]:
            data = try_jsonloads(cand)
            if data is not None:
                if isinstance(data, list):
                    out.extend([d for d in data if isinstance(d, dict)])
                elif isinstance(data, dict):
                    out.append(data)
                break
    return out

def extract_coords(html: str) -> Tuple[Optional[float], Optional[float]]:
    # JSON-LD coordinates
    json_lds = extract_json_ld(html)
    for obj in json_lds:
        # Common LD structures:
        # obj["geo"] = {"@type":"GeoCoordinates","latitude":..,"longitude":..}
        geo = obj.get("geo")
        if isinstance(geo, dict):
            lat = norm_num(str(geo.get("latitude")))
            lon = norm_num(str(geo.get("longitude")))
            if lat and lon:
                return lat, lon

    # Fallback: regex sniff
    m = re.search(r'"latitude"\s*:\s*([\-0-9.]+).*?"longitude"\s*:\s*([\-0-9.]+)', html, re.DOTALL|re.IGNORECASE)
    if m:
        return float(m.group(1)), float(m.group(2))
    return None, None

def extract_images(html: str, domain_hint: str) -> List[str]:
    imgs = set()
    if "redfin.com" in domain_hint:
        for m in re.finditer(r'https://ssl\.cdn-redfin\.com/photo/[^\s"\'<>]+', html):
            imgs.add(m.group(0))
    if "zillow.com" in domain_hint:
        for m in re.finditer(r'https://photos\.zillowstatic\.com/fp/[^\s"\'<>]+', html):
            imgs.add(m.group(0))
    return list(imgs)[:20]

def parse_common_stats(text: str) -> Dict[str, Any]:
    # General text scraping patterns that work across both sites, then the site-specific steps fill gaps.
    # Beds / Baths / Sqft
    beds = first_match(text, [re.compile(r'(\d+(?:\.\d+)?)\s*bd', re.I)])
    baths = first_match(text, [re.compile(r'(\d+(?:\.\d+)?)\s*ba', re.I)])
    sqft = first_match(text, [re.compile(r'([\d,]+)\s*sq\s*ft', re.I)])
    price = first_match(text, [re.compile(r'\$\s*[\d,]+(?:,\d{3})*(?:\.\d{2})?', re.I)])
    lot = first_match(text, [
        re.compile(r'Lot Size[:\s]+([\d,\.]+\s*(?:sq\s*ft|acres?))', re.I),
        re.compile(r'([\d,\.]+\s*(?:sq\s*ft|acres?))\s+Lot Size', re.I),
    ])
    year_built = first_match(text, [re.compile(r'Year Built[:\s]+(\d{4})', re.I)])
    status = first_match(text, [re.compile(r'(For sale|Pending|Active|Contingent|Sold)', re.I)])
    mls = first_match(text, [re.compile(r'(?:MLS|ARMLS)\s*#\s*([\w\d-]+)', re.I)])
    hoa = first_match(text, [re.compile(r'HOA[^$]*\$\s?[\d,]+(?:\/(?:mo|month|yr|year|qtr|quarter|semi-ann(?:ually)?))?', re.I),
                              re.compile(r'No HOA', re.I)])
    return {
        "list_price_raw": price,
        "bedrooms_raw": beds,
        "bathrooms_raw": baths,
        "sqft_raw": sqft,
        "lot_size_raw": lot,
        "year_built_raw": year_built,
        "status_raw": status,
        "mls_raw": mls,
        "hoa_raw": hoa,
    }

def extract_address_from_jsonld(json_lds: List[Dict[str, Any]]) -> Optional[str]:
    for obj in json_lds:
        addr = obj.get("address")
        if isinstance(addr, dict):
            # Combine parts when present
            street = collapse_ws(addr.get("streetAddress"))
            city = collapse_ws(addr.get("addressLocality"))
            state = collapse_ws(addr.get("addressRegion"))
            postal = collapse_ws(addr.get("postalCode"))
            out = ", ".join([p for p in [street, city, f"{state} {postal}".strip()] if p])
            if out:
                return out
    return None

def site_specific_extract(domain: str, html: str, text: str) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    json_lds = extract_json_ld(html)

    # Address
    addr = extract_address_from_jsonld(json_lds)
    if not addr:
        # Fallback: "233 E Erie Dr, Tempe, AZ 85282" pattern
        addr = first_match(text, [re.compile(r'\d{1,6}\s+[^,]+,\s+[A-Za-z .\-]+,\s+AZ\s+\d{5}', re.I)])
    out["address"] = addr or ""

    # City/State/Zip (attempt to split)
    city, state, zipcode = "", "AZ", ""
    if addr and "," in addr:
        parts = [p.strip() for p in addr.split(",")]
        if len(parts) >= 3:
            city = parts[-2]
            sz = parts[-1].split()
            if len(sz) >= 2:
                state, zipcode = sz[0], sz[1]

    out["city"] = city
    out["state"] = state
    out["zip_code"] = zipcode

    # Bed/Bath/Sqft/Lot/Year/Price/Status/MLS/HOA from common
    cs = parse_common_stats(text)
    out["list_price"] = norm_num(cs["list_price_raw"])
    out["bedrooms"] = norm_num(cs["bedrooms_raw"])
    out["bathrooms"] = norm_num(cs["bathrooms_raw"])
    out["sqft"] = norm_num(cs["sqft_raw"])
    out["lot_size"] = cs["lot_size_raw"] or ""
    out["year_built"] = int(cs["year_built_raw"]) if cs["year_built_raw"] else None
    out["status"] = cs["status_raw"] or ""
    out["mls_code"] = f"ARMLS #{cs['mls_raw']}" if cs["mls_raw"] else ""
    out["hoa_dues"] = cs["hoa_raw"] or ""

    # Coords
    lat, lon = extract_coords(html)
    out["latitude"], out["longitude"] = lat, lon

    # Parcel/APN (weak regex fallback)
    parcel = first_match(text, [re.compile(r'(?:Parcel|APN)\s*[:#]?\s*([A-Za-z0-9\-]+)', re.I)])
    out["parcel_number"] = parcel or ""

    # Property type heuristic
    ptype = first_match(text, [re.compile(r'(Single[- ]Family(?: Residence)?|Townhouse|Condo|minium|Multi[- ]Family|Manufactured|Apartment)', re.I)])
    out["property_type"] = ptype or ""

    # "Date on market" / "listing updated" (best effort)
    listing_added = first_match(text, [
        re.compile(r'(?:Date on market|On Redfin)\s*[:]?\s*([A-Za-z]{3,9}\s+\d{1,2},\s*\d{4}|\d+\s+day[s]?\s+ago|\d+/\d+/\d+)', re.I),
        re.compile(r'Date on market[:\s]+([\d/-]{6,10}|[A-Za-z]{3,9}\s+\d{1,2},\s*\d{4})', re.I),
    ]) or ""
    listing_updated = first_match(text, [re.compile(r'Listing updated[:\s]+([A-Za-z]{3,9}\s+\d{1,2},\s*\d{4}[^,]*\b(?:am|pm)?|\d+/\d+/\d+\s+\d+:\d+\s*(?:am|pm)?)', re.I)]) or ""
    out["listing_added_date"] = listing_added
    out["listing_updated_date"] = listing_updated

    # Last sale (weak)
    last_sale_date = first_match(text, [re.compile(r'(?:Sold on|Last sale(?: date)?)[:\s]+([A-Za-z]{3,9}\s+\d{1,2},\s*\d{4}|\d{4}-\d{2}-\d{2}|\d+/\d+/\d+)', re.I)])
    last_sale_price = first_match(text, [re.compile(r'(?:Sold for|Last sale price)[:\s]+\$[\d,]+', re.I)])
    out["last_sale_date"] = last_sale_date or ""
    out["last_sale_price"] = norm_num(last_sale_price) if last_sale_price else None

    # Unit number (if present in path or text)
    unit = first_match(text, [re.compile(r'Unit\s*#?\s*([A-Za-z0-9\-]+)', re.I)])
    out["unit_number"] = unit or ""

    # Site property id (Redfin home id or Zillow zpid) – derive from path or JSON
    prop_id = ""
    if "redfin.com" in domain:
        m = re.search(r'/home/(\d+)', out["url"])
        if m: prop_id = m.group(1)
    elif "zillow.com" in domain:
        m = re.search(r'/(\d+)_zpid/', out["url"])
        if m: prop_id = m.group(1)
    out["property_id_site"] = prop_id

    # images
    out["images"] = "|".join(extract_images(html, domain))

    return out

# ----------------------------
# BROWSER (Playwright)
# ----------------------------
# Note: This uses Playwright to respect page rendering and load the same content a normal browser would.
# Follow each site’s Terms of Use and robots.txt; this script is provided for personal, one-off use on the exact pages supplied.

from playwright.sync_api import sync_playwright

def fetch_page(url: str) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
        page = ctx.new_page()
        page.set_default_timeout(NAV_TIMEOUT_MS)
        page.goto(url, wait_until="domcontentloaded")
        # Try to let client-side render fill in
        page.wait_for_timeout(1500)
        html = page.content()
        browser.close()
        return html

# ----------------------------
# MAIN
# ----------------------------
FIELDNAMES = [
    "site","url","address","unit_number","city","state","zip_code","status",
    "list_price","bedrooms","bathrooms","sqft","lot_size","property_type",
    "year_built","mls_code","parcel_number","property_id_site",
    "latitude","longitude","hoa_dues","listing_added_date","listing_updated_date",
    "last_sale_date","last_sale_price","images"
]

def site_name(url: str) -> str:
    return "Redfin" if "redfin.com" in url else ("Zillow" if "zillow.com" in url else "")

def build_rows(urls: List[str]) -> List[Dict[str, Any]]:
    rows = []
    for url in urls:
        print(f"[*] Fetching {url}")
        html = fetch_page(url)
        text = collapse_ws(re.sub(r"<[^>]+>", " ", html))
        base = {
            "site": site_name(url),
            "url": url,
        }
        extracted = site_specific_extract(base["site"].lower(), html, text)
        row = {k: "" for k in FIELDNAMES}
        row.update(base)
        row.update(extracted)
        rows.append(row)
    return rows

def write_csv(path: pathlib.Path, rows: List[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDNAMES)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in FIELDNAMES})

def write_readme(path: pathlib.Path) -> None:
    contents = f"""PROPERTY SCRAPE BUNDLE
Generated: {datetime.datetime.now().isoformat(timespec='seconds')}

What’s included
- listings.csv — tabular data for each requested URL with price, address, beds/baths, sqft, lot size, year built, MLS, parcel, HOA, listing dates, coordinates (when available), and image URL(s).
- download_images.py — helper script to download all image URLs in listings.csv into ./images/<index>/ folders locally.

Notes & limitations
- This archive contains IMAGE URLS, not the images themselves.
- Run download_images.py on your machine to populate the images/ directory.
- Values come from the public detail pages provided at run time. For bulk or automated crawling, follow each site’s Terms of Use and robots.txt.

"""
    path.write_text(contents, encoding="utf-8")

def write_downloader(path: pathlib.Path) -> None:
    dl = r"""#!/usr/bin/env python3
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
            folder = IMAGES_DIR / f"{idx:02d}_{safe_name(row.get('address','unknown'))}"
            folder.mkdir(parents=True, exist_ok=True)
            for j, url in enumerate(urls, start=1):
                ext = ".jpg"
                for e in [".webp", ".jpg", ".jpeg", ".png"]:
                    if url.lower().endswith(e):
                        ext = e; break
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
"""
    path.write_text(dl, encoding="utf-8")

def zip_bundle(zip_path: pathlib.Path, files: List[pathlib.Path]) -> None:
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(f, arcname=f.name)

def main():
    rows = build_rows(URLS)
    write_csv(CSV_PATH, rows)
    readme_path = OUT_DIR / "README.txt"
    downloader_path = OUT_DIR / "download_images.py"
    write_readme(readme_path)
    write_downloader(downloader_path)
    zip_bundle(ZIP_PATH, [CSV_PATH, readme_path, downloader_path])
    print(f"\nWrote: {CSV_PATH}")
    print(f"ZIP:   {ZIP_PATH}\n")

if __name__ == "__main__":
    main()
