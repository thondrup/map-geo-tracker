var Positions = function() {

    var Location = function() {
        var error = function(error) {
            if (error.code == 1) {
                Log().log("PERMISSION_DENIED: User denied access to their location");
            } else if (error.code === 2) {
                Log().log("POSITION_UNAVAILABLE: Network is down or positioning satellites cannot be reached");
            } else if (error.code === 3) {
                Log().log("TIMEOUT: Calculating the user's location too took long");
            } else {
                Log().log("Unexpected error code")
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
                    Log().log("Your browser does not support the HTML5 Geolocation API, so this demo will not work.")
                }
            }
        };
    };

    var Renderer = function() {
        var mapElmt = document.getElementById("map");

        var map = new google.maps.Map(mapElmt, {
            center: {lat: 0, lng: 0},
            zoom: 3
        });

        var markers = {};

        return {
            add: function (user) {
                var latLng = new google.maps.LatLng(user.location.lat, user.location.lng);
                var marker = new google.maps.Marker({
                    position: latLng,
                    map: map
                });

                markers[user.key] = marker;
            },
            remove: function (key) {
                markers[key].setMap(null);
            },
            update: function (user) {
                markers[user.key].setPosition(user.location.lat, user.location.lng);
            }
        };
    };

    var Log = function() {
        var logElmt = document.getElementById("log");
        var log = [];

        return {
            log: function (entry) {
                log.push(entry);
                var child = document.createElement("div");
                child.appendChild(document.createTextNode(entry));
                logElmt.appendChild(child);
            }
        };
    };

    var Register = function(renderer) {
        var locally = {};

        return {
            init: function () {
                new Location().get(function (location) {
                    var firebase = new Firebase("https://ourmap.firebaseio.com/");

                    firebase.on("child_added", function (snapshot) {
                        renderer.add({key: snapshot.key(), location: snapshot.val()});
                    });

                    firebase.on("child_changed", function (snapshot) {
                        renderer.update({key: snapshot.key(), location: snapshot.val()});
                    });

                    firebase.on("child_removed", function (snapshot) {
                        renderer.remove(snapshot.key());
                        if(locally.key == snapshot.key()) {
                            locally.key = null;
                            Log().log("You lost connection. Refresh to reconnect");
                        }
                    });

                    firebase.push({lat: location.lat, lng: location.lng}).then(function (ref) {
                        locally.key = ref.key();
                        locally.location = location;
                        firebase.child(ref.key()).onDisconnect().remove();

                        // Update the user position every 1 second
                        setInterval(function() {
                            new Location().get(function (location) {
                                if(locally.key != null && !location.equals(locally.location)) {
                                    firebase.child(locally.key).set({lat: location.lat, lng: location.lng});
                                }

                                locally.location = location;
                            });
                        }, 1000);
                    });
                });
            }
        };
    };

    return {
        init : function() {
            var renderer = new Renderer();
            new Register(renderer).init();
        }
    };

};