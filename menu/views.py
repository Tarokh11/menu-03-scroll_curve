import json
from pathlib import Path

from django.shortcuts import render
from django.templatetags.static import static


def persian_number(value):
    return f"{value:,}".translate(str.maketrans("0123456789,", "۰۱۲۳۴۵۶۷۸۹٬"))


MENU_SNAPSHOT = json.loads(Path(__file__).with_name("tulliana_menu.json").read_text())
CATEGORIES = [category for category in MENU_SNAPSHOT["categories"] if category["slug"] != "extras"]
STATIC_SOURCE = Path(__file__).with_name("static")


def menu_image_path(image):
    if (STATIC_SOURCE / image).is_file():
        return image
    return "menu/images/no-photo.svg"


MENU_GROUPS = [dict(category, items=[dict(item, image=menu_image_path(item["image"]),
                                          price=persian_number(item["price"]))
                                    for item in category["items"]]) for category in CATEGORIES]


def home(request):
    return render(request, "pages/home.html", {"shop_name": "کافه وایت", "categories": MENU_GROUPS})


def menu(request):
    return render(request, "menu/index.html", {"shop_name": "کافه وایت", "categories": MENU_GROUPS})


def explore(request):
    products = [dict(item, image_url=static(item["image"]), category=group["slug"],
                     category_name=group["name"], id=f'{group["slug"]}-{index}')
                for group in MENU_GROUPS for index, item in enumerate(group["items"])]
    first_product = next((item for item in products if item["id"] == request.GET.get("product")), None)
    if first_product is None:
        first_product = next((item for item in products if item["category"] == request.GET.get("category")), products[0])
    return render(request, "menu/explore.html", {
        "shop_name": "کافه وایت", "categories": MENU_GROUPS,
        "products": products, "first_product": first_product,
    })
