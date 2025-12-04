from django.db import models


class SearchResult(models.Model):
    search_result_id = models.BigIntegerField(db_index=True)
    website_search_id = models.BigIntegerField()
    url = models.TextField()
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=15, decimal_places=3)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.search_result_id} - {self.website_search_id} - {self.title}"
