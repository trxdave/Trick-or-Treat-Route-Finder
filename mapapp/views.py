from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from .models import House
import json

def home(request):
    """Render the home page."""
    return render(request, 'mapapp/home.html')

def map_view(request):
    """Render the main map page. Ensure template mapapp/map.html exists."""
    return render(request, 'mapapp/map.html')


def houses_json(request):
    """Return all houses as JSON for the frontend map to consume."""
    qs = House.objects.all().values('id','name','address','status','latitude','longitude')
    return JsonResponse(list(qs), safe=False)

def add_house(request):
    """Create a house from POST. Accepts FormData or JSON and returns JSON."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    # Accept JSON body or form-encoded (FormData)
    try:
        if request.content_type and 'application/json' in request.content_type:
            payload = json.loads(request.body.decode('utf-8') or '{}')
            name = payload.get('name', '')[:100]
            address = payload.get('address', '')[:255]
            status = payload.get('status', 'none')
            lat = payload.get('latitude') or payload.get('lat')
            lng = payload.get('longitude') or payload.get('lng')
        else:
            name = request.POST.get('name', '')[:100]
            address = request.POST.get('address', '')[:255]
            status = request.POST.get('status', 'none')
            lat = request.POST.get('latitude') or request.POST.get('lat')
            lng = request.POST.get('longitude') or request.POST.get('lng')
    except Exception as e:
        return JsonResponse({'error': 'Invalid payload', 'detail': str(e)}, status=400)

    # convert lat/lng to floats when possible
    try:
        latitude = float(lat) if lat not in (None, '', 'null') else None
    except (TypeError, ValueError):
        latitude = None
    try:
        longitude = float(lng) if lng not in (None, '', 'null') else None
    except (TypeError, ValueError):
        longitude = None

    try:
        house = House.objects.create(
            name=name,
            address=address,
            status=status,
            latitude=latitude,
            longitude=longitude
        )
        return JsonResponse({
            'id': house.id,
            'name': house.name,
            'address': house.address,
            'status': house.status,
            'latitude': house.latitude,
            'longitude': house.longitude,
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': 'Could not create house', 'detail': str(e)}, status=500)

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
