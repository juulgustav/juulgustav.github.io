// Define the dimensions of your image (in pixels)
var imageWidth = 4678;  // Replace with your image width
var imageHeight = 1654; // Replace with your image height

// Calculate map bounds using Leaflet's CRS.Simple (for pixel-based maps)
var bounds = [[0, 0], [imageHeight, imageWidth]];

// Initialize the map with the custom bounds
var map = L.map('map', {
    crs: L.CRS.Simple, // Use a simple coordinate system for flat images
    minZoom: -1,       // Allows zooming out
    maxZoom: 2,        // Prevents excessive zooming in
    maxBounds: bounds, // Prevents panning beyond image
    maxBoundsViscosity: 1.0 // Ensures bounds are strict
}).setView([imageHeight / 2, imageWidth / 2], 0); // Center the map

// Load the custom image as a Leaflet layer
L.imageOverlay('Assets/Mässkarta Larv.png', bounds).addTo(map);

// Fit the image inside the map viewport
map.fitBounds(bounds);

var defaultStyle = {
    color: "blue",
    weight: 2,
    fillColor: "blue",
    fillOpacity: 0.3
};

var highlightStyle = {
    color: "green", // Change the color to green when highlighted
    weight: 3,
    fillColor: "green",
    fillOpacity: 0.5
};

// Fetch both JSON files
Promise.all([
    fetch('Json/booths.json').then(response => response.json()),
    fetch('Json/companies.json').then(response => response.json())
])
.then(([boothsData, companiesData]) => {
    // Now you have booth coordinates and company data
    boothsData.forEach(booth => {
        const company = companiesData.find(c => c.boothSpace.name === booth.boothId);
        if (company) {
            console.log(company)
            console.log(booth)
            createBoothMarker(company, booth);
        }
    });
})
.catch(error => console.error('Error loading the JSON files:', error));

var booths = {}; // Store rectangle layers so we can remove them later
var companyData = {};

function createBoothMarker(company, booth) {
    const rect = L.rectangle([[imageHeight-booth.coordinates[0][0], booth.coordinates[0][1]],[imageHeight-booth.coordinates[1][0], booth.coordinates[1][1]]], {
        color: "blue",
        weight: 2,
        fillColor: "blue",
        fillOpacity: 0.3
    }).addTo(map)
    .bindPopup(`
        <b>${company.name}</b><br>
        <strong>Industry:</strong> ${company.profile && company.profile.industry ? company.profile.industry.join(', ') : "Information not available"}<br>
        <strong>Desired Programs:</strong> ${company.profile && company.profile.desiredProgramme ? company.profile.desiredProgramme.join(', ') : "Information not available"}<br>
        <strong>We Offer:</strong> ${company.profile && company.profile.weOffer ? company.profile.weOffer.join(', ') : "Information not available"}<br>
        <br>
        <strong>About Us:</strong><br>
        ${company.profile && company.profile.aboutUs ? company.profile.aboutUs : "Information not available"}
    `);
    // Store booth in boothLayers with boothId as key
    booths[booth.boothId] = rect;
    companyData[booth.boothId] = company
}

// 📌 Define booths with coordinates and info
//var booths = [
//    { name: "Kiwa", coords: [[imageHeight-250, 2090], [imageHeight-320, 2190]], info: "Vi är Kiwa, ett av världens största företag inom besiktning, provning och certifiering. Våra tjänster skapar förtroende för våra kunders produkter, tjänster, ledningssystem och medarbetare. Vi finns i hela Sverige, från Malmö i söder till Kiruna i norr.", tags: ["inspection", "certification", "engineering"] },
//    { name: "Syntronic Research and Development", coords: [[imageHeight-250, 1990], [imageHeight-320, 2090]], info: "Looking for software engineers.", tags: ["software", "engineering"] },
//    { name: "Länsstyrelsen Norrbotten", coords: [[imageHeight-250, 1885], [imageHeight-320, 1990]], info: "We have graduate programs available.", tags: ["government", "graduate programs"] },
//    { name: "Länsstyrelsen Norrbotten2", coords: [[0, 0], [100, 100]], info: "We have graduate programs available.", tags: ["government", "graduate programs"] }
//];



// Add booths to map
//booths.forEach(booth => {
//    var rect = L.rectangle(booth.coords, defaultStyle)  // Default style initially
//        .addTo(map)
//        .bindPopup(`<b>${booth.name}</b><br>${booth.info}`);
//
//    boothLayers[booth.name] = rect; // Store reference for filtering and highlighting
//});

// 🔍 Function to filter by search and category
function filterBooths() {
    var searchText = document.getElementById("searchBox").value.toLowerCase();

    // Reset the styles to default before filtering
    for (let boothId in booths) {
        booths[boothId].setStyle(defaultStyle);
    }

    if (searchText.length < 1) {
        return;
    }

    // Loop through all booth layers
    for (let boothId in booths) {
        var booth = booths[boothId];  // Get the current booth layer
        var company = companyData[boothId]; // Find company by boothId

        // If company is found, check for matches
        var matches = false;
        if (company) {
            // Check name, industry, and programs for matches
            matches = company.name.toLowerCase().includes(searchText) ||
                      (company.profile && company.profile.industry && company.profile.industry.some(industry => industry.toLowerCase().includes(searchText))) ||
                      (company.profile && company.profile.desiredProgramme && company.profile.desiredProgramme.some(program => program.toLowerCase().includes(searchText))) ||
                      (company.profile && company.profile.weOffer && company.profile.weOffer.some(offer => offer.toLowerCase().includes(searchText)));
        }

        // Highlight or remove based on search match
        if (matches) {
            booth.setStyle(highlightStyle); // Highlight matching booth
        } else {
            booth.setStyle(defaultStyle);  // Reset style for non-matching booths
        }
    }
}


// 🔍 Function to filter booths based on selected category
function filterByCategory() {
    var selectedCategory = document.getElementById("filterMenu").value.toLowerCase();

    // Reset all booths to default style
    for (let boothName in booths) {
        booths[boothName].setStyle(defaultStyle);
    }

    // If no category is selected, return (no filtering)
    if (!selectedCategory) {
        return;
    }

    // Loop through booths and highlight matching ones based on the selected category
    booths.forEach(booth => {
        var matchesCategory = booth.tags.some(tag => tag.toLowerCase().includes(selectedCategory));

        if (matchesCategory) {
            booths[booth.name].setStyle(highlightStyle); // Highlight matching booths
        }
    });
}

// Example of filtering booths by industry
function filterByIndustry() {
    var selectedIndustry = document.getElementById("filterMenu").value.toLowerCase();

    booths.forEach(booth => {
        if (booth.industry.toLowerCase().includes(selectedIndustry)) {
            booth.marker.setStyle(highlightStyle); // Highlight matching booths
        } else {
            booth.marker.setStyle(defaultStyle); // Reset non-matching booths
        }
    });
}