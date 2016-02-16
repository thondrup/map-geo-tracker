var Positions = function() {

    var Location = function() {
        var error = function(error) {
            if (error.code == 1) {
                console.error("PERMISSION_DENIED: User denied access to their location");
            } else if (error.code === 2) {
                console.error("POSITION_UNAVAILABLE: Network is down or positioning satellites cannot be reached");
            } else if (error.code === 3) {
                console.error("TIMEOUT: Calculating the user's location too took long");
            } else {
                console.error("Unexpected error code")
            }
        };

        return {
            get: function (success) {
                if (typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined") {
                    navigator.geolocation.getCurrentPosition(success, error);
                } else {
                    console.error("Your browser does not support the HTML5 Geolocation API, so this demo will not work.")
                }
            }
        };
    };

    var Renderer = function() {
        var positions = document.getElementById("positions");
        var status = document.getElementById("status");

        return {
            add: function (key, value) {
                var child = document.createElement("div");
                child.id = key;
                child.appendChild(document.createTextNode(value.lat + ", " + value.lng));
                positions.appendChild(child);
            },
            remove: function (key) {
                positions.removeChild(document.getElementById(key));
            },
            update: function (key, value) {
                document.getElementById(key).innerHTML = value.lat + ", " + value.lng;
            },
            status : function(message) {
                status.innerHTML = message;
            }
        };
    };

    var Register = function(renderer) {
        var ref = null;

        return {
            init: function () {
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
                        if(this.ref == snapshot.key()) {
                            this.ref = null;
                            alert("You lost connection. Refresh to reconnect");
                        }
                    });

                    // Update the position in display when the position is updated
                    firebase.on("child_changed", function (snapshot) {
                        renderer.update(snapshot.key(), snapshot.val())
                    });

                    // Add the user position to Firebase
                    firebase.push(post).then(function (ref) {
                        // Remove the user position from Firebase when the user disconnects
                        this.ref = ref.key();
                        firebase.child(ref.key()).onDisconnect().remove();
                    });

                    // Update the user position every 1 second
                    setInterval(function() {
                        if(this.ref !== null) {
                            new Location().get(function (location) {
                                renderer.status("Your position: " + location.coords.latitude + ", " + location.coords.longitude +
                                    ", updated " + new Date());
                                // Add the user position to Firebase
                                firebase.child(this.ref).set({
                                    lat: location.coords.latitude,
                                    lng: location.coords.longitude
                                });
                            });
                        }
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