let map;
let userMarker;
let busMarker;
let directionsService;
let directionsRenderer;

// Your Firebase Realtime Database URL (without https:// and trailing slash)
const firebaseUrl = "https://bus-tracking-83022-default-rtdb.firebaseio.com";


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

            // Add circle around user's location (e.g., 500 meter radius)
            const userCircle = new google.maps.Circle({
                strokeColor: "#4285F4",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#4285F4",
                fillOpacity: 0.1,
                map: map,
                center: userPos,
                radius: 5000 // radius in meters
             });

/*
// Dummy coordinates (for example: Chennai)
const userPos = {
    lat: 12.985710,   // replace with any dummy latitude you like
    lng: 80.219248    // replace with any dummy longitude you like
};
*/
           //  map.setCenter(userPos);

             // Start fetching the bus location live from Firebase every 5 seconds
            //setInterval(fetchBusLocation, 5000, userPos);

            // Dummy bus location (replace with live GPS data from your backend)
            const busPos = {
                lat: 12.985710,//13.0380, example coordinates
                lng: 80.219248,//80.1240,
            };
        

            // Add marker for bus
            busMarker = new google.maps.Marker({
                position: busPos,
                map: map,
                title: "Bus 101",
                icon:{
                    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' +
                        '<circle cx="20" cy="20" r="18" fill="white" stroke="#FF6B00" stroke-width="3"/>' +
                        '<text x="20" y="25" font-family="Arial" font-size="12" font-weight="bold" fill="#FF6B00" text-anchor="middle">101</text>' +
                        '</svg>'
                    ),
                    scaledSize: new google.maps.Size(40, 40)
                } 
                
            });
            
            // Add marker for other buses
            const otherBuses = [
                {
                    id: "203",
                    position: { lat: 13.0450, lng: 80.1500 }
                },
                {
                    id: "305",
                    position: { lat: 13.0758, lng: 80.1186}
                },
                {
                    id: "412",
                    position: { lat: 13.1158, lng: 80.1022 }
                }
            ];            
            otherBuses.forEach(bus => {
                const marker = new google.maps.Marker({
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
    
            // Center map around user
           map.setCenter(userPos);

            // Show route between user and bus
            calculateAndDisplayRoute(userPos, busPos);
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

  // Toggle display
  if (panel.style.display === "block") {
    panel.style.display = "none";
    busItem.classList.remove("selected-bus");
  } else {
    // Hide all other panels
    document.querySelectorAll('.route-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.bus-item').forEach(item => item.classList.remove('selected-bus'));

    panel.style.display = "block";
    busItem.classList.add("selected-bus");
  }
}
  
function fetchBusLocation(userPos) {
    fetch(`${firebaseUrl}/bus.json`)
        .then(response => response.json())
        .then(data => {
            if (data && data.latitude && data.longitude) {
                const busPos = {
                    lat: parseFloat(data.latitude),
                    lng: parseFloat(data.longitude)
                };

                busMarker.setPosition(busPos);
                calculateAndDisplayRoute(userPos, busPos);
            } else {
                console.error("Invalid bus data from Firebase");
            }
        })
        .catch(error => {
            console.error("Error fetching data from Firebase:", error);
        });
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
            
            // Set ETA in the popup box
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
function showBusDetails(busName, seats, eta) {
    document.getElementById("busTitle").innerText = busName;
    document.getElementById("seatsValue").innerText = seats;
    document.getElementById("etaValue").innerText = eta;

    // Show the bus details popup
    document.getElementById("busDetails").style.display = "block";
}
function hideBusDetails() {
    document.getElementById("busDetails").style.display = "none";
  }
  

