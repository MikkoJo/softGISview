from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse
from django.http import HttpResponseBadRequest
from django.http import HttpResponseForbidden
from django.contrib.gis.measure import D
from django.db.models import Q
from django.contrib.auth.decorators import permission_required
from django.core.urlresolvers import reverse_lazy

from softGISview.models import Schools
from geojson_rest.models import Feature
from geojson_rest.models import Property
from opensocial_people.models import Person

import json
from django.core.context_processors import request
from django.utils.translation import ugettext as _

def main(request):
    return render_to_response('welcome.html',
                       context_instance=RequestContext(request))

def travel(request):
    return render_to_response('travel.html',
                      context_instance=RequestContext(request))    

def get_school_list(request):
    school_list = Schools.objects.all()
    #assert False
    return render_to_response('start.html',
                      {"schools": school_list}, 
                      context_instance=RequestContext(request))    

# This is not a good way to retrieve the data. Should use API methods, but those are not planned/available
@permission_required('softGISview.view_data', raise_exception=True)
def school_data(request):
    
    if not request.is_ajax():
        return HttpResponseBadRequest()

    if request.POST.get('value', '') == '':
        return HttpResponseBadRequest()
        
    school = Schools.objects.get(id__exact=request.POST.get('value', ''))
    
#    js_school = school.values_list('name')[0][0]
    js_school = school.name
    js_school = js_school.split(",")[0].replace(" ", "_", 1).lower()
    #some unicode problem with school name
    js_school = js_school.replace("ä", "\u00e4")
    #Get respondants for school
    users = Person.objects.filter(time__expire_time=None).filter(
                                  json_data__json_string__contains='"school": "%s"' % js_school)
    
    user_ids = users.values_list('user_id', flat=True)
    
    #print (len(user_ids))
    
    home_ids = Property.objects.filter(expire_time=None).filter(
                                       json_string__contains='home').values_list('feature', flat=True)
    
    #print (len(home_ids))
    homes = Feature.objects.filter(expire_time=None).filter(
                                   id__in=list(home_ids)).filter(user_id__in=list(user_ids))
    
    #print len(homes)

    #Calculate the buffer valuesuser_ids = users.values_list('user_id', flat=True)
    m1000 = homes.filter(geometry__distance_lt=(school.coordinates, D(m=1000)))
    
    #print (len(m1000))
    
    m3000 = homes.filter(geometry__distance_lt=(school.coordinates, D(m=3000))).filter(
                         geometry__distance_gte=(school.coordinates, D(m=1000)))
    #print (len(m3000))
    
    m5000 = homes.filter(geometry__distance_lt=(school.coordinates, D(m=5000))).filter(
                         geometry__distance_gte=(school.coordinates, D(m=3000)))
    #print (len(m5000))
    m5001 = homes.filter(geometry__distance_gte=(school.coordinates, D(m=5000)))
    #print (len(m5001))
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
        m1000_temp = m1000_users.exclude(user_id__in=m1000_to.values_list('user_id', flat=True))
        m1000_from = m1000_temp.filter(
                                 Q(json_data__json_string__contains='"how_from_school": "walk"') | 
                                 Q(json_data__json_string__contains='"how_from_school": "bike"'))
