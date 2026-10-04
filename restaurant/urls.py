from django.urls import path
from menu import views

urlpatterns = [
    path("", views.home, name="home"),
    path("menu/", views.menu, name="menu"),
    path("explore/", views.explore, name="explore"),
]
