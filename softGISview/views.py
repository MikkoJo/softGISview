from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse
from django.http import HttpResponseBadRequest

from softGISview.models import Schools

def main(request):
    return render_to_response('welcome.html',
                       context_instance=RequestContext(request))

def trav(request):
    return render_to_response('travel.html',
                      context_instance=RequestContext(request))    

def journey(request):
    school_list = Schools.objects.all()
    
    return render_to_response('journey.html',
                      {"schools": school_list}, 
                      context_instance=RequestContext(request))    

def subcontent(request, page_name):
    """
    if request.is_ajax():
        return HttpResponse('You requested: %s' % page_name)
    else:
        return HttpResponseBadRequest
    """        
    return HttpResponse('You requested: %s' % page_name)
