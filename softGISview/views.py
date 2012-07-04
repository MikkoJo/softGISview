from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse
from django.http import HttpResponseBadRequest
from django.contrib.gis.measure import D
from django.db.models import Q

from softGISview.models import Schools
from geojson_rest.models import Feature
from geojson_rest.models import Property
from opensocial_people.models import Person

import json


def main(request):
    return render_to_response('welcome.html',
                       context_instance=RequestContext(request))

def travel(request):
    return render_to_response('travel.html',
                      context_instance=RequestContext(request))    

def get_school_list(request):
    school_list = Schools.objects.all()
    
    return render_to_response('school_list.html',
                      {"schools": school_list}, 
                      context_instance=RequestContext(request))    

# This is not a good way to retrieve the data. Should use API methods, but those are not planned/available
def school_data(request):
    
    if not request.is_ajax():
        return HttpResponseBadRequest

    school = Schools.objects.get(id__exact=request.POST.get('value', ''))
    
#    js_school = school.values_list('name')[0][0]
    js_school = school.name
    js_school = js_school.split(",")[0].replace(" ", "_", 1).lower()
    #Get respondants for school
    users = Person.objects.filter(time__expire_time=None).filter(
                                  json_data__json_string__contains='"school": "%s"' % js_school)
    
    user_ids = users.values_list('user_id', flat=True)
    
    home_ids = Property.objects.filter(expire_time=None).filter(
                                       json_string__contains='home').values_list('feature', flat=True)
    
    homes = Feature.objects.filter(expire_time=None).filter(
                                   id__in=list(home_ids)).filter(user_id__in=list(user_ids))
    
    print len(homes)
    #Calculate the buffer values
    m1000 = homes.filter(geometry__distance_lt=(school.coordinates, D(m=1000)))
    
    print (len(m1000))
    
    m3000 = homes.filter(geometry__distance_lt=(school.coordinates, D(m=3000))).filter(
                         geometry__distance_gte=(school.coordinates, D(m=1000)))
    print (len(m3000))
    
    m5000 = homes.filter(geometry__distance_lt=(school.coordinates, D(m=5000))).filter(
                         geometry__distance_gte=(school.coordinates, D(m=3000)))
    print (len(m5000))
    m5001 = homes.filter(geometry__distance_gte=(school.coordinates, D(m=5000)))
    print (len(m5001))
