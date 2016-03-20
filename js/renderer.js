function Renderer(mapElmt) {

    var map = new google.maps.Map(mapElmt, {
        center: {lat: 0, lng: 0},
        zoom: 3
    });

    var markers = {};

    return {
        add: function (user) {
            var latLng = new google.maps.LatLng(parseFloat(user.location.lat), parseFloat(user.location.lng));
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
            var latLng = new google.maps.LatLng(parseFloat(user.location.lat), parseFloat(user.location.lng));
            markers[user.key].setPosition(latLng);
        },
        zoomToBounds: function() {
            var bounds = new google.maps.LatLngBounds();
            for (var key in markers) {
                bounds.extend(markers[key].getPosition());
            }

            var offset = 0.002;
            var center = bounds.getCenter();
            bounds.extend(new google.maps.LatLng(center.lat() + offset, center.lng() + offset));
            bounds.extend(new google.maps.LatLng(center.lat() - offset, center.lng() - offset));

            map.fitBounds(bounds)
        }
    };

}
