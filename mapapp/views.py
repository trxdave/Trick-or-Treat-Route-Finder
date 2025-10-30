from django.shortcuts import render

def home(request):
    return render(request, 'mapapp/home.html')

def team(request):
    return render(request, "mapapp/team.html")
# Create your views here.
