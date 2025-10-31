from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from .models import House

def map_view(request):
    """Render the main map page. Ensure template mapapp/map.html exists."""
    return render(request, 'mapapp/map.html')

def houses_json(request):
    """Return all houses as JSON for the frontend map to consume."""
    qs = House.objects.all().values('id','name','address','status','latitude','longitude')
    return JsonResponse(list(qs), safe=False)

def add_house(request):
    """Handle POST from the map form to create a new House and redirect back."""
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        address = request.POST.get('address', '').strip()
        status = request.POST.get('status', 'giving')
        lat = request.POST.get('latitude') or None
        lng = request.POST.get('longitude') or None
        House.objects.create(
            name=name,
            address=address,
            status=status,
            latitude=lat,
            longitude=lng
        )
    return redirect('map')

def update_house(request, pk):
    """Update an existing house via POST (used by the popup edit)."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    house = get_object_or_404(House, pk=pk)
    house.name = request.POST.get('name', house.name)[:100]
    house.address = request.POST.get('address', house.address)[:255]
    house.status = request.POST.get('status', house.status)
    lat = request.POST.get('latitude')
    lng = request.POST.get('longitude')
    house.latitude = lat or house.latitude
    house.longitude = lng or house.longitude
    house.save()
    return JsonResponse({'ok': True})

def delete_house(request, pk):
    """Delete a House by pk. POST only (CSRF protected)."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    house = get_object_or_404(House, pk=pk)
    house.delete()
    return JsonResponse({'ok': True})