#        m1000_from = m1000_users.filter(
#                                 Q(json_data__json_string__contains='"how_from_school": "walk"') | 
#                                 Q(json_data__json_string__contains='"how_from_school": "bike"'))

        # for a in m1000_users:            # b = a.json_data.get('school_journey')            # if b != None:                # try:                    # print a.json_data.get('username')                    # print b['how_to_school']                    # print b['how_from_school']                # except:                    # pass

        # print(len(m1000_users))        # print(len(m1000_to))        # print(len(m1000_temp))        # print(len(m1000_from))
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
        m3000_temp = m3000_users.exclude(user_id__in=m3000_to.values_list('user_id', flat=True))
        m3000_from = m3000_temp.filter(
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
        m5000_temp = m5000_users.exclude(user_id__in=m5000_to.values_list('user_id', flat=True))
        m5000_from = m5000_temp.filter(
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
        m5001_temp = m5001_users.exclude(user_id__in=m5001_to.values_list('user_id', flat=True))
        m5001_from = m5001_temp.filter(
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
    
#    print(t1000)
#    print(t3000)
#    print(t5000)
#    print(t5001)
    
    # Create features
    # First we create buffers
    b1000 = school.coordinates.buffer(1000)
    b3000 = school.coordinates.buffer(3000)
    b5000 = school.coordinates.buffer(5000)

    #calculate distance to the farthest home point from school
    f_dist = 0
    for h in m5001:
        temp_dist = Schools.objects.filter(
                            id__exact=request.POST.get('value', '')).distance(
                            h.geometry)[0].distance.m
        if temp_dist > f_dist:
            f_dist = temp_dist
#        print ('f_dist:' )
#        print (f_dist)
#        print (Schools.objects.filter(
#                            id__exact=request.POST.get('value', '')).distance(
#                            h.geometry)[0].distance.m)

    
    b5001 = school.coordinates.buffer(f_dist)
    
    # then we need to make the rings
    r3000 = b3000.difference(b1000)
    r5000 = b5000.difference(b3000)
    r5001 = b5001.difference(b5000)
    
    # Hardcoded way to make features
    features = []
    
    features.append({
                     "geometry": json.loads(b1000.json),
                     "properties": {
                                    "homes": len(m1000),
                                    "to": m1000_to * 100,
                                    "from": m1000_from * 100,
                                    "travel": ((m1000_to + m1000_from)) * 100,
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
                                    "travel": ((m3000_to + m3000_from)) * 100,
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
                                    "travel": ((m5000_to + m5000_from)) * 100,
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
                                    "travel": ((m5001_to + m5001_from)) * 100,
                                    "time": t5001,
                                    "name": "5001"
                                    }
                     })
    features.append({
                     "geometry": json.loads(school.coordinates.json),
                     "properties": {
                                    "name": school.name,
                                    "type": "school"
                                    }
                     })
    
    featurecollection = {
             "type": "FeatureCollection",
             "crs": {"type": "EPSG", "properties": {"code": school.coordinates.srid}},
             "features": features
             }
                             
    return HttpResponse(json.dumps(featurecollection))  
    
#@permission_required('schools.view_data')
def subcontent(request, page_name, file_type):
    """
    if request.is_ajax():
        return HttpResponse(    if not request.is_ajax():
        return HttpResponseBadRequest

    school = Schools.objects.get(id__exact=request.POST.get('value', ''))
    
#    js_school = school.values_list('name')[0][0]
    js_school = school.name
    js_school = js_school.split(",")[0].replace(" ", "_", 1).lower()
    #some unicode problem with school name
    js_school = js_school.replace("ä", "\u00e4")
    #Get respondants for school
    users = Person.objects.filter(time__expire_time=None).filter(
                                  json_data__json_string__contains='"school": "%s"' % js_school)
    
    user_ids = users.values_list('user_id', flat=True)
'You requested: %s' % page_name)
    else:
        return HttpResponseBadRequest
    """
    
    #print (request.user)
    if request.user.has_perm('softGISview.view_data') or page_name == 'js_settings':
        school_id = request.POST.get('value', '')
        return render_to_response(page_name + "." + file_type,
               {"school_id": school_id},        
               context_instance=RequestContext(request))
    else:
        return HttpResponseForbidden()
    #return HttpResponse('You requested: %s' % page_name)

@permission_required('softGISview.view_data', raise_exception=True)
def get_free_time_features(request):

    if not request.is_ajax():
        return HttpResponseBadRequest()

    if request.POST.get('value', '') == '':
        return HttpResponseBadRequest()

    school = Schools.objects.get(id__exact=request.POST.get('value', ''))
    
#    js_school = school.values_list('name')[0][0]
    js_school = school.name
    js_school = js_school.split(",")[0].replace(" ", "_", 1).lower()
    #some unicode problem with school name
    js_school = js_school.replace("ä", "\u00e4")
    #Get respondants for school
    users = Person.objects.filter(time__expire_time=None).filter(
                                  json_data__json_string__contains='"school": "%s"' % js_school)
    
    user_ids = users.values_list('user_id', flat=True)
    
    # Get correct features
    properties = Property.objects.filter(expire_time=None).filter(json_string__contains='"valuename": "thingsGood"')
    
    # Filter to get only features from current school
    properties = properties.filter(feature__user_id__in=user_ids)
    
    cs = properties.filter(json_string__contains='"competitive_sports"')
    ma = properties.filter(json_string__contains='"moving_around"')
    rs = properties.filter(json_string__contains='"recreational_sports"')
    
    features = []
    
    for f in cs:
        f_json = f.geojson()
        f_json['properties']['valuename'] = 'competitive'
        features.append(f_json)
    
    for f in ma:
        f_json = f.geojson()
        f_json['properties']['valuename'] = 'moving'
        features.append(f_json)

    for f in rs:
        f_json = f.geojson()
        f_json['properties']['valuename'] = 'recreational'
        features.append(f_json)
    
    featurecollection = {
             "type": "FeatureCollection",
             "crs": {"type": "EPSG", "properties": {"code": school.coordinates.srid}},
             "features": features
             }

    return HttpResponse(json.dumps(featurecollection))

@permission_required('softGISview.view_data', raise_exception=True)
def get_time_classes(request):
     
    if not request.is_ajax():
        return HttpResponseBadRequest()

    if request.POST.get('value', '') == '':
        return HttpResponseBadRequest()

    school = Schools.objects.get(id__exact=request.POST.get('value', ''))
    
#    js_school = school.values_list('name')[0][0]
    js_school = school.name
    js_school = js_school.split(",")[0].replace(" ", "_", 1).lower()
    #some unicode problem with school name
    js_school = js_school.replace("ä", "\u00e4")
    #Get respondants for school
    users = Person.objects.filter(time__expire_time=None).filter(
                                  json_data__json_string__contains='"school": "%s"' % js_school)
    
    total_users = float(len(users))
    
    if total_users == 0:
        return HttpResponse(json.dumps([[0,0,0,0,0]]))
    
    t_7 = users.filter(json_data__json_string__contains='"exercise": "7h_or_more"')
    t_6 = users.filter(json_data__json_string__contains='"exercise": "4_6_hours"')
    t_3 = users.filter(json_data__json_string__contains='"exercise": "2_3_hours"')
    t_1 = users.filter(json_data__json_string__contains='"exercise": "less_hour"')
    t_none = users.filter(json_data__json_string__contains='"exercise": "none"')
    
    time_class_data = []
    time_class_data.append((len(t_7)/total_users)*100)
    time_class_data.append((len(t_6)/total_users)*100)
    time_class_data.append((len(t_3)/total_users)*100)
    time_class_data.append((len(t_1)/total_users)*100)
    time_class_data.append((len(t_none)/total_users)*100)
    
    return HttpResponse(json.dumps([time_class_data]))
    

@permission_required('softGISview.view_data', raise_exception=True)
def get_screen_times(request):
     
    if not request.is_ajax():
        return HttpResponseBadRequest()

    if request.POST.get('value', '') == '':
        return HttpResponseBadRequest()

    school = Schools.objects.get(id__exact=request.POST.get('value', ''))
    
#    js_school = school.values_list('name')[0][0]
    js_school = school.name
    js_school = js_school.split(",")[0].replace(" ", "_", 1).lower()
    #some unicode problem with school name
    js_school = js_school.replace("ä", "\u00e4")
    #Get respondants for school
    users = Person.objects.filter(time__expire_time=None).filter(
                                  json_data__json_string__contains='"school": "%s"' % js_school)
    
    boys = users.filter(json_data__json_string__contains='"gender": "boy"')
    girls = users.filter(json_data__json_string__contains='"gender": "girl"')

    total_boys = float(len(boys))
    total_girls = float(len(girls))
    
    if len(boys) > 0:
        tv_over2h_boys = boys.filter(
                         Q(json_data__json_string__contains='"tv_computer": "more_5_hours"') | 
                         Q(json_data__json_string__contains='"tv_computer": "2_4_hours"'))

        tv_under2h_boys = boys.filter(
                         Q(json_data__json_string__contains='"tv_computer": "1_2_hours"') | 
                         Q(json_data__json_string__contains='"tv_computer": "less_1_hours"') |
                         Q(json_data__json_string__contains='"tv_computer": "none"'))

        social_over2h_boys = boys.filter(
                         Q(json_data__json_string__contains='"sos_network": "more_5_hours"') | 
                         Q(json_data__json_string__contains='"sos_network": "2_4_hours"'))

        social_under2h_boys = boys.filter(
                         Q(json_data__json_string__contains='"sos_network": "1_2_hours"') | 
                         Q(json_data__json_string__contains='"sos_network": "less_1_hours"') |
                         Q(json_data__json_string__contains='"sos_network": "none"'))
        
        tv_o2h_b = (len(tv_over2h_boys)/total_boys)*100
        tv_u2h_b = (len(tv_under2h_boys)/total_boys)*100
        sos_o2h_b = (len(social_over2h_boys)/total_boys)*100
        sos_u2h_b = (len(social_under2h_boys)/total_boys)*100
        tv_eos_b = 100 - (tv_o2h_b + tv_u2h_b)
        sos_eos_b = 100 - (sos_o2h_b + sos_u2h_b)
        
        tv_b = [[_(u'Over 2 hours'), tv_o2h_b],[_(u'Less than 2 hours'), tv_u2h_b],[_(u'No answer'), tv_eos_b]]
        sos_b = [[_(u'Over 2 hours'), sos_o2h_b],[_(u'Less than 2 hours'), sos_u2h_b],[_(u'No answer'), sos_eos_b]]

    else:
        tv_b = [[_(u'Over 2 hours'), 0],[_(u'Less than 2 hours'), 0],[_(u'No answer'), 0]]
        sos_b = [[_(u'Over 2 hours'), 0],[_(u'Less than 2 hours'), 0],[_(u'No answer'), 0]]
        
    if len(girls) > 0:
        tv_over2h_girls = girls.filter(
                         Q(json_data__json_string__contains='"tv_computer": "more_5_hours"') | 
                         Q(json_data__json_string__contains='"tv_computer": "2_4_hours"'))


        tv_under2h_girls = girls.filter(
                         Q(json_data__json_string__contains='"tv_computer": "1_2_hours"') | 
                         Q(json_data__json_string__contains='"tv_computer": "less_1_hours"') |
                         Q(json_data__json_string__contains='"tv_computer": "none"'))

        social_over2h_girls = girls.filter(
                         Q(json_data__json_string__contains='"sos_network": "more_5_hours"') | 
                         Q(json_data__json_string__contains='"sos_network": "2_4_hours"'))

        social_under2h_girls = girls.filter(
                         Q(json_data__json_string__contains='"sos_network": "1_2_hours"') | 
                         Q(json_data__json_string__contains='"sos_network": "less_1_hours"') |
                         Q(json_data__json_string__contains='"sos_network": "none"'))
    
        tv_o2h_g = (len(tv_over2h_girls)/total_girls)*100
        tv_u2h_g = (len(tv_under2h_girls)/total_girls)*100
        sos_o2h_g = (len(social_over2h_girls)/total_girls)*100
        sos_u2h_g = (len(social_under2h_girls)/total_girls)*100
        tv_eos_g = 100 - (tv_o2h_g + tv_u2h_g)
        sos_eos_g = 100 - (sos_o2h_g + sos_u2h_g)

        tv_g = [[_(u'Over 2 hours'), tv_o2h_g],[_(u'Less than 2 hours'), tv_u2h_g],[_(u'No answer'), tv_eos_g]]
        sos_g = [[_(u'Over 2 hours'), sos_o2h_g],[_(u'Less than 2 hours'), sos_u2h_g],[_(u'No answer'), sos_eos_g]]

    else:
        tv_g = [[_(u'Over 2 hours'), 0],[_(u'Less than 2 hours'), 0],[_(u'No answer'), 0]]
        sos_g = [[_(u'Over 2 hours'), 0],[_(u'Less than 2 hours'), 0],[_(u'No answer'), 0]]
    
    return_json = {'tv_b': tv_b,
                   'sos_b': sos_b,
                   'tv_g': tv_g,
                   'sos_g': sos_g}

    return HttpResponse(json.dumps(return_json))
