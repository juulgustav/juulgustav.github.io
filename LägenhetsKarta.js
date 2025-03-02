// Define the dimensions of your image (in pixels)
var imageWidth = 4678;  // Replace with your image width
var imageHeight = 1654; // Replace with your image height

var offsetX = imageWidth*1;
var offsetY = imageHeight*1;

// Calculate map bounds using Leaflet's CRS.Simple (for pixel-based maps)
var panBounds = [[-offsetY, -offsetY], [imageHeight+offsetY, imageWidth+offsetY]];
var bounds = [[0, 0], [imageHeight, imageWidth]];



// Initialize the map with the custom bounds
var map = L.map('map').setView([65.618163, 22.140272], 15); // Center the map
// Load the custom image as a Leaflet layer
//L.imageOverlay('Assets/Mässkarta Larv.png', bounds).addTo(map);
map.attributionControl.addAttribution('Made by Gustav Juul');
// Fit the image inside the map viewport
//map.fitBounds(bounds);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

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

var items = [];

function getCoordinates(apartment) {
    console.log(apartment.adress);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(apartment.adress)}`)
      .then(response => response.json())
      .then(data => {
        if (data.length > 0) {
          let lat = data[0].lat;
          let lon = data[0].lon;
          console.log(`Coordinates: ${lat}, ${lon}`);

          // Move the map to the new location
          //map.setView([lat, lon], 14);

          // Add a marker
          L.marker([lat, lon]).addTo(map)
            .bindPopup(apartment.beskrivning)
            .openPopup();
        } else {
          alert("Address not found!"+ apartment.adress);
          console.log("Address not found!"+ apartment.adress+", Luleå");
        }
      })
      .catch(error => console.error("Geocoding error:", error));
  }

  function getCoordinatesFromAdress(address) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
      .then(response => response.json())
      .then(data => {
        if (data.length > 0) {
          let lat = data[0].lat;
          let lon = data[0].lon;
          console.log(`Coordinates: ${lat}, ${lon}`);

          // Move the map to the new location
          map.setView([lat, lon], 14);

          // Add a marker
          L.marker([lat, lon]).addTo(map)
            .bindPopup(`Address: ${address}<br>Lat: ${lat}, Lon: ${lon}`)
            .openPopup();
        } else {
          alert("Address not found!");
        }
      })
      .catch(error => console.error("Geocoding error:", error));
  }
  getCoordinatesFromAdress("Vänortsvägen 46, Luleå")
// Fetch both JSON files
Promise.all([
    fetch('Json/Lägenheter.json').then(response => response.json()),
    //fetch('Json/companies.json').then(response => response.json())
])
.then(([apartmentData]) => {
    console.log(apartmentData);
    apartmentData.forEach(apartment => {
        apartment.adress +=", Luleå, Sweden";
        //getCoordinates(apartment);
    });
    populateDropdowns();
    const selectBtns = document.querySelectorAll(".select-btn")
    selectBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            btn.classList.toggle("open");
        });
    });
    items = document.querySelectorAll(".item");
    items.forEach(item => {
        item.addEventListener("click", () => {
            console.log("Clicked! "+item.getAttribute("name"));
            item.classList.toggle("checked");
            let checked = document.getElementsByName(item.getAttribute("name")),
                btnText = document.getElementById(item.getAttribute("name").replace("FilterOption","Text"))
                let numChecked = 0;
                checked.forEach(i => i.getAttribute("class")=="item checked" ? numChecked++: true);

                if(numChecked > 0){
                    btnText.innerText = `${numChecked} Selected`;
                }else{
                    btnText.innerText = btnText.getAttribute("name");
                }
            filterBooths();
        });
    })
    console.log(items)
})
.catch(error => console.error('Error loading the JSON files:', error));

var booths = {}; // Store rectangle layers so we can remove them later
var companyData = {};

function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}


function createBoothMarker(company, booth) {
    const rect = L.rectangle([[imageHeight - booth.coordinates[0][0], booth.coordinates[0][1]], [imageHeight - booth.coordinates[1][0], booth.coordinates[1][1]]], {
        color: "blue",
        weight: 2,
        fillColor: "blue",
        fillOpacity: 0.3
    }).addTo(map);
    let cities = Array.from(citiesFromCompany(company));
    if(Object.hasOwn(company, 'exposure')&&Object.hasOwn(company.exposure, 'interviews') && company.exposure.interviews>0){
        console.log(company.profile.weOffer);
        if(!Object.hasOwn(company, 'profile') || !Object.hasOwn(company.exposure, 'weOffer')) {
            
        }
        company.profile.weOffer.push("Individual Meetings");
    }
    let popupContent = `
        <b>${company.name}</b><br>
        <strong>Industry:</strong> ${company.profile?.industry?.join(', ') || "Information not available"}<br>
        <strong>Desired Programs:</strong> ${company.profile?.desiredProgramme?.join(', ') || "Information not available"}<br>
        <strong>We Offer:</strong> ${company.profile?.weOffer?.join(', ') || "Information not available"}<br>
        <strong>Cities:</strong> ${cities?.join(', ') || "Information not available"}<br>

        <br>
        <strong>About Us:</strong><br>
        ${company.profile?.aboutUs || "Information not available"}
        
    `;


    const popup = L.popup({
        maxWidth: isMobile() ? window.innerWidth*0.8 : 500,
        //keepInView: true,       // Ensures popups do not go off-screen
        autoPan: true,          // Moves map if needed
        autoPanPadding: [50, 50] // Adds space around popup
    }).setContent(popupContent);

    rect.bindPopup(popup);
    booths[booth.boothId] = rect;
    companyData[booth.boothId] = company;
    companyData[booth.boothId].cities = cities;
}

map.on("popupopen", function (e) {
    map.setMaxBounds(panBounds);
    console.log("Popup opened!", e.popup);
});

map.on("popupclose", function (e) {
    map.setMaxBounds(bounds);
    console.log("Popup closed!", e.popup);
    console.log("Popups", map.getPane("popupPane"));
    console.log("Popup open?", map.getPane("popupPane").getElementsByClassName("leaflet-popup  leaflet-zoom-animated").length);
});


function citiesFromCompany(company) {
    let cities = new Set()
    if (company.profile) {
        company.profile.cities?.forEach(city => cities.add(city));
    }
    if (company.jobs) {
        company.jobs.list?.forEach(job => job.location?.forEach(city => cities.add(city)));
    }
    return cities;
}

function populateDropdowns() {
    let industries = new Set();
    let programs = new Set();
    let offers = new Set();
    let cities = new Set();


    let industryCount= {}
    let programCount= {}
    let offersCount= {}
    let citiesCount= {}


    Object.values(companyData).forEach(company => {
        if (company.profile) {
            company.profile.industry?.forEach(industry => industries.add(industry));
            company.profile.desiredProgramme?.forEach(program => programs.add(program));
            company.profile.weOffer?.forEach(offer => offers.add(offer));
            company.cities?.forEach(city => cities.add(city));

            if(Object.hasOwn(company, 'exposure') && Object.hasOwn(company.exposure, 'interviews') && company.exposure.interviews>0) {
                offers.add("Individual Meetings")
                offersCount["Individual Meetings"] = 200
            }
            

            company.profile.industry?.forEach(industry => industryCount[industry] = (industryCount[industry] || 0) + 1);
            company.profile.desiredProgramme?.forEach(program => programCount[program] = (programCount[program] || 0) + 1);
            company.profile.weOffer?.forEach(offer => offersCount[offer] = (offersCount[offer] || 0) + 1);
            company.cities?.forEach(city => citiesCount[city] = (citiesCount[city] || 0) + 1);

        }
    });

    industries = Array.from(industries);
    industries.sort(function(a, b){return industryCount[b]-industryCount[a]})
    programs = Array.from(programs);
    programs.sort(function(a, b){return programCount[b]-programCount[a]})
    offers = Array.from(offers);
    offers.sort(function(a, b){return offersCount[b]-offersCount[a]})
    cities = Array.from(cities);
    cities.sort(function(a, b){return citiesCount[b]-citiesCount[a]})

    let list = []
    Object.values(industries).forEach(industry => {
        list.push([industry,industryCount[industry]]);
    });
    console.log(list)
    list = []
    Object.values(programs).forEach(program => {
        list.push([program,programCount[program]]);
    });
    console.log(list)
    list = []
    Object.values(offers).forEach(offer => {
        list.push([offer,offersCount[offer]]);
    });
    console.log(list)
    list = []
    Object.values(cities).forEach(city => {
        list.push([city,citiesCount[city]]);
    });
    console.log(list)


    addOptionsToDropdown("industryFilter", industries);
    addOptionsToDropdown("programFilter", programs);
    addOptionsToDropdown("offerFilter", offers);
    addOptionsToDropdown("cityFilter", cities);

}

function addOptionsToDropdown(dropdownId, optionsSet) {
    let dropdown = document.getElementById(dropdownId);
    optionsSet.forEach(option => {
        let listItem = document.createElement("li");
        listItem.classList.add("item");
        listItem.setAttribute("name", dropdownId+"Option");
        let checkboxSpan = document.createElement("span");
        checkboxSpan.classList.add("checkbox");

        let checkIcon = document.createElement("i");
        checkIcon.classList.add("fa-solid", "fa-check", "check-icon");

        let textSpan = document.createElement("span");
        textSpan.textContent = option;
        textSpan.classList.add("option-text"); // Add class for styling if needed

        checkboxSpan.appendChild(checkIcon);
        listItem.appendChild(checkboxSpan);
        listItem.appendChild(textSpan);
        dropdown.appendChild(listItem);
    });
}


function filterBooths() {
    var searchText = document.getElementById("searchBox").value.toLowerCase();
    var selectedIndustries = document.getElementById("industryFilter");
    var selectedProgrammes = document.getElementById("programFilter");
    var selectedOffers = document.getElementById("offerFilter");
    var selectedCities = document.getElementById("cityFilter");

    selectedIndustries = Array.from(selectedIndustries.children).filter(item => item.className == "item checked");
    selectedProgrammes = Array.from(selectedProgrammes.children).filter(item => item.className == "item checked");
    selectedOffers = Array.from(selectedOffers.children).filter(item => item.className == "item checked");
    selectedCities = Array.from(selectedCities.children).filter(item => item.className == "item checked");

    //console.log(selectedIndustries);
    selectedIndustries.forEach(selectedIndustry => console.log(selectedIndustry.innerText));


    // Reset all booths to default style
    for (let boothId in booths) {
        booths[boothId].setStyle(defaultStyle);
    }

    if (!searchText && selectedIndustries.length==0 && selectedProgrammes.length==0 && selectedOffers.length==0 && selectedCities.length==0) {
        return; // No filters applied
    }

    // Loop through all booth layers
    for (let boothId in booths) {
        var booth = booths[boothId];
        var company = companyData[boothId];

        var matches = false;
        if (company) {
            let profile = company.profile || {};

            // 🔹 Allow search to match name, industry, program, or offer
            let matchesSearch = searchText
                ? company.name.toLowerCase().includes(searchText) ||
                  company.boothSpace.name.toLowerCase().includes(searchText) ||
                  (profile.industry || []).some(industry => industry.toLowerCase().includes(searchText)) ||
                  (profile.desiredProgramme || []).some(program => program.toLowerCase().includes(searchText)) ||
                  (profile.weOffer || []).some(offer => offer.toLowerCase().includes(searchText)) ||
                  (company.cities || []).some(city => city.toLowerCase().includes(searchText))
                : true;

            let matchesIndustry = selectedIndustries.length>0 ? selectedIndustries.some(selectedIndustry => (profile.industry || []).includes(selectedIndustry.innerText)) : true;
            let matchesProgram = selectedProgrammes.length>0?selectedProgrammes.some(selectedProgram => (profile.desiredProgramme || []).includes(selectedProgram.innerText)) : true;
            let matchesOffer = selectedOffers.length>0? selectedOffers.some(selectedOffer => (profile.weOffer || []).includes(selectedOffer.innerText)) : true;
            let matchesCity = selectedCities.length>0? selectedCities.some(selectedCity => (company.cities || []).includes(selectedCity.innerText)) : true;

            matches = matchesSearch && matchesIndustry && matchesProgram && matchesOffer && matchesCity;
        }

        if (matches) {
            booth.setStyle(highlightStyle); // Highlight matching booth
        } else {
            booth.setStyle(defaultStyle);
        }
    }
}


