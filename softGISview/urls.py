from django.conf.urls import patterns
from django.conf.urls import url

urlpatterns = patterns('softGISview.views',
    url(r'^$', 
        'main',
        name='front_page'),
    url(r'^travel$', 
        'trav',
        name='travel'),
    url(r'^content/(?P<page_name>\w+)', 
        'subcontent',
        name='subcontent'),
)