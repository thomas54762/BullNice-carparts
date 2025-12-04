from django.contrib import admin

from .models import SearchResult


@admin.register(SearchResult)
class SearchResultAdmin(admin.ModelAdmin):
    list_display = (
        "search_result_id",
        "website_search_id",
        "url",
        "title",
        "price",
        "created_at",
    )
    list_filter = ("created_at",)
    search_fields = ("url", "title")
    ordering = ("-created_at",)
