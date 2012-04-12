//Callback functions for api functions
function get_features_callback(response_data) {

    //var response = response_data.response;
 //   var response = response_data;
    //TESTING
 //   pointLayer.events.register("featureadded", undefined, add_popup_to_feature);
    console.log("get_features_callback: " + JSON.stringify(response_data));
    var gjf, features;

    gjf = new OpenLayers.Format.GeoJSON();
    features = gjf.read(response_data);


    pointLayer.addFeatures(features);

//    pointLayer.events.unregister("featureadded", undefined, add_popup_to_feature);


}function get_features(callback) {
    //For test
    callback(feat_data);
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
    
}
function init() {
    // Create Layers for different point types
    pointLayer = new OpenLayers.Layer.Vector("Point Layer", {
                            styleMap: new OpenLayers.StyleMap(pointLayer_style)
                    });
    //pointLayer = new OpenLayers.Layer.Vector("Point Layer");

    // Center map to Tampere
    map.addLayer(pointLayer);
//    map.setCenter(new OpenLayers.LonLat(328867.166201, 6820011.7771568), 2);
    map.setCenter(new OpenLayers.LonLat(405113.46202689, 6680497.7647955), 2);
    get_features(get_features_callback);
    
}

var pointLayer_style = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        {
            strokeWidth: 1,
            pointRadius: 5,
//            graphicName: 'triangle',
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
        }    );
