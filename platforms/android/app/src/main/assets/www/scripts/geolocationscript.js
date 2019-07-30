// JavaScript
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
        var watchButton = document.getElementById("watch");           // ��� ������� ������ ����������� ������� watchLocation � clearWatch
        watchButton.onclick = watchLocation;  // ��������� ������� watchLocation


        var clearWatchButton = document.getElementById("clearWatch");
        clearWatchButton.onclick = clearWatch;

    } else {
        alert("Oops, no geolocation support!")
    }
}
function displayLocation(position) { // ������ ���������� ����������, ����� ������� �������� ������ � ����������������� � �������� ������ position
    var latitude = position.coords.latitude; // � ������� position ���� �������� coords, ���������� �������� ������ � �������, �������� �� �����������
    var longitude = position.coords.longitude;
    var speed = position.coords.speed;  // �������� �����������

    var div = document.getElementById("location"); // ���������� �������� �������� HTML � ������� innerHTML ������� ������������
    div.innerHTML = "You are at Latitude: " + latitude + ", Longitude: " + longitude; // ����� �������� ������������
    div.innerHTML += " with " + position.coords.accuracy + " meters accuracy";  // position.coords.accuracy - ��������, ����������� �������� ��������������


    var km = computeDistance(position.coords, ourCoords);  // ����� position - ��� ������� ������������, � ourCoords - ����������
    var distance = document.getElementById("distance");
    distance.innerHTML = "You are " + km + " km from the ourCoords";

    var speedOmeter = document.getElementById("speed");
    speedOmeter.innerHTML = "Your speed is " + Math.round(speed*3.6) + " km/h";  // ����� �������� ��������

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

    if (map == null) {  // ���� ����� �� ����  �������
        showMap(position.coords); // ����� ������� showMap ����� �������� ��������� ���������
    }
    else {
        scrollMapToPosition(position);
    }
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
var map; // ���������� ����������, ���������� ���� �����

function showMap(coords) {
    var googleLatAndLong = new google.maps.LatLng(coords.latitude, coords.longitude); // ������ � ������� �� ������� coords ����������� ��� �������� ������� google.maps.LatLng

    var mapOptions = {         // ������� ���������� �����
        zoom: 15, // ����� ��������� �������� �� 0 �� 21
        center: googleLatAndLong, // � ������ ���� ������������
        mapTypeId: google.maps.MapTypeId.ROADMAP // ����� ���� ��� SATELLITE ��� HYBRID
    };

    var mapDiv = document.getElementById("map"); // ����������� HTML �������
    map = new google.maps.Map(mapDiv, mapOptions); // ������� HTML � ��������� ����� ���������� ������������

    var title = "Your location";  // ����� ������� ���������� ������� �� �����, content - ��������� ����������� ������ ���� �������
    var content = "You are at " + coords.latitude + ", " + coords.longitude + ".";
    addMarker(map, googleLatAndLong, title, content);

}

function addMarker(map, latlong, title, content) {  // �������� ������ �������� ������������

    var markerOptions = {
        position: latlong,
        map: map,
        title: title,
        clickable: true  // ����������� ������� ������
    };
    var marker = new google.maps.Marker(markerOptions); // �������� ������ ������� � ������� api google maps

    var infoWindowOptions = {  // �������� ��������������� ���� ��� �������
        content: content,  // ���������� ����
        position: latlong  // �������
    };
    var infoWindow = new google.maps.InfoWindow(infoWindowOptions);  // �������� ���������, ����������� ������� ��� ����� �� ������
    google.maps.event.addListener(marker, "click", function () {
        infoWindow.open(map);
    });
}// JavaScript source code


/* ������ https://codepad.co/snippet/javascript-stopwatch-using-javascript-and-css
*/
var stopwatchTimer = document.getElementById('stopwatchTimer');
var start = document.getElementById('timer');
// var stop = document.getElementById('clearWatch');
// var   clear = document.getElementById('clear');
var seconds = 0, minutes = 0, hours = 0,
    t;

function add() {
    seconds++;
    if (seconds >= 60) {
        seconds = 0;
        minutes++;
        if (minutes >= 60) {
            minutes = 0;
            hours++;
        }
    }

    stopwatchTimer.textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds);

    timer();
}
function timer() {
    t = setTimeout(add, 1000);
}
// timer();


// Start button 
start.onclick = timer;
/*
//Stop button
stop.onclick = function () {
    clearTimeout(t);
}

//Clear button 
clear.onclick = function () {
    h1.textContent = "00:00:00";
    seconds = 0; minutes = 0; hours = 0;
}
*/
