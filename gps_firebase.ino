#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <SoftwareSerial.h>
#include <TinyGPS++.h>

// WiFi credentials
const char* ssid = "Syednizam_5g";//"Katrina";
const char* password = "NahidhaNizam";//"Madara Uchiha";

// Firebase settings
#define FIREBASE_HOST "bus-tracking-83022-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "nkuirv0qXZCfRBNwkzp43OKZEPGceJZITqJVlEVs"

// Firebase instances
FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;

// GPS and serial
SoftwareSerial ss(4, 5); // RX, TX for GPS
TinyGPSPlus gps;

WiFiServer server(80);

void setup() {
  Serial.begin(115200);
  ss.begin(9600);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");

  // Display local IP address on Serial Monitor
  Serial.print("ESP8266 Web Server is running at: http://");
  Serial.println(WiFi.localIP());

  // Start server
  server.begin();
  Serial.println("Web server started");

  // Firebase configuration
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  WiFiClient client = server.available();

  // Read GPS data
  while (ss.available() > 0) {
    gps.encode(ss.read());
  }

  // If new location is available
  if (gps.location.isUpdated()) {
    float latitude = gps.location.lat();
    float longitude = gps.location.lng();
    String date = gps.date.isValid() ? String(gps.date.day()) + "/" + String(gps.date.month()) + "/" + String(gps.date.year()) : "NA";
    String time = gps.time.isValid() ? String(gps.time.hour()) + ":" + String(gps.time.minute()) + ":" + String(gps.time.second()) : "NA";

    // Print to Serial
    Serial.print("Lat: "); Serial.println(latitude, 6);
    Serial.print("Lng: "); Serial.println(longitude, 6);

    // Upload to Firebase
    Firebase.setFloat(firebaseData, "/bus/latitude", latitude);
    Firebase.setFloat(firebaseData, "/bus/longitude", longitude);
    Firebase.setString(firebaseData, "/bus/date", date);
    Firebase.setString(firebaseData, "/bus/time", time);
  }

  // Serve Web Page
  if (client) {
    String req = client.readStringUntil('\r');
    client.flush();

    // Serve HTML Page
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/html");
    client.println("Connection: close");
    client.println();
    client.println("<!DOCTYPE html><html><head><title>BUS TRACKING SYSTEM</title></head>");
    client.println("<body style='text-align:center;'><h1>BUS TRACKING SYSTEM</h1><h2>Location Details</h2>");
    client.println("<table border='1' align='center'>");
    client.println("<tr><td>Latitude</td><td>" + String(gps.location.lat(), 6) + "</td></tr>");
    client.println("<tr><td>Longitude</td><td>" + String(gps.location.lng(), 6) + "</td></tr>");
    client.println("<tr><td>Date</td><td>" + (gps.date.isValid() ? String(gps.date.day()) + "/" + String(gps.date.month()) + "/" + String(gps.date.year()) : "NA") + "</td></tr>");
    client.println("<tr><td>Time</td><td>" + (gps.time.isValid() ? String(gps.time.hour()) + ":" + String(gps.time.minute()) + ":" + String(gps.time.second()) : "NA") + "</td></tr>");
    client.println("<p><a href='https://shahnaz-fathima-1611.github.io/bus-tracker/' target='_blank' style='background:yellow; padding:4px; text-decoration:none;'>Click here!</a> to check the live tracking page.</p>");
    client.println("</table></body></html>");
    delay(100);
  }
}
