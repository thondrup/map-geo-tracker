var Positions = function() {

    var Location = function() {
        return {
            get: function (success, error) {
                if (typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined") {
                    navigator.geolocation.getCurrentPosition(success, error);
                } else {
                    console.error("Your browser does not support the HTML5 Geolocation API, so this demo will not work.")
                }
            }
        };
    };

    var Renderer = function(element) {
        return {
            add: function (key, value) {
                var child = document.createElement("div");
                child.id = key;
                child.appendChild(document.createTextNode(value.lat + ", " + value.lng));
                element.appendChild(child);
            },
            remove: function (key) {
                element.removeChild(document.getElementById(key));
            },
            update: function (key, value) {
                document.getElementById(key).innerHTML = value.lat + ", " + value.lng;
            }
        };
    };

    var Register = function() {
        return {
            init: function (renderer) {
                new Location().get(function (location) {
                    var firebase = new Firebase("https://ourmap.firebaseio.com/");
                    var post = {lat: location.coords.latitude, lng: location.coords.longitude};

                    // Show the position of an added position
                    firebase.on("child_added", function (snapshot) {
                        renderer.add(snapshot.key(), snapshot.val())
                    });

                    // Remove the position from display when the position is removed
                    firebase.on("child_removed", function (snapshot) {
                        renderer.remove(snapshot.key(), snapshot.val())
                    });

                    // Update the position in display when the position is updated
                    firebase.on("child_changed", function (snapshot) {
                        renderer.update(snapshot.key(), snapshot.val())
                    });

                    // Add the user position to Firebase
                    firebase.push(post).then(function (ref) {
                        // Remove the user position from Firebase when the user disconnects
                        firebase.child(ref.key()).onDisconnect().remove();
                    });

                }, function (error) {
                    if (error.code == 1) {
                        console.error("PERMISSION_DENIED: User denied access to their location");
                    } else if (error.code === 2) {
                        console.error("POSITION_UNAVAILABLE: Network is down or positioning satellites cannot be reached");
                    } else if (error.code === 3) {
                        console.error("TIMEOUT: Calculating the user's location too took long");
                    } else {
                        console.error("Unexpected error code")
                    }
                });
            }
        };
    };

    return {
        init : function(elementId) {
            var element = document.getElementById(elementId);
            var renderer = new Renderer(element);
            new Register().init(renderer);
        }
    };

};