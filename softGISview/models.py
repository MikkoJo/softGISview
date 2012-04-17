from django.conf import settings
from django.contrib.gis.db import models
from django.contrib.gis.gdal import OGRGeometry

# Create your models here.

class Schools(models.Model):
    name = models.TextField()
    coordinates = models.PointField(srid = getattr(settings, 'SPATIAL_REFERENCE_SYSTEM_ID', 4326))

    objects = models.GeoManager()
    
    def __unicode__(self):
        return self.name