var Location = function() {

    var error = function(error) {
        if (error.code == 1) {
            console.log("PERMISSION_DENIED: User denied access to their location");
        } else if (error.code === 2) {
            console.log("POSITION_UNAVAILABLE: Network is down or positioning satellites cannot be reached");
        } else if (error.code === 3) {
            console.log("TIMEOUT: Calculating the user's location too took long");
        } else {
            console.log("Unexpected error code")
        }
    };

    return {
        get: function (callback) {
            var success = function(location) {
                var lat = location.coords.latitude.toString();
                var lng = location.coords.longitude.toString();

                var extended = {
                    lat: lat,
                    lng : lng,
                    equals : function(location) {
                        return lat === location.lat && lng === location.lng;
                    }
                };

                callback(extended);
            };

            if (typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined") {
                navigator.geolocation.getCurrentPosition(success, error);
            } else {
                console.log("Your browser does not support the HTML5 Geolocation API, so this demo will not work.")
            }
        }
    };
    
};
