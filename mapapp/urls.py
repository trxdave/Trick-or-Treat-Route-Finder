from django.urls import path
from . import views

urlpatterns = [

    path('', views.home, name='home'),
    path("team/", views.team, name="team"),
    path('api/houses/', views.houses_json, name='houses_json'),
    path('add/', views.add_house, name='add_house'),
    path('api/houses/<int:pk>/delete/', views.delete_house, name='delete_house'),
    path('api/houses/<int:pk>/update/', views.update_house, name='update_house'),  
]