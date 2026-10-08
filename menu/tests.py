import json
from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree

from django.conf import settings
from django.contrib.staticfiles import finders
from django.test import SimpleTestCase, override_settings
from django.urls import reverse

from .views import MENU_GROUPS


class AssetParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.assets = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        for key in ("src", "href"):
            value = attributes.get(key, "")
            if value.startswith(settings.STATIC_URL):
                self.assets.append(value.removeprefix(settings.STATIC_URL))


@override_settings(STORAGES={"staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"}})
class MenuPageTests(SimpleTestCase):
    def test_entrance_links_to_every_category(self):
        response = self.client.get(reverse("home"))
        self.assertContains(response, "کافه وایت")
        self.assertContains(response, 'dir="rtl"')
        for category in MENU_GROUPS:
            self.assertContains(response, f'/menu/?category={category["slug"]}')

    def test_menu_contains_all_imported_products_and_filter_targets(self):
        response = self.client.get(reverse("menu"), {"q": "لاته", "category": "coffee"})
        self.assertEqual(response.status_code, 200)
        for category in MENU_GROUPS:
            self.assertContains(response, f'data-group="{category["slug"]}"')
            for item in category["items"]:
                self.assertContains(response, item["name"])
                self.assertContains(response, item["price"])
        self.assertContains(response, 'data-search=', count=76)
        self.assertNotContains(response, "افزودنی ها")

    def test_all_rendered_local_assets_exist_and_svg_is_valid(self):
        for route in ("home", "menu", "explore"):
            parser = AssetParser()
            parser.feed(self.client.get(reverse(route)).content.decode())
            self.assertTrue(parser.assets)
            for asset in parser.assets:
                path = finders.find(asset)
                if path is None:
                    collected = settings.STATIC_ROOT / asset
                    path = collected if collected.is_file() else None
                self.assertIsNotNone(path, asset)
                if asset.endswith(".svg"):
                    ElementTree.parse(Path(path))

    def test_explorer_has_category_controls_and_complete_product_data(self):
        response = self.client.get(reverse("explore"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'data-explore-category=', count=10)
        products = response.context["products"]
        self.assertEqual(len(products), 76)
        self.assertEqual(len({item["id"] for item in products}), 76)
        self.assertNotIn("extras", {item["category"] for item in products})
        for category in MENU_GROUPS:
            self.assertEqual(sum(item["category"] == category["slug"] for item in products), len(category["items"]))
        for item in products:
            self.assertEqual(item["image_url"], settings.STATIC_URL + item["image"])
            self.assertIsNotNone(finders.find(item["image"]), item["id"])
        serialized = response.content.decode().split('<script id="explore-products" type="application/json">')[1].split('</script>')[0]
        self.assertEqual(json.loads(serialized), products)
        self.assertContains(response, "میگو کرم پاپریکا")

    def test_source_pizzas_and_selected_product_are_preserved(self):
        response = self.client.get(reverse("explore"), {"product": "pizza-0"})
        pizzas = [item for item in response.context["products"] if item["category"] == "pizza"]
        self.assertEqual(len(pizzas), 22)
        first = response.context["first_product"]
        self.assertEqual(first["name"], "میگو کرم پاپریکا")
        self.assertEqual(first["price"], "۱٬۷۵۰٬۰۰۰")
        for item in pizzas:
            self.assertTrue(item["source_image"].startswith("https://img.delino.com/"))
            self.assertTrue(item["image"].endswith(".webp"))
        coffee = self.client.get(reverse("explore"), {"product": "coffee-0"})
        self.assertEqual(coffee.context["first_product"]["name"], "اسپرسو")
        self.assertEqual(coffee.context["first_product"]["price"], "۲۲۰٬۰۰۰")