#    print len(homes.filter(geometry__distance_gte=(school.coordinates, D(m=1000))))
    
    num_of_students = [len(m1000), len(m3000), len(m5000), len(m5001)]
    
    m1000_to = 0
    m1000_from = 0
    m3000_to = 0
    m3000_from = 0
    m5000_to = 0
    m5000_from = 0
    m5001_to = 0
    m5001_from = 0
    
    # The times
    t1000 = 0;
    t3000 = 0;
    t5000 = 0;
    t5001 = 0;

    if not len(m1000) == 0:
        m1000_users = users.filter(time__expire_time=None).filter(
                                   user_id__in=m1000.values_list('user_id', flat=True))
        
        m1000_to = m1000_users.filter(
                                 Q(json_data__json_string__contains='"how_to_school": "walk"') | 
                                 Q(json_data__json_string__contains='"how_to_school": "bike"'))
        m1000_from = m1000_users.filter(
                                 Q(json_data__json_string__contains='"how_from_school": "walk"') | 
                                 Q(json_data__json_string__contains='"how_from_school": "bike"'))

        m1000_to = float(len(m1000_to))/len(m1000)
        m1000_from = float(len(m1000_from))/len(m1000)
        
        for u in m1000_users:
            try:
                t1000 += float(u.json_data.get("school_journey")["time_from_school"])
            except ValueError:
                if "-" in u.json_data.get("school_journey")["time_from_school"]:
                    temp = u.json_data.get("school_journey")["time_from_school"].split("-")
                    temp = (float(temp[0]) + float(temp[1]))/2.0
                    t1000 += temp
            try:
                t1000 += float(u.json_data.get("school_journey")["time_to_school"])
            except ValueError:
                if "-" in u.json_data.get("school_journey")["time_to_school"]:
                    temp = u.json_data.get("school_journey")["time_to_school"].split("-")
                    temp = (float(temp[0]) + float(temp[1]))/2.0
                    t1000 += temp
        try:
            t1000 = t1000 / len(m1000_users)
        except ZeroDivisionError:
            t1000 = 0

    if not len(m3000) == 0:
        m3000_users = users.filter(time__expire_time=None).filter(
                                   user_id__in=m3000.values_list('user_id', flat=True))
    
        m3000_to = m3000_users.filter(
                                 Q(json_data__json_string__contains='"how_to_school": "walk"') | 
                                 Q(json_data__json_string__contains='"how_to_school": "bike"'))
        m3000_from = m3000_users.filter(
                                 Q(json_data__json_string__contains='"how_from_school": "walk"') | 
                                 Q(json_data__json_string__contains='"how_from_school": "bike"'))

        m3000_to = float(len(m3000_to))/len(m3000)
        m3000_from = float(len(m3000_from))/len(m3000)

        for u in m3000_users:
            try:
                t3000 += float(u.json_data.get("school_journey")["time_from_school"])
            except ValueError:
                if "-" in u.json_data.get("school_journey")["time_from_school"]:
                    temp = u.json_data.get("school_journey")["time_from_school"].split("-")
                    temp = (float(temp[0]) + float(temp[1]))/2.0
                    t3000 += temp
            try:
                t3000 += float(u.json_data.get("school_journey")["time_to_school"])
            except ValueError:
                if "-" in u.json_data.get("school_journey")["time_to_school"]:
                    temp = u.json_data.get("school_journey")["time_to_school"].split("-")
                    temp = (float(temp[0]) + float(temp[1]))/2.0
                    t3000 += temp
        try:
            t3000 = t3000 / len(m3000_users)
        except ZeroDivisionError:
            t3000 = 0
    
    if not len(m5000) == 0:
        m5000_users = users.filter(time__expire_time=None).filter(
                                   user_id__in=m5000.values_list('user_id', flat=True))
    
        m5000_to = m5000_users.filter(
                                 Q(json_data__json_string__contains='"how_to_school": "walk"') | 
                                 Q(json_data__json_string__contains='"how_to_school": "bike"'))
        m5000_from = m5000_users.filter(
                                 Q(json_data__json_string__contains='"how_from_school": "walk"') | 
                                 Q(json_data__json_string__contains='"how_from_school": "bike"'))

        m5000_to = float(len(m5000_to))/len(m5000)
        m5000_from = float(len(m5000_from))/len(m5000)

        for u in m5000_users:
            try:
                t5000 += float(u.json_data.get("school_journey")["time_from_school"])
            except ValueError:
                if "-" in u.json_data.get("school_journey")["time_from_school"]:
                    temp = u.json_data.get("school_journey")["time_from_school"].split("-")
                    temp = (float(temp[0]) + float(temp[1]))/2.0
                    t5000 += temp
            try:
                t5000 += float(u.json_data.get("school_journey")["time_to_school"])
            except ValueError:
                if "-" in u.json_data.get("school_journey")["time_to_school"]:
                    temp = u.json_data.get("school_journey")["time_to_school"].split("-")
                    temp = (float(temp[0]) + float(temp[1]))/2.0
                    t5000 += temp
        try:
            t5000 = t5000 / len(m5000_users)
        except ZeroDivisionError:
            t5000 = 0
    
    if not len(m5001) == 0:
        m5001_users = users.filter(time__expire_time=None).filter(
                                   user_id__in=m5001.values_list('user_id', flat=True))
    
        m5001_to = m5001_users.filter(
                                 Q(json_data__json_string__contains='"how_to_school": "walk"') | 
                                 Q(json_data__json_string__contains='"how_to_school": "bike"'))
        m5001_from = m5001_users.filter(
                                 Q(json_data__json_string__contains='"how_from_school": "walk"') | 
                                 Q(json_data__json_string__contains='"how_from_school": "bike"'))

        m5001_to = float(len(m5001_to))/len(m5001)
        m5001_from = float(len(m5001_from))/len(m5001)

        for u in m5001_users:
            try:
                t5001 += float(u.json_data.get("school_journey")["time_from_school"])
            except ValueError:
                if "-" in u.json_data.get("school_journey")["time_from_school"]:
                    temp = u.json_data.get("school_journey")["time_from_school"].split("-")
                    temp = (float(temp[0]) + float(temp[1]))/2.0
                    t5001 += temp
            try:
                t5001 += float(u.json_data.get("school_journey")["time_to_school"])
            except ValueError:
                if "-" in u.json_data.get("school_journey")["time_to_school"]:
                    temp = u.json_data.get("school_journey")["time_to_school"].split("-")
                    temp = (float(temp[0]) + float(temp[1]))/2.0
                    t5001 += temp
        try:
            t5001 = t5001 / len(m5001_users)
        except ZeroDivisionError:
            t5001 = 0

    
                
    
