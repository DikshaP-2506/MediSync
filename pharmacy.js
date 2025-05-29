document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('address-form');
    const addressInput = document.getElementById('address');
    const pharmacyList = document.getElementById('pharmacy-list');

    // Function to fetch nearby pharmacies based on lat and lng
    const fetchPharmacies = (lat, lon) => {
        fetch(`/api/pharmacies?lat=${lat}&lgn=${lon}`)
            .then(response => response.json())
            .then(data => {
                pharmacyList.innerHTML = ''; 
                if (data.length === 0) {
                    pharmacyList.innerHTML = '<li>No pharmacies found in your area.</li>';
                } else {
                    data.forEach(pharmacy => {
                        const li = document.createElement('li');
                        li.textContent = pharmacy.name;
                        pharmacyList.appendChild(li);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching pharmacies:', error);
                pharmacyList.innerHTML = '<li>Error fetching pharmacies</li>';
            });
    };

    // Function to geocode address to latitude and longitude using Nominatim (OpenStreetMap)
    const geocodeAddress = (address) => {
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`;

        fetch(geocodeUrl)
            .then(response => response.json())
            .then(data => {
                if (data && data[0]) {
                    const lat = data[0].lat;
                    const lon = data[0].lon;
                    console.log(`Latitude: ${lat}, Longitude: ${lon}`);
                    fetchPharmacies(lat, lon);  // Now fetch pharmacies with the geocoded coordinates
                } else {
                    alert('Address not found. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error geocoding address:', error);
                alert('There was an error processing your address.');
            });
    };

    // Form submit event listener
    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent form from refreshing the page

        const address = addressInput.value.trim();
        if (!address) {
            alert('Please enter a valid address.');
            return;
        }

        geocodeAddress(address); // Get the latitude and longitude from the address
    });
});
