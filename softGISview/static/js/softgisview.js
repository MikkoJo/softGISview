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
    map.setCenter(new OpenLayers.LonLat(410113.46202689, 6680497.7647955), 2);
    get_features(get_features_callback);
    
}

var pointLayer_style = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        {
            strokeWidth: 2,
            //graphicName: 'triangle',
            pointerEvents: "visiblePainted",
            strokeColor: "red",
            strokeOpacity: 0.9,
            fillColor:  "#aaaaaa",
            fillOpacity: 1
        },
{
            rules: [
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "valuename", // the "foo" feature attribute
                        value: "atmosphereGood"
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        fillColor:  "#111111",
                        strokeColor: "#a405ae"
                    }
                }),
                new OpenLayers.Rule({
                    elseFilter: true
                })
           ]
        }    );
