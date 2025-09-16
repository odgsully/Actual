PROPERTY SCRAPE BUNDLE
Generated: 2025-09-02T18:58:15

What’s included
- listings.csv — tabular data for each requested URL with price, address, beds/baths, sqft, lot size, year built, MLS, parcel, HOA, listing dates, coordinates (when available), and image URL(s).
- download_images.py — helper script to download all image URLs in listings.csv into ./images/<index>/ folders locally.

Notes & limitations
- This archive contains IMAGE URLS, not the images themselves. The current environment cannot fetch external files.
- Run download_images.py on your machine to populate the images/ directory.
- All values came from the public detail pages you supplied (Zillow/Redfin) at time of scraping.
  For bulk or automated crawling, follow each site’s Terms of Use and robots.txt.

How to download images locally
1) Ensure you have Python 3.9+
2) Place this ZIP’s contents in a folder and open a terminal there
3) Create a virtual environment (optional) and run:
   python3 download_images.py

This will create an ./images folder and download files for each row.
