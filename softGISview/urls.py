from django.conf.urls import patterns
from django.conf.urls import url

urlpatterns = patterns('softGISview.views',
    url(r'^$', 
        'main',
        name='front_page'),
    url(r'^travel$', 
        'travel',
        name='travel'),
    url(r'^teacher$', 
        'get_school_list',
        name='teacher'),
    url(r'^school_data$', 
        'school_data',
        name='school_data'),
    url(r'^school_journey$', 
        'journey',
        name='journey'),
    url(r'^content/(?P<page_name>\w+)', 
        'subcontent',
        name='subcontent'),
)