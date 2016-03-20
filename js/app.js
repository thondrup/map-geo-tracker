function initMap() {
    var mapElmt = document.getElementById("map");
    var renderer = new Renderer(mapElmt);
    new Register(renderer).init();
}
