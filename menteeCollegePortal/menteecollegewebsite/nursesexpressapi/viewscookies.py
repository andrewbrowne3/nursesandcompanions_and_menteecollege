from django.http import JsonResponse
from mentee_college_online_school.models import PageVisit
from django.views.decorators.csrf import csrf_exempt
import json
import geoip2.database
import os
import logging

# Path to the GeoLite2 database
DB_PATH = os.path.expanduser("~/GeoLite2-City_20250103/GeoLite2-City.mmdb")

# Set up logging
logger = logging.getLogger(__name__)

# Check if the database exists
if not os.path.exists(DB_PATH):
    logger.error(f"GeoLite2 database not found at {DB_PATH}. Please ensure the file is correctly placed.")
@csrf_exempt
def track_page_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            session_id = data.get('session_id')
            page_url = data.get('page_url')
            page_path = data.get('page_path')
            timestamp = data.get('timestamp')
            time_spent = data.get('time_spent', 0)
            
            # Extract referrer URL if provided, fallback to HTTP_REFERER
            referrer_url = data.get('referrer_url', request.META.get('HTTP_REFERER', None))

            # Validate required fields
            if not all([session_id, page_url, page_path, timestamp]):
                return JsonResponse({'error': 'Missing required fields'}, status=400)

            # Get IP address
            ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR'))
            if ip_address:
                ip_address = ip_address.split(',')[0].strip()

            # Geolocation logic
            geo_data = {'ip': ip_address, 'country': None, 'region': None, 'city': None, 'latitude': None, 'longitude': None}
            try:
                if ip_address:
                    with geoip2.database.Reader(DB_PATH) as reader:
                        response = reader.city(ip_address)
                        geo_data.update({
                            'country': response.country.name if response.country else None,
                            'region': response.subdivisions.most_specific.name if response.subdivisions.most_specific else None,
                            'city': response.city.name if response.city else None,
                            'latitude': response.location.latitude if response.location.latitude else None,
                            'longitude': response.location.longitude if response.location.longitude else None,
                        })
            except geoip2.errors.AddressNotFoundError:
                pass
            except Exception as e:
                logger.error(f"Error querying GeoLite2 database for IP {ip_address}: {e}")

            # Create the PageVisit object
            PageVisit.objects.create(
                session_id=session_id,
                page_url=page_url,
                page_path=page_path,
                timestamp=timestamp,
                time_spent=int(time_spent),
                ip_address=ip_address,
                country=geo_data['country'],
                region=geo_data['region'],
                city=geo_data['city'],
                latitude=geo_data['latitude'],
                longitude=geo_data['longitude'],
                referrer_url=referrer_url  # Save referrer URL, can be None
            )

            return JsonResponse({'message': 'Page view tracked successfully.', 'geolocation': geo_data}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)