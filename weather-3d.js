// ===== WEATHER API CONFIGURATION =====
const API_KEY = 'bd5e378503939ddaee76f12ad7a97608'; // OpenWeatherMap API key
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// ===== DOM ELEMENTS =====
const elements = {
    locationBtn: document.getElementById('locationBtn'),
    searchBtn: document.getElementById('searchBtn'),
    cityInput: document.getElementById('cityInput'),
    loading: document.getElementById('loading'),
    weatherCard: document.getElementById('weatherCard'),
    cityName: document.getElementById('cityName'),
    country: document.getElementById('country'),
    temperature: document.getElementById('temperature'),
    weatherIcon: document.getElementById('weatherIcon'),
    weatherMain: document.getElementById('weatherMain'),
    weatherDesc: document.getElementById('weatherDesc'),
    feelsLike: document.getElementById('feelsLike'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    pressure: document.getElementById('pressure'),
    visibility: document.getElementById('visibility'),
    cloudiness: document.getElementById('cloudiness'),
    sunrise: document.getElementById('sunrise'),
    sunset: document.getElementById('sunset'),
    timestamp: document.getElementById('timestamp'),
    particles: document.getElementById('particles'),
    mapToggleBtn: document.getElementById('mapToggleBtn'),
    mapContainer: document.getElementById('mapContainer'),
    mapCloseBtn: document.getElementById('mapCloseBtn'),
    mapSearchInput: document.getElementById('mapSearchInput'),
    mapSearchBtn: document.getElementById('mapSearchBtn')
};

// ===== GOOGLE MAPS VARIABLES =====
let map;
let marker;
let currentLocation = { lat: 19.0760, lng: 72.8777 }; // Default: Mumbai
let geocoder;
let autocomplete;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    createParticles();
    updateTimestamp();
    setInterval(updateTimestamp, 1000);
    
    // Hide weather card initially
    elements.weatherCard.classList.add('hidden');
    elements.loading.classList.add('hidden');
    
    // Initialize Google Maps
    initializeGoogleMaps();
    
    // Event listeners
    elements.locationBtn.addEventListener('click', getCurrentLocationWeather);
    elements.searchBtn.addEventListener('click', searchWeather);
    elements.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });
    
    // Map event listeners
    elements.mapToggleBtn.addEventListener('click', toggleMap);
    elements.mapCloseBtn.addEventListener('click', closeMap);
    elements.mapSearchBtn.addEventListener('click', searchLocationOnMap);
    elements.mapSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchLocationOnMap();
        }
    });
    
    // Load default city (Mumbai)
    getWeatherByCity('Mumbai');
}

