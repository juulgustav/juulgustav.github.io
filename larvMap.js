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

// 📌 Define booths with coordinates and info
var booths = [
    { name: "Kiwa", coords: [[imageHeight-250, 2090], [imageHeight-320, 2190]], info: "Vi är Kiwa, ett av världens största företag inom besiktning, provning och certifiering. Våra tjänster skapar förtroende för våra kunders produkter, tjänster, ledningssystem och medarbetare. Vi finns i hela Sverige, från Malmö i söder till Kiruna i norr.", tags: ["inspection", "certification", "engineering"] },
    { name: "Syntronic Research and Development", coords: [[imageHeight-250, 1990], [imageHeight-320, 2090]], info: "Looking for software engineers.", tags: ["software", "engineering"] },
    { name: "Länsstyrelsen Norrbotten", coords: [[imageHeight-250, 1885], [imageHeight-320, 1990]], info: "We have graduate programs available.", tags: ["government", "graduate programs"] },
    { name: "Länsstyrelsen Norrbotten2", coords: [[0, 0], [100, 100]], info: "We have graduate programs available.", tags: ["government", "graduate programs"] }
];


var boothLayers = {}; // Store rectangle layers so we can remove them later

// Add booths to map
booths.forEach(booth => {
    var rect = L.rectangle(booth.coords, defaultStyle)  // Default style initially
        .addTo(map)
        .bindPopup(`<b>${booth.name}</b><br>${booth.info}`);

    boothLayers[booth.name] = rect; // Store reference for filtering and highlighting
});

// 🔍 Function to filter by search and category
function filterBooths() {
    var searchText = document.getElementById("searchBox").value.toLowerCase();
    var selectedCategory = document.getElementById("filterMenu").value.toLowerCase();

    // Reset all booths to default style
    for (let boothName in boothLayers) {
        boothLayers[boothName].setStyle(defaultStyle);
    }

    // If no search text or category is selected, reset and return
    if (searchText.length < 1 && !selectedCategory) {
        return;
    }

    booths.forEach(booth => {
        var matchesSearch = booth.name.toLowerCase().includes(searchText) || 
                            booth.tags.some(tag => tag.toLowerCase().includes(searchText));

        var matchesCategory = selectedCategory && booth.tags.some(tag => tag.toLowerCase().includes(selectedCategory));

        if (matchesSearch || matchesCategory) {
            boothLayers[booth.name].setStyle(highlightStyle); // Highlight matching booths
        }
    });
}

// 🔍 Function to filter booths based on selected category
function filterByCategory() {
    var selectedCategory = document.getElementById("filterMenu").value.toLowerCase();

    // Reset all booths to default style
    for (let boothName in boothLayers) {
        boothLayers[boothName].setStyle(defaultStyle);
    }

    // If no category is selected, return (no filtering)
    if (!selectedCategory) {
        return;
    }

    // Loop through booths and highlight matching ones based on the selected category
    booths.forEach(booth => {
        var matchesCategory = booth.tags.some(tag => tag.toLowerCase().includes(selectedCategory));

        if (matchesCategory) {
            boothLayers[booth.name].setStyle(highlightStyle); // Highlight matching booths
        }
    });
}
