from django.contrib import admin
from .models import House

@admin.register(House)
class HouseAdmin(admin.ModelAdmin):
    list_display = ('id','name','address','status','latitude','longitude','updated_at')
    list_filter = ('status',)
    search_fields = ('name','address')