// ===== PARTICLE ANIMATION =====
function createParticles() {
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random properties
        const size = Math.random() * 8 + 3;
        const startX = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 10;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${startX}%`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        
        elements.particles.appendChild(particle);
    }
}

// ===== TIMESTAMP UPDATE =====
function updateTimestamp() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    elements.timestamp.textContent = now.toLocaleDateString('en-US', options);
}

// ===== GET CURRENT LOCATION WEATHER =====
function getCurrentLocationWeather() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            getWeatherByCoordinates(latitude, longitude);
        },
        (error) => {
            hideLoading();
            showError('Unable to retrieve your location');
            console.error('Geolocation error:', error);
        }
    );
}

// ===== SEARCH WEATHER =====
function searchWeather() {
    const city = elements.cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    getWeatherByCity(city);
}

// ===== API CALLS =====
async function getWeatherByCity(city) {
    showLoading();
    
    try {
        const url = `${API_BASE_URL}?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

async function getWeatherByCoordinates(lat, lon) {
    try {
        const url = `${API_BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Unable to fetch weather data');
        }
        
        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// ===== DISPLAY WEATHER DATA =====
function displayWeather(data) {
    hideLoading();
    
    // Store current location
    currentLocation = {
        lat: data.coord.lat,
        lng: data.coord.lon
    };
    
    // Update map marker if map is initialized
    if (map && marker) {
        updateMapLocation(currentLocation, data.name);
    }
    
    // Location
    elements.cityName.textContent = data.name;
    elements.country.textContent = data.sys.country;
    
    // Temperature
    const temp = Math.round(data.main.temp);
    const tempNumber = elements.temperature.querySelector('.temp-number');
    tempNumber.textContent = temp;
    
    // Animate temperature change
    animateValue(tempNumber, 0, temp, 1000);
    
    // Weather icon and description
    const iconCode = data.weather[0].icon;
    const weatherCondition = data.weather[0].main.toLowerCase();
    updateWeatherIcon(weatherCondition, iconCode);
    
    elements.weatherMain.textContent = data.weather[0].main;
    elements.weatherDesc.textContent = data.weather[0].description;
    
    // Details
    elements.feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
    elements.humidity.textContent = `${data.main.humidity}%`;
    elements.windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    elements.pressure.textContent = `${data.main.pressure} hPa`;
    elements.visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    elements.cloudiness.textContent = `${data.clouds.all}%`;
    
    // Sun times
    elements.sunrise.textContent = formatTime(data.sys.sunrise);
    elements.sunset.textContent = formatTime(data.sys.sunset);
    
    // Update background based on weather
    updateBackground(weatherCondition, iconCode);
    
    // Show weather card
    elements.weatherCard.classList.remove('hidden');
    
    // Clear search input
    elements.cityInput.value = '';
}

// ===== UPDATE WEATHER ICON =====
function updateWeatherIcon(condition, iconCode) {
    const iconMap = {
        clear: 'fa-sun',
        clouds: 'fa-cloud',
        rain: 'fa-cloud-rain',
        drizzle: 'fa-cloud-rain',
        thunderstorm: 'fa-cloud-bolt',
        snow: 'fa-snowflake',
        mist: 'fa-smog',
        smoke: 'fa-smog',
        haze: 'fa-smog',
        fog: 'fa-smog',
        dust: 'fa-wind',
        sand: 'fa-wind',
        ash: 'fa-wind',
        squall: 'fa-wind',
        tornado: 'fa-tornado'
    };
    
    let iconClass = iconMap[condition] || 'fa-cloud-sun';
    
    // Check for night time
    if (iconCode.includes('n')) {
        if (condition === 'clear') {
            iconClass = 'fa-moon';
        } else if (condition === 'clouds') {
            iconClass = 'fa-cloud-moon';
        }
    }
    
    elements.weatherIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
}

// ===== UPDATE BACKGROUND =====
function updateBackground(condition, iconCode) {
    const background = document.querySelector('.animated-background');
    const isNight = iconCode.includes('n');
    
    let gradient;
    
    if (isNight) {
        gradient = 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)';
    } else {
        switch (condition) {
            case 'clear':
                gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)';
                break;
            case 'clouds':
                gradient = 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)';
                break;
            case 'rain':
            case 'drizzle':
                gradient = 'linear-gradient(135deg, #373b44 0%, #4286f4 100%)';
                break;
            case 'thunderstorm':
                gradient = 'linear-gradient(135deg, #141e30 0%, #243b55 100%)';
                break;
            case 'snow':
                gradient = 'linear-gradient(135deg, #e6dada 0%, #274046 100%)';
                break;
            case 'mist':
            case 'fog':
            case 'haze':
                gradient = 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)';
                break;
            default:
                gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)';
        }
    }
    
    background.style.background = gradient;
    background.style.backgroundSize = '400% 400%';
}

// ===== UTILITY FUNCTIONS =====
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    
    return `${formattedHours}:${minutes} ${ampm}`;
}

function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            clearInterval(timer);
            element.textContent = Math.round(end);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

function showLoading() {
    elements.loading.classList.remove('hidden');
    elements.weatherCard.classList.add('hidden');
}

function hideLoading() {
    elements.loading.classList.add('hidden');
}

function showError(message) {
    alert(`❌ ${message}`);
}

// ===== WEATHER ICON COLOR ANIMATIONS =====
setInterval(() => {
    const icon = elements.weatherIcon.querySelector('i');
    if (icon) {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        ];
        
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        icon.style.background = randomColor;
        icon.style.webkitBackgroundClip = 'text';
        icon.style.webkitTextFillColor = 'transparent';
    }
}, 3000);

// ===== CONSOLE WELCOME MESSAGE =====
console.log('%c🌤️ 3D Weather App', 'font-size: 24px; font-weight: bold; color: #667eea;');
console.log('%cPowered by OpenWeatherMap API', 'font-size: 14px; color: #764ba2;');
console.log('%cCreated with ❤️', 'font-size: 12px; color: #f5576c;');

// ===== GOOGLE MAPS INITIALIZATION =====
function initializeGoogleMaps() {
    // Initialize geocoder
    geocoder = new google.maps.Geocoder();
    
    // Create map centered on Mumbai
    map = new google.maps.Map(document.getElementById('map'), {
        center: currentLocation,
        zoom: 12,
        styles: [
            {
                "featureType": "all",
                "elementType": "geometry",
                "stylers": [{"color": "#242f3e"}]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.stroke",
                "stylers": [{"color": "#242f3e"}]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#746855"}]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{"color": "#17263c"}]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{"color": "#38414e"}]
            }
        ],
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
    });
    
    // Create marker
    marker = new google.maps.Marker({
        position: currentLocation,
        map: map,
        title: 'Weather Location',
        animation: google.maps.Animation.DROP,
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
    });
    
    // Add click listener to map
    map.addListener('click', (event) => {
        const clickedLocation = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
        };
        
        // Update marker position
        marker.setPosition(clickedLocation);
        
        // Get weather for clicked location
        getWeatherByCoordinates(clickedLocation.lat, clickedLocation.lng);
        
        // Reverse geocode to get location name
        reverseGeocode(clickedLocation);
    });
    
    // Initialize autocomplete for map search
    autocomplete = new google.maps.places.Autocomplete(elements.mapSearchInput);
    autocomplete.bindTo('bounds', map);
    
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
            showError('No details available for input: ' + place.name);
            return;
        }
        
        const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };
        
        // Update map and marker
        map.setCenter(location);
        map.setZoom(12);
        marker.setPosition(location);
        
        // Get weather for selected location
        getWeatherByCoordinates(location.lat, location.lng);
    });
}

// ===== UPDATE MAP LOCATION =====
function updateMapLocation(location, name) {
    currentLocation = location;
    
    if (map && marker) {
        map.setCenter(location);
        marker.setPosition(location);
        marker.setTitle(name);
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="map-info-window">
                    <h4><i class="fas fa-map-marker-alt"></i> ${name}</h4>
                    <p><strong>Coordinates:</strong></p>
                    <p>Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}</p>
                    <button onclick="closeMap()">Close Map</button>
                </div>
            `
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
    }
}

// ===== REVERSE GEOCODE =====
function reverseGeocode(location) {
    geocoder.geocode({ location: location }, (results, status) => {
        if (status === 'OK') {
            if (results[0]) {
                const address = results[0].formatted_address;
                elements.mapSearchInput.value = address;
            }
        }
    });
}

// ===== SEARCH LOCATION ON MAP =====
function searchLocationOnMap() {
    const searchText = elements.mapSearchInput.value.trim();
    
    if (!searchText) {
        showError('Please enter a location to search');
        return;
    }
    
    geocoder.geocode({ address: searchText }, (results, status) => {
        if (status === 'OK') {
            const location = {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng()
            };
            
            // Update map and marker
            map.setCenter(location);
            map.setZoom(12);
            marker.setPosition(location);
            
            // Get weather for searched location
            getWeatherByCoordinates(location.lat, location.lng);
        } else {
            showError('Location not found: ' + status);
        }
    });
}

// ===== TOGGLE MAP =====
function toggleMap() {
    elements.mapContainer.classList.add('active');
    
    // Update map to current weather location
    if (map && marker) {
        setTimeout(() => {
            google.maps.event.trigger(map, 'resize');
            map.setCenter(currentLocation);
            marker.setPosition(currentLocation);
        }, 100);
    }
}

// ===== CLOSE MAP =====
function closeMap() {
    elements.mapContainer.classList.remove('active');
}

// Make closeMap globally accessible for info window button
window.closeMap = closeMap;
