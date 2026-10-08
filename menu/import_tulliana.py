"""Refresh the local menu snapshot and original photos from Tulliana's menu.

Run from the project root: .venv/bin/python menu/import_tulliana.py
"""
import html
import json
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path
from urllib.request import ProxyHandler, Request, build_opener, urlopen


SOURCE = "https://tullianapizza.com/order/tullianapizza"
ROOT = Path(__file__).resolve().parent
SLUGS = ["pizza", "pasta", "sandwich", "starter", "salad", "gelato",
         "coffee", "cold", "soft-drinks"]


def fetch(url):
    with urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60) as response:
        return response.read()


def text(markup):
    return html.unescape(re.sub(r"<[^>]+>", "", markup)).strip()


def main():
    page = fetch(SOURCE).decode()
    sections = re.split(r'<h1 class="pr-4[^>]*>(.*?)</h1>', page)
    if len(sections) != 21:
        raise ValueError("Expected all ten source categories on the source website")
    groups, downloads = [], {}
    for index, slug in enumerate(SLUGS):
        name, section = sections[index * 2 + 1:index * 2 + 3]
        items = []
        for card in section.split('<div class="col-span-1 items-end xl:grid">')[1:]:
            title = re.search(r"<h2[^>]*>(.*?)</h2>", card)
            price = re.search(r"([\d,]+) تومان", card)
            if not title or not price:
                raise ValueError(f"Incomplete product in {name}")
            description = re.search(r"<p[^>]*>(.*?)</p>", card[title.end():])
            image = re.search(r'src="(https://img.delino.com/[^" ]+/Food/[^" ]+)"', card[:title.start()])
            image_path = "menu/images/no-photo.svg"
            image_url = None
            if image:
                image_url = html.unescape(image.group(1))
                image_path = "menu/images/tulliana/" + image_url.split("/")[-1].split("?")[0].replace(".jpg", ".webp")
                downloads[image_path] = image_url
            items.append({"name": text(title.group(1)),
                          "description": text(description.group(1)) if description else "",
                          "price": int(price.group(1).replace(",", "")),
                          "image": image_path, "source_image": image_url})
        if not items:
            raise ValueError(f"Empty category: {name}")
        groups.append({"slug": slug, "name": text(name), "tagline": "",
                       "image": items[0]["image"], "items": items})

    destination = ROOT / "static/menu/images/tulliana"
    destination.mkdir(exist_ok=True)

    def download(entry):
        path, url = entry
        target = ROOT / "static" / path
        if not target.exists():
            # This image CDN is reachable directly; the environment proxy times out.
            with build_opener(ProxyHandler({})).open(url, timeout=30) as response:
                data = response.read()
            if data[:4] != b"RIFF" or data[8:12] != b"WEBP":
                raise ValueError(f"Invalid WebP: {url}")
            target.write_bytes(data)

    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(download, downloads.items()))
    snapshot = {"source": SOURCE, "imported_on": date.today().isoformat(), "categories": groups}
    (ROOT / "tulliana_menu.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
    print(f"Imported {sum(len(group['items']) for group in groups)} products and {len(downloads)} photos")
    for group in groups:
        print(group["slug"], len(group["items"]))


if __name__ == "__main__":
    main()
