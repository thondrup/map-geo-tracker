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
                    callback({ lat: location.coords.latitude.toString(), lng : location.coords.longitude.toString() });
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
        var positionsElmt = document.getElementById("positions");
        var statusElmt = document.getElementById("status");

        return {
            add: function (user) {
                var child = document.createElement("div");
                child.id = user.key;
                child.appendChild(document.createTextNode(user.location.lat + ", " + user.location.lng));
                positionsElmt.appendChild(child);
            },
            remove: function (key) {
                positionsElmt.removeChild(document.getElementById(key));
            },
            update: function (user) {
                document.getElementById(user.key).innerHTML = user.location.lat + ", " + user.location.lng;
            },
            status : function(message) {
                statusElmt.innerHTML = message;
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
        var locally = {key: null, location: { lat: null, lng: null }};

        return {
            init: function () {
                new Location().get(function (location) {
                    var firebase = new Firebase("https://ourmap.firebaseio.com/");

                    firebase.on("child_added", function (snapshot) {
                        var user = {key: snapshot.key(), location: snapshot.val()};
                        renderer.add(user);
                    });

                    firebase.on("child_removed", function (snapshot) {
                        renderer.remove(snapshot.key());
                        if(locally.key == snapshot.key()) {
                            locally.key = null;
                            Log().log("You lost connection. Refresh to reconnect");
                        }
                    });

                    firebase.on("child_changed", function (snapshot) {
                        var user = {key: snapshot.key(), location: snapshot.val()};
                        renderer.update(user);
                    });

                    firebase.push(location).then(function (ref) {
                        locally.key = ref.key();
                        locally.loation = location;
                        firebase.child(ref.key()).onDisconnect().remove();
                    });

                    // Update the user position every 1 second
                    setInterval(function() {
                        new Location().get(function (location) {
                            var onComplete = function(error) {
                                if(error) {
                                    Log().log("Synchronization failed");
                                }
                            };

                            if(locally.key != null && (location.lat != locally.lat || location.lng != locally.lng)) {
                                firebase.child(locally.key).set(location, onComplete);
                            }

                            locally.location = location;
                        });
                    }, 1000);
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