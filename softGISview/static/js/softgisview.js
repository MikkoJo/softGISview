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

    if (features === null) {
        return;
    }
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
function get_features(callback_function) {
    //For test
    // TODO: create a proper geojson_rest api call
    //callback(feat_data);
    
    $.ajax({
        url: softgisview.settings.page_url +"free_time",
        //url: "/softgisview/school_data",
        type: "POST",
        data: 'value=' + $("#school")[0].value,
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
                    mapOverlays[i].styleMap.styles['default'].defaultStyle,
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
    for(var layer in mapOverlays) {
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
function update_legend() {
    var layerName = $(".color_select :radio").serializeArray()[0].value;
    var layer = map.getLayersByName(layerName)[0];
    var r = layer.styleMap.styles["default"].rules;
    var table = $("#legendTable");
    table.html('');
    for (var i = 0; i < r.length; i++) {
       var tr = $(document.createElement("tr")); 
       tr.append($('<td></td>', {'class': 'legend_color'}));
       tr.append($('<td></td>', {'class': 'legend_label'}));
       tr.children(".legend_color").css("background-color", r[i].symbolizer.fillColor);
       tr.children(".legend_label").html(r[i].name);
       tr.appendTo(table);
    }
/*    $("#legendTable tr").each(function(index) {
        var r = layer.styleMap.styles["default"].rules;
        console.log(r[index].name);
        //console.log(r[index].id);
        console.log(r[index].symbolizer.fillColor);
        $(this).children(".legend_color").css("background-color", r[index].symbolizer.fillColor);
        $(this).children(".legend_label").html(r[index].name);

    });
*/
    if($("#legendContainer").css("visibility") === "hidden") {
        $("#legendContainer").css("visibility", "visible");
    }

}

function change_layer() {
    $(".color_select :radio").each(function() {
      var name = this.value;
      var checked = this.checked;
      map.getLayersByName(name)[0].setVisibility(checked); 
    });
    update_legend();
}

function submitSchool_callback(response, textStatus) {
    console.log(textStatus);
    console.log(response);
    if (textStatus === 'error') {
        return;
    }
    var geojson_format = new OpenLayers.Format.GeoJSON();
    travel_buffersLayer.addFeatures(geojson_format.read(response));
    travel_time_buffersLayer.addFeatures(geojson_format.read(response));
    // Center at school
    var school = travel_buffersLayer.getFeaturesByAttribute('type', 'school')[0];
    map.setCenter(new OpenLayers.LonLat(school.geometry.x,school.geometry.y));
    if($(".color_select").css("visibility") === "hidden") {
        $(".color_select").css("visibility", "visible");
    }
    update_legend();
    
}

function submitSchool(schoolID, callback_function) {
    $.ajax({
        url: softgisview.settings.school_data_url,
        //url: "/softgisview/school_data",
        type: "POST",
        data: 'value=' + schoolID,
//        contentType: "application/json",
        success: function(data, textStatus) {
            if(callback_function !== undefined) {
                callback_function(data, textStatus);
            }
        },
        error: function(e, textStatus) {
            if(callback_function !== undefined) {
                callback_function(e, textStatus);
            }
        },
        dataType: "json",
        beforeSend: function(xhr) {
            xhr.withCredentials = true;
        }
    });
}
function free_time_callback(response) {
    travel_buffersLayer.setVisibility(false);
    travel_time_buffersLayer.setVisibility(false);
    $("#content").html(response);
    $('.select_table :checkbox').click(toggleShow);
    $(".color_select :radio").click(toggleStyle);
    $(".navigationButton").click(function () {
            console.log(this.value);
            change_page(this.value, this.value + "_callback");
        }
        );
    get_features(get_features_callback);
    
}

var ajaxDataRenderer = function(url, plot, options) {

    var ret = null;
    $.ajax({
        url: softgisview.settings.page_url + url,
        //url: "/softgisview/school_data",
        type: "POST",
        async: false,
        data: 'value=' + $("#school")[0].value,
//        contentType: "application/json",
        success: function(data) {
//            if(callback_function !== undefined && typeof window[callback_function] === 'function') {
//                window[callback_function](data);
//            }
            ret = data;
        },
        error: function(e) {
//            if(callback_function !== undefined && typeof window[callback_function] === 'function') {
//                window[callback_function](e);
//            }
            ret = [[0]];
        },
        dataType: "json",
        beforeSend: function(xhr) {
            xhr.withCredentials = true;
        }
    });
    return ret;
}
function time_classes_callback(response) {
//    travel_buffersLayer.setVisibility(false);
//    travel_time_buffersLayer.setVisibility(false);
    $("#content").html(response);
    var s1 = [20,29,5,15,31];
    var ticks = ['yli 7h', '4-6h', '2-3h', 'alle 1h', 'ei lainkaan'];
//    var ticks = ['a', 'b', 'c', 'd', 'e'];
    var plot1 = $.jqplot('time_use_chart', 'time_class', {
        dataRenderer: ajaxDataRenderer,
        dataRendererOptions: {
            callback_function: 'jsonurl'
        },
        title: "Ajankäyttö",
        // The "seriesDefaults" option is an options object that will
        // be applied to all series in the chart.
        seriesDefaults:{
            renderer:$.jqplot.BarRenderer,
            rendererOptions: {
                fillToZero: true,
                varyBarColor: true
//                barPadding: 18,
//                barMargin: 30
            }
        },
        axes: {
            // Use a category axis on the x axis and use our custom ticks.
            xaxis: {
                renderer: $.jqplot.CategoryAxisRenderer,
                ticks: ticks
            },
            // Pad the y axis just a little so bars can get close to, but
            // not touch, the grid boundaries.  1.2 is the default padding.
            yaxis: {
                pad: 1.05,
                tickOptions: {formatString: '%d%'}
            }
        }        
        });
    $(".navigationButton").click(function () {
            console.log(this.value);
            change_page(this.value, this.value + "_callback");
        }
        );
    
}
function screen_time_data_callback(response, textStatus) {

//    var s1 = [['Yli 2h',40],['Alle 2h',60]];
//    var s2 = [['Yli 2h',23],['Alle 2h',77]];
//    var s3 = [['Yli 2h',10],['Alle 2h',90]];
//    var s4 = [['Yli 2h',49],['Alle 2h',51]];
    if (textStatus === 'error') {
        return;
    }
    var serDefaults = {
            renderer:$.jqplot.PieRenderer,
            rendererOptions: {
                showDataLabels: true
            }
        };
//    var s2 = [[23],[77]];
//    var ticks = ['yli 7h', '4-6h', '2-3h', 'alle 1h', 'ei lainkaan'];
//    var ticks = ['a', 'b', 'c', 'd', 'e'];
    var plot1 = $.jqplot('screen_time_chart_1', [response.tv_g], {
        title: {text: "tv, dvd ja pelaaminen, tytöt",
                fontSize: '0.9em'
        },
        // The "seriesDefaults" option is an options object that will
        // be applied to all series in the chart.
        seriesDefaults: serDefaults
        });
    var plot2 = $.jqplot('screen_time_chart_2', [response.tv_b], {
        title: {text: "tv, dvd ja pelaaminen, pojat",
                fontSize: '0.9em'
        },
        // The "seriesDefaults" option is an options object that will
        // be applied to all series in the chart.
        seriesDefaults: serDefaults,
        legend: { show:true, location: 'nw', placement: 'outside' }
        });
    var plot3 = $.jqplot('screen_time_chart_3', [response.sos_g], {
        title: {text: "sosiaalinen media, tytöt",
                fontSize: '0.9em'
        },
        // The "seriesDefaults" option is an options object that will
        // be applied to all series in the chart.
        seriesDefaults: serDefaults
        });
    var plot4 = $.jqplot('screen_time_chart_4', [response.sos_b], {
        title: {text: "sosiaalinen media, pojat",
                fontSize: '0.9em'
        },
        // The "seriesDefaults" option is an options object that will
        // be applied to all series in the chart.
        seriesDefaults: serDefaults
        });

}

function screen_time_callback(response) {
//    travel_buffersLayer.setVisibility(false);
//    travel_time_buffersLayer.setVisibility(false);
    $("#content").html(response);
    $.ajax({
        url: softgisview.settings.page_url + 'screen_time',
        //url: "/softgisview/school_data",
        type: "POST",
        data: 'value=' + $("#school")[0].value,
//        contentType: "application/json",
        success: function(data, textStatus) {
            screen_time_data_callback(data, textStatus);
        },
        error: function(e, textStatus) {
            screen_time_data_callback(e, textStatus);
        },
        dataType: "json",
        beforeSend: function(xhr) {
            xhr.withCredentials = true;
        }
    });

    $(".navigationButton").click(function () {
            console.log(this.value);
            change_page(this.value, this.value + "_callback");
        }
        );
    
}

function change_page(page_name, callback_function) {
    
    $.ajax({
        url: softgisview.settings.page_url +"content/html/"  + page_name,
        //url: "/softgisview/school_data",
        type: "POST",
        data: 'value=' + $("#school")[0].value,
//        contentType: "application/json",
        success: function(data) {
            if(callback_function !== undefined && typeof window[callback_function] === 'function') {
                window[callback_function](data);
            }
        },
        error: function(e) {
            if(callback_function !== undefined && typeof window[callback_function] === 'function') {
                window[callback_function](e);
            }
        },
        dataType: "html",
        beforeSend: function(xhr) {
            xhr.withCredentials = true;
        }
    });
}
function onPopupClose(evt) {
    selectControl.unselect(selectedFeature);
}
function onFeatureSelect(feature) {
    selectedFeature = feature;
    var popup = new OpenLayers.Popup.FramedCloud("popup", 
//                             feature.geometry.getBounds().getCenterLonLat(),
                             map.getLonLatFromPixel(this.handlers.feature.down),
                             null,
                             "<div style='font-size:.8em'>Homes: " + feature.attributes.homes +
                             "<br>Travel: " + Math.round(feature.attributes.travel*100)/100 +
                             " %<br>Time: " + Math.round(feature.attributes.time*100)/100 +" min</div>",
                             null, true, onPopupClose);
    feature.popup = popup;
    map.addPopup(popup);
}
function onFeatureUnselect(feature) {
    map.removePopup(feature.popup);
    feature.popup.destroy();
    feature.popup = null;
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

var travel_buffersLayer,
    travel__time_buffersLayer,
    selectControl;
function init_teacher() {
    $.jqplot.config.enablePlugins = true;
    map.setCenter(new OpenLayers.LonLat(405113.46202689, 6680497.7647955), 3);
    travel_buffersLayer = new OpenLayers.Layer.Vector("Travel Buffers Layer", {
                            styleMap: new OpenLayers.StyleMap(travel_style)
                    });
    travel_time_buffersLayer = new OpenLayers.Layer.Vector("Travel Time Buffers Layer", {
                            styleMap: new OpenLayers.StyleMap(travel_time_style),
                            visibility: false
                    });
    map.addLayers([travel_buffersLayer,travel_time_buffersLayer]);
    selectControl = new OpenLayers.Control.SelectFeature([travel_buffersLayer, travel_time_buffersLayer], {
                                                         onSelect: onFeatureSelect,
                                                         onUnselect: onFeatureUnselect,
                                                         toggle: true    
    });
    map.addControl(selectControl);
    selectControl.activate();
    $(".color_select :radio").click(change_layer);
    $('#school').change(function (evt) {submitSchool(evt.target.value, submitSchool_callback);});
    $(".navigationButton").click(function () {
            console.log(this.value);
            change_page(this.value, this.value + "_callback");
        }
        );
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
    pointRadius: 8,
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

styles['competitive'] = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        OpenLayers.Util.applyDefaults(OpenLayers.Util.applyDefaults({}, defStyle),
        {
            graphicName: 'square',
            strokeColor: "#F99F23",
            fillColor:  "#F99F23",
        }));

styles['moving'] = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        OpenLayers.Util.applyDefaults(OpenLayers.Util.applyDefaults({}, defStyle),
        {
            graphicName: 'triangle',
            strokeColor: "#6CCFF5",
            fillColor:  "#6CCFF5",
        }));

styles['recreational'] = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        OpenLayers.Util.applyDefaults(OpenLayers.Util.applyDefaults({}, defStyle),
        {
            graphicName: 'circle',
            strokeColor: "#8B2A90",
            fillColor:  "#8B2A90",
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

var travel_style = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        {
            strokeWidth: 1,
            pointerEvents: "visiblePainted",
            strokeOpacity: 1,
//            fillOpacity: 1
            fillOpacity: 0.7
        },
        // the second argument will include all rules
        {
            rules: [
                new OpenLayers.Rule({
                    name: "0 - 20%",
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO,
                        property: "travel", // the "foo" feature attribute
                        value: 20
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#FFFFB2",
                        strokeColor: "#CCEBC5"
                    }
                }),
                new OpenLayers.Rule({
                    name: "21 - 40%",
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.BETWEEN,
                        property: "travel",
                        lowerBoundary: 20.00000000001,
                        upperBoundary: 40
                    }),
                    symbolizer: {
                        fillColor:  "#FECC5C",
                        strokeColor: "#CCEBC5"
                    }
                }),
                new OpenLayers.Rule({
                    name: "41 - 60%",
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.BETWEEN,
                        property: "travel",
                        lowerBoundary: 40.00000000001,
                        upperBoundary: 60
                    }),
                    symbolizer: {
                        fillColor:  "#FD8D3C",
                        strokeColor: "#CCEBC5"
                    }
                }),
                new OpenLayers.Rule({
                    name: "61 - 80%",
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.BETWEEN,
                        property: "travel",
                        lowerBoundary: 60.00000000001,
                        upperBoundary: 80
                    }),
                    symbolizer: {
                        fillColor:  "#F03B20",
                        strokeColor: "#CCEBC5"
                    }
                }),
                new OpenLayers.Rule({
                    name: "81 - 100%",
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.BETWEEN,
                        property: "travel",
                        lowerBoundary: 80.000000000001,
                        upperBoundary: 100
                    }),
                    symbolizer: {
                        fillColor:  "#BD0026",
                        strokeColor: "#CCEBC5"
                    }
                }),
                new OpenLayers.Rule({
                    name: "Muu",
                    // apply this rule if no others apply
                    elseFilter: true,
                    symbolizer: {
                        fillColor:  "#AAEBAA",
                        strokeColor: "#CCEBC5"
                    }
                })
            ]
        }
    );
