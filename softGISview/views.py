from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse
from django.http import HttpResponseBadRequest
from django.contrib.gis.measures import D

from softGISview.models import Schools
from geojson_rest.models import Feature
from geojson_rest.models import Property
from opensocial_people.models import Person


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

# This is not a good way to retrieve the data. Should use API methods, but those are not planned
def school_data(request):
    
    if not request.is_ajax():
        return HttpResponseBadRequest

    school = Schools.objects.get(id__exact= request.POST.get('value', ''))
    
    #Get respondants for school
    users = Person.objects.filter(time__expire_time=None).filter(json_data__json_string__contains='"school": "jokiniemen_koulu"')
    
    user_ids = users.values_list('user_id', flat=True)
    
    home_ids = Property.objects.filter(expire_time=None).filter(json_string__contains='home').values_list(feature, flat=True)
    
    homes = Feature.objects.filter(expire_time=None).filter(id__in=list(home_ids)).filter(user_id__in=list(user_ids))
    
    #Calculate the buffer values
    m1000 = homes.filter(geometry__distance_lt=(school.coordinates, D(m=1000)))
    
    m3000 = homes.filter(geometry__distance_lt=(school.coordinates, D(m=3000))).filter(geometry__distance_gte=(school.coordinates, D(m=1000)))
    
    m5000 = homes.filter(geometry__distance_lt=(school.coordinates, D(m=5000))).filter(geometry__distance_gte=(school.coordinates, D(m=3000)))
    m5001 = homes.filter(geometry__distance_gte=(school.coordinates, D(m=5000)))
    
def subcontent(request, page_name):
    """
    if request.is_ajax():
        return HttpResponse('You requested: %s' % page_name)
    else:
        return HttpResponseBadRequest
    """        
    return HttpResponse('You requested: %s' % page_name)
