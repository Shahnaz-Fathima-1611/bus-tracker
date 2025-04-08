let map;
let userMarker;
let busMarker;
let directionsService;
let directionsRenderer;
let firstUpdate = true;

function initMap() {
    // Placeholder location (0,0), map will center after GPS fetch
    const placeholder = { lat: 0, lng: 0 };

    map = new google.maps.Map(document.getElementById("map"), {
        center: placeholder,
        zoom: 15,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: "#FF6B00",
            strokeWeight: 5
        }
    });
    directionsRenderer.setMap(map);

    userMarker = new google.maps.Marker({
        position: placeholder,
        map: map,
        title: "Your Location",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 8
        }
    });

    busMarker = new google.maps.Marker({
        position: placeholder,
        map: map,
        title: "Bus 101",
        icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="white" stroke="#FF6B00" stroke-width="3"/>
                    <text x="20" y="25" font-family="Arial" font-size="12" font-weight="bold" fill="#FF6B00" text-anchor="middle">101</text>
                </svg>`
            ),
            scaledSize: new google.maps.Size(40, 40)
        }
    });

    busMarker.addListener("click", function () {
        showBusDetails("Bus 101", 15, "5 min");
    });

    // Start updating bus location from NodeMCU
    updateBusLocation();
    setInterval(updateBusLocation, 5000);

    getUserLocation();
}

// Fetch real-time GPS from NodeMCU
function updateBusLocation() {
    fetch("http://192.168.103.61/")  // Replace with your actual NodeMCU IP
        .then(response => response.json())
        .then(data => {
            const busLat = parseFloat(data.latitude);
            const busLng = parseFloat(data.longitude);
            const position = { lat: busLat, lng: busLng };

            busMarker.setPosition(position);

            if (firstUpdate) {
                map.setCenter(position);
                firstUpdate = false;
            }

            calculateRoute(position, userMarker.getPosition());
        })
        .catch(error => {
            console.error("Error fetching GPS data:", error);
        });
}

function calculateRoute(start, end) {
    directionsService.route(
        {
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(response);
            } else {
                console.error("Route calculation failed:", status);
            }
        }
    );
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userPos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                userMarker.setPosition(userPos);
            },
            () => {
                alert("Could not get your location.");
            }
        );
    }
}

function showBusDetails(busName, seats, eta) {
    document.getElementById('busDetails').style.display = 'block';
    document.getElementById('busTitle').textContent = busName;
    document.getElementById('seatsValue').textContent = seats;
    document.getElementById('etaValue').textContent = eta;
}

function hideBusDetails() {
    document.getElementById('busDetails').style.display = 'none';
}
