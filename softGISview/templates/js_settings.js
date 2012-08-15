{% load i18n %}

softgisview = {};
softgisview.settings = {
"school_data_url": "{% url school_data %}",
"page_url": "{% url front_page %}"
};

softgisview.translations = {
    "other": "{% trans 'other' %}",
    "a5min": "{% trans 'about five minutes' %}",
    "a10min": "{% trans 'about ten minutes' %}",
    "a20min": "{% trans 'about twenty minutes' %}",
    "a30min": "{% trans 'about half an hour' %}",
    "a45min": "{% trans 'about three quarters' %}",
    "a60min": "{% trans 'about an hour' %}",
    "o5h": "{% trans 'Over 5 hours' %}",
    "a2_4h": "{% trans '2-4 hours' %}",
    "a1_2h": "{% trans '1-2 hours' %}",
    "l1h": "{% trans 'Less than 1 hour' %}",
    "none": "{% trans 'None' %}",
    "o2h": "{% trans 'Over 2 hours' %}",
    "l2h": "{% trans 'Less than 2 hours' %}",
    "no_a": "{% trans 'No answer' %}",
    "girls": "{% trans 'girls' %}",
    "boys": "{% trans 'boys' %}",
    "tv": "{% trans 'TV, DVDs, or playing' %}",
    "sos": "{% trans 'Social networking' %}",
    "homes": "{% trans 'Homes' %}",
    "travel": "{% trans 'Active travel' %}",
    "time": "{% trans 'Average active time spent' %}",
    "name": "{% trans 'Name' %}"
}
