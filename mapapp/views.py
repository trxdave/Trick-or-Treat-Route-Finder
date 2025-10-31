from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from .models import House

def home(request):
    return render(request, 'mapapp/home.html')

def team(request):
    return render(request, "mapapp/team.html")

# Create your views here.
def houses_json(request):
    qs = House.objects.all().values('id','name','address','status','latitude','longitude')
    return JsonResponse(list(qs), safe=False)

def add_house(request):
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        address = request.POST.get('address', '').strip()
        status = request.POST.get('status', 'giving')
        lat = request.POST.get('latitude') or None
        lng = request.POST.get('longitude') or None

        house = House.objects.create(
            name=name,
            address=address,
            status=status,
            latitude=lat,
            longitude=lng
        )

        # If JS called it (Ajax), return JSON. Otherwise redirect for normal form.
        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest' or 'application/json' in request.headers.get('accept', '')
        if is_ajax:
            return JsonResponse({
                'ok': True,
                'id': house.id,
                'name': house.name,
                'address': house.address,
                'status': house.status,
                'latitude': str(house.latitude) if house.latitude is not None else None,
                'longitude': str(house.longitude) if house.longitude is not None else None
            })
        return redirect('home')
    return JsonResponse({'error': 'POST required'}, status=400)

def delete_house(request, pk):
    if request.method == 'POST':
        h = get_object_or_404(House, pk=pk)
        h.delete()
        return JsonResponse({'ok': True})
    return JsonResponse({'error': 'POST required'}, status=400)

def update_house(request, pk):
    """Update a House via POST (AJAX friendly)."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    house = get_object_or_404(House, pk=pk)
    house.name = request.POST.get('name', house.name)[:100]
    house.address = request.POST.get('address', house.address)[:255]
    house.status = request.POST.get('status', house.status)
    lat = request.POST.get('latitude')
    lng = request.POST.get('longitude')
    if lat is not None and lat != '':
        house.latitude = lat
    if lng is not None and lng != '':
        house.longitude = lng
    house.save()
    return JsonResponse({'ok': True})

def map_view(request):
    """Standalone map page (used by urls.py)."""
    return render(request, 'mapapp/map.html')