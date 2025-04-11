let map;
let userMarker;
let busMarker;
let directionsService;
let directionsRenderer;

function initMap() {
    // Initialize map
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: { lat: 13.0827, lng: 80.2707 }, // Default center
    });

    // Initialize Directions Service and Renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: false,
        polylineOptions: {
            strokeColor: "#FF6B00",
            strokeWeight: 5,
        }
    });
    directionsRenderer.setMap(map);

    // Try getting user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userPos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            // Add marker for user
            userMarker = new google.maps.Marker({
                position: userPos,
                map: map,
                title: "Your Location",
                icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            });

            // Add circle around user's location
            const userCircle = new google.maps.Circle({
                strokeColor: "#4285F4",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#4285F4",
                fillOpacity: 0.1,
                map: map,
                center: userPos,
                radius: 5000 // 5km radius
            });

            // Fetch live GPS coordinates for Bus 101 from NodeMCU
            fetch("http://192.168.103.61/")
                .then(response => response.json())
                .then(data => {
                    const busPos = {
                        lat: data.lat,
                        lng: data.lng
                    };

                    // Add marker for Bus 101
                    busMarker = new google.maps.Marker({
                        position: busPos,
                        map: map,
                        title: "Bus 101",
                        icon: {
                            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
                                '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' +
                                '<circle cx="20" cy="20" r="18" fill="white" stroke="#FF6B00" stroke-width="3"/>' +
                                '<text x="20" y="25" font-family="Arial" font-size="12" font-weight="bold" fill="#FF6B00" text-anchor="middle">101</text>' +
                                '</svg>'
                            ),
                            scaledSize: new google.maps.Size(40, 40)
                        }
                    });

                    map.setCenter(userPos);
                    calculateAndDisplayRoute(userPos, busPos);
                })
                .catch(error => {
                    console.error("Error fetching bus location from GPS:", error);
                    alert("Failed to load live GPS data. Showing default bus location.");

                    // Fallback dummy bus location
                    const busPos = {
                        lat: 13.0380,
                        lng: 80.1240,
                    };

                    busMarker = new google.maps.Marker({
                        position: busPos,
                        map: map,
                        title: "Bus 101",
                        icon: {
                            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
                                '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' +
                                '<circle cx="20" cy="20" r="18" fill="white" stroke="#FF6B00" stroke-width="3"/>' +
                                '<text x="20" y="25" font-family="Arial" font-size="12" font-weight="bold" fill="#FF6B00" text-anchor="middle">101</text>' +
                                '</svg>'
                            ),
                            scaledSize: new google.maps.Size(40, 40)
                        }
                    });

                    map.setCenter(userPos);
                    calculateAndDisplayRoute(userPos, busPos);
                });

            // Add markers for other buses (static positions)
            const otherBuses = [
                { id: "203", position: { lat: 13.0450, lng: 80.1500 } },
                { id: "305", position: { lat: 13.0758, lng: 80.1186 } },
                { id: "412", position: { lat: 13.1158, lng: 80.1022 } }
            ];

            otherBuses.forEach(bus => {
                new google.maps.Marker({
                    position: bus.position,
                    map: map,
                    title: "Bus " + bus.id,
                    icon: {
                        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
                            `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="18" fill="white" stroke="#FF6B00" stroke-width="3"/>
                                <text x="20" y="25" font-family="Arial" font-size="12" font-weight="bold" fill="#FF6B00" text-anchor="middle">${bus.id}</text>
                            </svg>`
                        ),
                        scaledSize: new google.maps.Size(40, 40)
                    }
                });
            });

        }, () => {
            alert("Geolocation failed.");
        });
    } else {
        alert("Geolocation is not supported.");
    }
}

function toggleRoutePanel(busId) {
    const panel = document.getElementById(`route-panel-${busId}`);
    const busItem = document.getElementById(`bus-${busId}`);

    if (panel.style.display === "block") {
        panel.style.display = "none";
        busItem.classList.remove("selected-bus");
    } else {
        document.querySelectorAll('.route-panel').forEach(p => p.style.display = 'none');
        document.querySelectorAll('.bus-item').forEach(item => item.classList.remove('selected-bus'));

        panel.style.display = "block";
        busItem.classList.add("selected-bus");
    }
}

function calculateAndDisplayRoute(start, end) {
    directionsService.route({
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING,
    }, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);
            const leg = response.routes[0].legs[0];
            document.getElementById("etaValue").textContent = leg.duration.text;
        } else {
            alert("Directions request failed due to " + status);
        }
    });
}

function centerUserLocation() {
    if (userMarker) {
        map.setCenter(userMarker.getPosition());
    }
}

