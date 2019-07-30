var navigatorOptions = {
    enableHighAccuracy: true,       // ���������� �������� ����������
    timeout: 1000,                  // ������������ ����� ��� ���������� �������, Infinity ��� �������������   
    maximumAge: 0                   // ���� �������� ������������ ������ � �����������������
};

var coordsArray = [];  // ������ ��� ���������� ������ � �����������
var tripDistance = 0;      // ���������� ����������

window.onload = getMyLocation; // ����� ������� getMyLocation ��� ��������� �������� ��������

var ourCoords = {                // ���������� ��� ������������ ���������� �� �������
    latitude: 47.624851,
    longitude: -122.52099
};

function getMyLocation() {
    if (navigator.geolocation) {          // ��������, ������������ �� ������� geolocation
        // navigator.geolocation.getCurrentPosition(displayLocation, displayError);  // displayLocation - ����������, �������� ���������� ������ � ������� � ��������������, ���� ������� �������� �������� ������ �������, displayError - ���������� ������
        var watchButton = document.getElementById("startButton");           // ��� ������� ������ ����������� ������� watchLocation � clearWatch
        watchButton.onclick = watchLocation;  // ��������� ������� watchLocation


        var clearWatchButton = document.getElementById("stopButton");
        clearWatchButton.onclick = clearWatch;

    } else {
        alert("Oops, no geolocation support!")
    }
}
function displayLocation(position) { // ������ ���������� ����������, ����� ������� �������� ������ � ����������������� � �������� ������ position
    var latitude = position.coords.latitude; // � ������� position ���� �������� coords, ���������� �������� ������ � �������, �������� �� �����������
    var longitude = position.coords.longitude;
    var speed = position.coords.speed;  // �������� �����������



    /*
    var div = document.getElementById("location"); // ���������� �������� �������� HTML � ������� innerHTML ������� ������������
    div.innerHTML = "You are at Latitude: " + latitude + ", Longitude: " + longitude; // ����� �������� ������������
    div.innerHTML += " with " + position.coords.accuracy + " meters accuracy";  // position.coords.accuracy - ��������, ����������� �������� ��������������
    */

    /*
    var km = computeDistance(position.coords, ourCoords);  // ����� position - ��� ������� ������������, � ourCoords - ����������
    var distance = document.getElementById("distance");
    distance.innerHTML = "You are " + km + " km from the ourCoords";
    */

    var speedOmeter = document.getElementById("speed");
    speedOmeter.innerHTML = "Your speed is " + Math.round(speed * 3.6) + " km/h";  // ����� �������� ��������

    // Calculate distance from last position if available
    var lastPos = coordsArray[coordsArray.length - 1];
    if (lastPos) {
        if (speed > 1) {
            tripDistance += computeDistance(lastPos, position.coords);
        }
    }

    // Add new coordinates to array
    coordsArray.push(position.coords);

    var traveledDistance = document.getElementById("traveledDistance");
    traveledDistance.innerHTML = "Distance of trip is " + tripDistance + " m";

    var myMap = L.map('map', { center: [latitude, longitude], zoom: 16 });
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OpenStreetMap' }).addTo(myMap);

/*
    if (map == null) {  // ���� ����� �� ����  �������
        showMap(position.coords); // ����� ������� showMap ����� �������� ��������� ���������
    }
    else {
        scrollMapToPosition(position);
    }

    */
}

var watchID = null; // ���������� ���������� ������������ ������������

function watchLocation() {   // ���������� ��� ������� �� ������ watch
    watchID = navigator.geolocation.watchPosition(displayLocation, displayError, navigatorOptions); // ������������ �� �� �����������, ��� � ��� ������� getCurrentPosition

}

function clearWatch() {  // ���������� ��� ������� �� ������ clearWatch 
    if (watchID) {
        navigator.geolocation.clearWatch(watchID); //�������� �������� watchID ��� ��� ������� ��� ��������� ������������
        watchID = null;
    }
}

function displayError(error) { // ���������� ������
    var errorTypes = {        // �������� errorTypes �������� �������� �������� ������
        0: "Unknown error",
        1: "Permission denied by user",
        2: "Position is not available",
        3: "Request timed out"
    };
    var errorMessage = errorTypes[error.code];
    if (error.code == 0 || error.code == 2) {
        errorMessage = errorMessage + " " + error.message;
    }
    var div = document.getElementById("location");
    div.innerHTML = errorMessage;
}

function scrollMapToPosition(coords) {
    var latitude = coords.latitude;
    var longitude = coords.longitude;
    var latlong = google.maps.LatLng(latitude, longitude); // ����������� �������� latitude � longitude � ��������� ��� ��� ������ google.maps.LatLng

    map.panTo(latlong);
}

function computeDistance(startCoords, destCoords) { // ������� ��������� �������� ��������� ���� ����� � ���������� �������� ���������� ����� ���� � ����������
    var startLatRads = degreesToRadians(startCoords.latitude);
    var startLongRads = degreesToRadians(startCoords.longitude);
    var destLatRads = degreesToRadians(destCoords.latitude);
    var destLongRads = degreesToRadians(destCoords.longitude);

    var Radius = 6371000; // ������ ����� � ������
    var distance = Math.acos(Math.sin(startLatRads) * Math.sin(destLatRads) + // ������������ ������� �����������
        Math.cos(startLatRads) * Math.cos(destLatRads) *
        Math.cos(startLongRads - destLongRads)) * Radius;
    return distance;
}

function degreesToRadians(degrees) {  // ������� �������� � �������
    var radians = (degrees * Math.PI) / 180;
    return radians;
}

function appendPosition(position) {
    // Calculate distance from last position if available
    var lastPos = coordsArray[coordsArray.length - 1];
    if (lastPos) {
        tripDistance += computeDistance(lastPos, position.coords);
    }

    // Add new coordinates to array
    coordsArray.push(position.coords);
}