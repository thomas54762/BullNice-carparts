from django.urls import path

from .views import CategoryDataView, PartsSearchView

urlpatterns = [
    path("parts-search/", PartsSearchView.as_view(), name="parts-search"),
    path("category-data/", CategoryDataView.as_view(), name="category-data"),
]
