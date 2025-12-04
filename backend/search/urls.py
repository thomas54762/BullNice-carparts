from django.urls import path

from .views import (
    PartsSearchView,
    SearchResultDetailView,
    SearchResultListView,
)

urlpatterns = [
    path("parts-search/", PartsSearchView.as_view(), name="parts-search"),
    path(
        "search-results/",
        SearchResultListView.as_view(),
        name="search-result-list",
    ),
    path(
        "search-results/<int:search_result_id>/",
        SearchResultDetailView.as_view(),
        name="search-result-detail",
    ),
]
