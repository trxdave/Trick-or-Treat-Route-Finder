from django.shortcuts import render

def home(request):
    return render(request, 'mapapp/home.html')

# Create your views here.
