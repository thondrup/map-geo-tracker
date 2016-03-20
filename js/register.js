function Register(renderer) {

    var locally = {};

    var firebase = new Firebase("https://ourmap.firebaseio.com/");

    var pushInitialLocation = function(location) {
        firebase.push({lat: location.lat, lng: location.lng}).then(function (ref) {
            locally.key = ref.key();
            locally.location = location;
            firebase.child(ref.key()).onDisconnect().remove();
            renderer.zoomToBounds();
        });
    };

    return {
        init: function () {
            new Location().get(function (location) {
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
                        Log().log("You lost your user key. Connecting with a new user key.");
                        pushInitialLocation(location);
                    }
                });

                pushInitialLocation(location);

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
        }
    };

}
