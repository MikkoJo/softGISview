// Vector layers
var mapOverlays = {};

/*
added to all AJAX calls to the server
*/
$(document).ajaxSend(function(event, xhr, settings) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    function safeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }
    if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader("X-CSRFToken",
                             getCookie("csrftoken"));
    }
});


//Callback functions for api functions
function get_features_callback(response_data) {

    //var response = response_data.response;
 //   var response = response_data;
    //TESTING
 //   pointLayer.events.register("featureadded", undefined, add_popup_to_feature);
    console.log("get_features_callback: " + JSON.stringify(response_data));
    var gjf, features, featArrays = {};

    gjf = new OpenLayers.Format.GeoJSON();
    features = gjf.read(response_data);

    // create arrays for different valueNames from the features array
    for(i = 0; i < features.length; i++) {
        if (featArrays[features[i].attributes.valuename] === undefined) {
            featArrays[features[i].attributes.valuename] = [];
        }
        featArrays[features[i].attributes.valuename].push(features[i]);
/*        if(features[i].geometry instanceof OpenLayers.Geometry.Point) {
            point_array.push(features[i]);
        }
        else if(features[i].geometry instanceof OpenLayers.Geometry.LineString) {
            linestring_array.push(features[i]);
        }
        else if(features[i].geometry instanceof OpenLayers.Geometry.Polygon) {
            polygon_array.push(features[i]);
        }*/
    }
    for(var layer in featArrays) {
        mapOverlays[layer] = new OpenLayers.Layer.Vector(layer, {
                            styleMap: new OpenLayers.StyleMap(styles[layer])
                    });
    }

    for(layer in mapOverlays) {
        mapOverlays[layer].addFeatures(featArrays[layer]);
        map.addLayer(mapOverlays[layer]);
    }
    toggleShow();
    toggleStyle();
 //   map.addLayers(mapOverLays);
//    pointLayer.addFeatures(features);

//    pointLayer.events.unregister("featureadded", undefined, add_popup_to_feature);


}
function get_features(callback) {
    //For test
    // TODO: create a proper geojson_rest api call
    callback(feat_data);
}
function get_profile_callback(response_data) {
    var toSchool = parseFloat(response_data.school_journey.time_to_school),
        fromSchool = parseFloat(response_data.school_journey.time_from_school),
        exercise = response_data.activities.exercise,
        tv_comp = response_data.activities.tv_computer,
        sos_network = response_data.activities.sos_network;
    
    if(isNaN(toSchool)) {
        toSchool = 0;
    }
    if(isNaN(fromSchool)) {
        fromSchool = 0;
    }
    
    $("#school_travel").html(toSchool + fromSchool);
    $("#exercise").html(exercise);
    $("#tv").html(tv_comp + " " + sos_network);
}
function get_profile(callback) {
    //For test
    // TODO: create a proper opensocial_people rest api call
    callback(prof_data);
}

function toggleStyle() {
    var t = $(".color_select :radio").serializeArray();
    console.log(t[0].value);
    for(i in mapOverlays) {
        mapOverlays[i].styleMap = 
            new OpenLayers.StyleMap(
                new OpenLayers.Style(
                    mapOverlays[i].styleMap.styles.default.defaultStyle,
                    style_rules[t[0].value + "_style_rule"]));
        mapOverlays[i].redraw();
    }
}
function toggleShow() {
    var t = [],
        s = $('.select_table :checkbox').serializeArray();
        
    $.each(s, function(i, field) {
    //console.log(i);
    //console.log(field.value);
    t.push(field.value);
    });
    console.log(t);
    for(layer in mapOverlays) {
        if($.inArray(layer, t) !== -1) {
            mapOverlays[layer].setVisibility(true);
        }
        else {
            mapOverlays[layer].setVisibility(false);
        }
    }
/*
    for(var i = 0; i < pointLayer.features.length; i++) {
        if($.inArray(pointLayer.features[i].attributes.valuename, t) !== -1) {
                pointLayer.features[i].style = null;
            }
            else {
                pointLayer.features[i].style = {display:"none"};
            }
    }
    pointLayer.redraw();
    */
}

function submitSchool(schoolID, callback_function) {
    $.ajax({
//        url: "{% url school_data %}",
        url: "/softgisview/school_data",
        type: "POST",
        data: 'value=' + schoolID,
//        contentType: "application/json",
        success: function(data) {
            if(callback_function !== undefined) {
                callback_function(data);
            }
        },
        error: function(e) {
            if(callback_function !== undefined) {
                callback_function(e);
            }
        },
        dataType: "json",
        beforeSend: function(xhr) {
            xhr.withCredentials = true;
        }
    });
}
function init() {
    // Create Layers for different point types
    pointLayer = new OpenLayers.Layer.Vector("Point Layer", {
                            styleMap: new OpenLayers.StyleMap(type_style)
                    });
    //pointLayer = new OpenLayers.Layer.Vector("Point Layer");

    // Center map to Tampere
    map.addLayer(pointLayer);
//    map.setCenter(new OpenLayers.LonLat(328867.166201, 6820011.7771568), 2);
    map.setCenter(new OpenLayers.LonLat(405113.46202689, 6680497.7647955), 2);
    $('.select_table :checkbox').click(toggleShow);
    $(".color_select :radio").click(toggleStyle);
    get_features(get_features_callback);
    
}

