# Café White — کافه وایت

A Persian RTL café menu with entrance, menu, and mobile-first product explorer pages, built with Django templates, CSS, and lightweight JavaScript. The design uses warm cream, olive green, rounded cards, and local illustrated placeholders inspired by the supplied references.

## Run locally

The project virtual environment is `.venv`.

```sh
# First-time setup, if the environment needs recreating:
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# Start the development server:
.venv/bin/python manage.py runserver 127.0.0.1:9002
```

- Entrance: <http://127.0.0.1:9002/>
- Main menu: <http://127.0.0.1:9002/menu/>
- Rotating product explorer: <http://127.0.0.1:9002/explore/>
- A selected category: <http://127.0.0.1:9002/menu/?category=coffee>

The navigation button opens page links. Entrance search passes its query to the menu. Menu search matches Persian names and ingredients, combines with category filtering, and keeps the selection in the URL.

The explorer arranges product images on a circular arc. Drag or swipe the images vertically to rotate; release to snap the middle image into selection and update its name, ingredients, and price. Category chips filter the arc. Tap an image, use the up/down buttons, or use the mouse wheel over the images. Keyboard users can focus the carousel and use arrow keys, Home, or End. Category and product selections persist in the URL. The carousel uses native pointer events and animation frames, with reduced-motion and pinch-zoom support; no external carousel library is needed.

## Edit content and artwork

- `menu/views.py`: café name, five sample categories, 20 items, descriptions, and prices. Prices are stored as full toman amounts and displayed with Persian digits.
- `templates/layouts/base.html`: shared branding, navigation, footer.
- `templates/pages/home.html`: entrance page.
- `templates/menu/index.html`: main menu.
- `templates/menu/explore.html`: circular product explorer.
- `menu/static/menu/menu.css`: theme and responsive layouts.
- `menu/static/menu/menu.js`: navigation, search, and category selection.
- `menu/static/menu/explore.css` and `explore.js`: mobile-first arc layout and rotation/selection interactions.
- `menu/static/menu/images/`: local SVG placeholders. Replace with photographs and update the template extensions and item image paths when ready. Products currently reuse their category illustration.

Vazirmatn loads from Google Fonts; Tahoma/sans-serif provides an offline fallback. All imagery is local. `.env.example` documents configuration variables; Django reads the process environment, so export variables before running (it does not automatically load `.env`).

## Checks

```sh
.venv/bin/python manage.py check
.venv/bin/python manage.py test
node --check menu/static/menu/menu.js
.venv/bin/python manage.py collectstatic --noinput
```

For deployment, provide a private `DJANGO_SECRET_KEY`, set `DJANGO_DEBUG=0`, configure `DJANGO_ALLOWED_HOSTS`, collect static files, and run `gunicorn restaurant.wsgi:application` with your hosting setup.
