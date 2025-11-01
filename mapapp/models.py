from django.db import models

class House(models.Model):
    STATUS_GIVING = 'giving'
    STATUS_OUT = 'out'
    STATUS_NONE = 'none'
    STATUS_CHOICES = [
        (STATUS_GIVING, 'Giving Out Candy'),
        (STATUS_OUT, 'Out of Candy'),
        (STATUS_NONE, 'Not Participating'),
    ]

    name = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_GIVING)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name or self.address or 'Unknown'} — {self.get_status_display()}"