var travel_time_style = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        {
            strokeWidth: 1,
            pointerEvents: "visiblePainted",
            strokeOpacity: 1,
            fillOpacity: 0.7
        },
        // the second argument will include all rules
        {
            rules: [
                new OpenLayers.Rule({
                    name: "noin 5 minuuttia",
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LESS_THAN,
                        property: "time", // the "foo" feature attribute
                        value: 6
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#FFFFB2",
                        strokeColor: "#CCEBC5"
                    }
                }),
                new OpenLayers.Rule({
                    name: "noin 10 minuuttia",
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.BETWEEN,
                        property: "time",
                        lowerBoundary: 6,
                        upperBoundary: 15
                    }),
                    symbolizer: {
                        fillColor:  "#FED976",
                        strokeColor: "#CCEBC5"
                    }
                }),
                new OpenLayers.Rule({
                    name: "noin 20 minuuttia",
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.BETWEEN,
                        property: "time",
                        lowerBoundary: 15.00000000001,
                        upperBoundary: 25
                    }),
                    symbolizer: {
                        fillColor:  "#FEB24C",
                        strokeColor: "#CCEBC5"
                    }
                }),
                new OpenLayers.Rule({
                    name: "noin puoli tuntia",
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.BETWEEN,
                        property: "time",
                        lowerBoundary: 25.0000000000001,
                        upperBoundary: 35
                    }),
                    symbolizer: {
                        fillColor:  "#FD8D3C",
                        strokeColor: "#CCEBC5"
                    }
                }),
                new OpenLayers.Rule({
                    name: "noin 45 minuuttia",
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.BETWEEN,
                        property: "time",
                        lowerBoundary: 35.0000000000001,
                        upperBoundary: 50
                    }),
                    symbolizer: {
                        fillColor:  "#F03B20",
                        strokeColor: "#CCEBC5"
                    }
                }),
                new OpenLayers.Rule({
                    name: "noin tunti",
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.GREATER_THAN,
                        property: "time", // the "foo" feature attribute
                        value: 50
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#BD0026",
                        strokeColor: "#CCEBC5"
                    }
                }),
                new OpenLayers.Rule({
                    name: "Muu",
                    // apply this rule if no others apply
                    elseFilter: true,
                    symbolizer: {
                        fillColor:  "#AAEBAA",
                        strokeColor: "#CCEBC5"
                    }
                })
            ]
        }
    );
//var exercise_map = {
//}