function init_teacher() {
    map.setCenter(new OpenLayers.LonLat(405113.46202689, 6680497.7647955), 2);
    $('#school').change(function (evt) {submitSchool(evt.target.value/*, submitSchool_callback*/);});
}
function create_diagram() {
    get_profile(get_profile_callback);
}
var context = {
    getDisplay: function(feat) {
        var checked = $(".select_table :checkbox").serializeArray(), 
            check = [];
        $.each(checked, function(i, field) {
            //console.log(i);
            //console.log(field.value);
            check.push(field.value);
        });
        if($.inArray(feat.attributes.valuename, check) !== -1) {
            return null;
        }
        else {
            return "none";
        }
    }
}
var defStyle = {
    strokeWidth: 1,
    pointRadius: 5,
    pointerEvents: "visiblePainted",
    strokeOpacity: 1,
    fillOpacity: 0.7

}
var styles = [];
styles['feelGood'] = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        OpenLayers.Util.applyDefaults(OpenLayers.Util.applyDefaults({}, defStyle),
        {
            graphicName: 'triangle',
            strokeColor: "#8B2A90",
            fillColor:  "#8B2A90",
        }));
        
styles['feelBad'] = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        OpenLayers.Util.applyDefaults(OpenLayers.Util.applyDefaults({}, defStyle),
        {
            graphicName: 'square',
            strokeColor: "#8B2A90",
            fillColor:  "#8B2A90",
        }));
styles['thingsGood'] = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        OpenLayers.Util.applyDefaults(OpenLayers.Util.applyDefaults({}, defStyle),
        {
            graphicName: 'triangle',
            strokeColor: "#6CCFF5",
            fillColor:  "#6CCFF5",
        }));
        
styles['thingsBad'] = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        OpenLayers.Util.applyDefaults(OpenLayers.Util.applyDefaults({}, defStyle),
        {
            graphicName: 'square',
            strokeColor: "#6CCFF5",
            fillColor:  "#6CCFF5",
        }));
styles['atmosphereGood'] = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        OpenLayers.Util.applyDefaults(OpenLayers.Util.applyDefaults({}, defStyle),
        {
            graphicName: 'triangle',
            strokeColor: "#F99F23",
            fillColor:  "#F99F23",
        }));
        
styles['atmosphereBad'] = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        OpenLayers.Util.applyDefaults(OpenLayers.Util.applyDefaults({}, defStyle),
        {
            graphicName: 'square',
            strokeColor: "#F99F23",
            fillColor:  "#F99F23",
        }));

var type_style = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        {
            strokeWidth: 1,
            pointRadius: 5,
//            graphicName: 'triangle',
            //display: "${getDisplay}",
            pointerEvents: "visiblePainted",
            strokeColor: "red",
            strokeOpacity: 1,
            fillColor:  "#aaaaaa",
            fillOpacity: 0.7
        },
{
            rules: [
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "valuename", // the "foo" feature attribute
                        value: "feelGood"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#8B2A90",
                        strokeColor: "#8B2A90",
                        graphicName: "triangle"
                    }
                }),
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "valuename", // the "foo" feature attribute
                        value: "feelBad"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#8B2A90",
                        strokeColor: "#8B2A90",
                        graphicName: "square"
                    }
                }),
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "valuename", // the "foo" feature attribute
                        value: "thingsGood"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#6CCFF5",
                        strokeColor: "#6CCFF5",
                        graphicName: "triangle"
                    }
                }),
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "valuename", // the "foo" feature attribute
                        value: "thingsBad"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#6CCFF5",
                        strokeColor: "#6CCFF5",
                        graphicName: "square"
                    }
                }),
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "valuename", // the "foo" feature attribute
                        value: "atmosphereGood"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#F99F23",
                        strokeColor: "#F99F23",
                        graphicName: "triangle"
                    }
                }),
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "valuename", // the "foo" feature attribute
                        value: "atmosphereBad"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#F99F23",
                        strokeColor: "#F99F23",
                        graphicName: "square"
                    }
                }),
                new OpenLayers.Rule({
                    elseFilter: true
                })
           ]
        }
        );
var style_rules = {
    transport_style_rule:  
    {
            rules: [
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "how_get", // the "foo" feature attribute
                        value: "walk_bike"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#1B9E77",
                        strokeColor: "#1B9E77"
                    }
                }),
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "how_get", // the "foo" feature attribute
                        value: "public"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#D95F02",
                        strokeColor: "#D95F02"
                    }
                }),
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "how_get", // the "foo" feature attribute
                        value: "car"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#7570B3",
                        strokeColor: "#7570B3"
                    }
                }),
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "how_get", // the "foo" feature attribute
                        value: "moped"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#E7298A",
                        strokeColor: "#E7298A"
                    }
                }),
                new OpenLayers.Rule({
                    elseFilter: true,
                    symbolizer: {
                        pointRadius: 0
                    }
                })
           ]
    },
    reach_style_rule:  
    {
            rules: [
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "come_with", // the "foo" feature attribute
                        value: "alone"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#FBB4AE",
                        strokeColor: "#FBB4AE"
                    }
                }),
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "come_with_", // the "foo" feature attribute
                        value: "alone"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#FBB4AE",
                        strokeColor: "#FBB4AE"
                    }
                }),
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "come_with", // the "foo" feature attribute
                        value: "with_friends"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#B3CDE3",
                        strokeColor: "#B3CDE3"
                    }
                }),
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "come_with_", // the "foo" feature attribute
                        value: "with_friends"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#B3CDE3",
                        strokeColor: "#B3CDE3"
                    }
                }),
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "come_with", // the "foo" feature attribute
                        value: "with_adults"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#CCEBC5",
                        strokeColor: "#CCEBC5"
                    }
                }),
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "come_with_", // the "foo" feature attribute
                        value: "with_adults"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#CCEBC5",
                        strokeColor: "#CCEBC5"
                    }
                }),
                new OpenLayers.Rule({
                    elseFilter: true,
                    symbolizer: {
                        pointRadius: 0
                    }
                })
           ]
    },
    type_style_rule: {}  
};

//var exercise_map = {
//}
