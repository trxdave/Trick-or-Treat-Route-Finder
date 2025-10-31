from django.contrib import admin
from .models import House

@admin.register(House)
class HouseAdmin(admin.ModelAdmin):
    list_display = ('address', 'status', 'latitude', 'longitude', 'updated_at')
    list_filter = ('status',)
    search_fields = ('address',)