#    print(len(m1000_to))
#    print(len(m1000_from))
#    print(len(m3000_to))
#    print(len(m3000_from))
#    print(len(m5000_to))
#    print(len(m5000_from))
#    print(len(m5001_to))
#    print(len(m5001_from))
    
    print(t1000)
    print(t3000)
    print(t5000)
    print(t5001)
    
    # Create features
    # First we create buffers
    b1000 = school.coordinates.buffer(1000)
    b3000 = school.coordinates.buffer(3000)
    b5000 = school.coordinates.buffer(5000)

    #calculate distance to the farthest home point from school
    f_dist = 0
    for h in m5001:
        if school.coordinates.distance(h.geometry) > f_dist:
            f_dist = school.coordinates.distance(h.geometry)

    
    b5001 = school.coordinates.buffer(f_dist)
    
    # then we need to make the rings
    r3000 = b3000.difference(b1000)
    r5000 = b5000.difference(b3000)
    r5001 = b5001.difference(b5000)
    
    # Hardcoded way to make features
    features = []
    
    features.append({
                     "geometry": json.loads(school.coordinates.json),
                     "properties": {
                                    "name": school.name,
                                    "type": "school"
                                    }
                     })
    features.append({
                     "geometry": json.loads(b1000.json),
                     "properties": {
                                    "homes": len(m1000),
                                    "to": m1000_to * 100,
                                    "from": m1000_from * 100,
                                    "time": t1000,
                                    "name": "1000"
                                    }
                     })
    features.append({
                     "geometry": json.loads(r3000.json),
                     "properties": {
                                    "homes": len(m3000),
                                    "to": m3000_to * 100,
                                    "from": m3000_from * 100,
                                    "time": t3000,
                                    "name": "3000"
                                    }
                     })
    features.append({
                     "geometry": json.loads(r5000.json),
                     "properties": {
                                    "homes": len(m5000),
                                    "to": m5000_to * 100,
                                    "from": m5000_from * 100,
                                    "time": t5000,
                                    "name": "5000"
                                    }
                     })
    features.append({
                     "geometry": json.loads(r5001.json),
                     "properties": {
                                    "homes": len(m5001),
                                    "to": m5001_to * 100,
                                    "from": m5001_from * 100,
                                    "time": t5001,
                                    "name": "5001"
                                    }
                     })
    
    featurecollection = {
             "type": "FeatureCollection",
             "crs": {"type": "EPSG", "properties": {"code": school.coordinates.srid}},
             "features": features
             }
                             
    return HttpResponse(json.dumps(featurecollection))  
    
def subcontent(request, page_name):
    """
    if request.is_ajax():
        return HttpResponse('You requested: %s' % page_name)
    else:
        return HttpResponseBadRequest
    """        
    return HttpResponse('You requested: %s' % page_name)
