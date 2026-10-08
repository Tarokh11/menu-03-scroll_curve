# Café White status

- Goal: mobile-first Persian café menu with warm cream/olive styling and a separate circular product explorer.
- Location: `cafe-resturan-2`; independent Git repository, initial branch `master`. Reference worktree: `juice_shop_01-design-2` on `design-2`.
- Completed: Django entrance and menu pages, shared layout, 5 categories / 20 sample products, local SVG placeholders, responsive styles, navigation, Persian search and category filtering.
- Current change: `/menu/` has horizontal product rows; `/explore/` adds a swipeable circular product arc, category filtering, middle-item snapping, synchronized details, and selection URLs. Available from shared navigation.
- Environment: local `.venv` installed; preview running at `http://127.0.0.1:9002/`. No deployment configured.
- Verified: Django checks and 4 tests, static collection, JS syntax; Chrome real-touch swipe, category changes, wraparound, image taps, keyboard/wheel, URL restoration, reduced motion, and layouts at 320/390/430/1440px.
- Decisions: branding `کافه وایت`; sample toman prices and temporary illustrations; Django templates; native pointer/rAF carousel for lightweight mobile interaction, no external carousel dependency.
- New content: Tulliana menu snapshot, 76 products / 9 categories / 22 pizzas; Extras excluded. 85 locally stored original photos. Mineral water uses a no-photo placeholder because the source has no image. Café White branding and entrance hero retained.
- Import verified: 5 Django tests, system checks, JavaScript syntax, static collection, and Chrome checks/screenshots at 390px and 1440px for photo loading, selection, category changes, full menu and coffee deep link; no JavaScript exceptions.
- Saved versions: `fe32059` is the original simple café; `b1c8659` preserves the sample-menu explorer before the Tulliana import.
- Next: user review of the imported menu and photos.
