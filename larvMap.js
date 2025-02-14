// Define the dimensions of your image (in pixels)
var imageWidth = 4678;  // Replace with your image width
var imageHeight = 1654; // Replace with your image height

var offsetX = imageWidth*0.5;
var offsetY = imageHeight*0.5;

// Calculate map bounds using Leaflet's CRS.Simple (for pixel-based maps)
//var bounds = [[offsetY, offsetX], [imageHeight+offsetY, imageWidth+offsetX]];
var bounds = [[0, 0], [imageHeight, imageWidth]];


// Initialize the map with the custom bounds
var map = L.map('map', {
    crs: L.CRS.Simple, // Use a simple coordinate system for flat images
    minZoom: -2,       // Allows zooming out
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

var items = [];

// Fetch both JSON files
Promise.all([
    fetch('Json/booths.json').then(response => response.json()),
    fetch('Json/companies.json').then(response => response.json())
])
.then(([boothsData, companiesData]) => {
    // Now you have booth coordinates and company data
    //console.log(boothsData)
    boothsData.forEach(booth => {
        const company = companiesData.find(c => c.boothSpace.name === booth.boothId);
        if(booth.boothId == "C1-51") {
            console.log(company)
        }
        if (company) {
            //console.log(company)
            //console.log(booth)
            createBoothMarker(company, booth);
        }
        else {
            console.error("No company found for "+ booth.boothId)
        }
    });
    populateDropdowns();
    const selectBtns = document.querySelectorAll(".select-btn")
    selectBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            btn.classList.toggle("open");
        });
    });
    //const selectBtn = document.querySelector(".select-btn"),
    //    items = document.querySelectorAll(".item");
    //    selectBtn.addEventListener("click", () => {
    //    selectBtn.classList.toggle("open");
    //});
    items = document.querySelectorAll(".item");
    items.forEach(item => {
        item.addEventListener("click", () => {
            console.log("Clicked! "+item.getAttribute("name"));
            item.classList.toggle("checked");
            //let checked = document.querySelectorAll('input[name="'+item.getAttribute("name")+'"], input[class="item checked"]'),
            //let checked = document.querySelectorAll(`.item.checked[name="`+item.getAttribute("name")+`'"]`);
            let checked = document.getElementsByName(item.getAttribute("name")),
                //btnText = document.querySelector(".btn-text");
                btnText = document.getElementById(item.getAttribute("name").replace("FilterOption","Text"))
                let numChecked = 0;
                //checked.forEach(i => console.log(i.getAttribute("class")));
                //checked.forEach(i => i.getAttribute("class")=="item checked" ? console.log(i.getAttribute("class")+" is equal to item checked"): console.log(i.getAttribute("class")+" is not equal to item checked"));
                checked.forEach(i => i.getAttribute("class")=="item checked" ? numChecked++: true);

                //console.log("numChecked: "+numChecked)
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

function createBoothMarker(company, booth) {
    const rect = L.rectangle([[imageHeight - booth.coordinates[0][0], booth.coordinates[0][1]], [imageHeight - booth.coordinates[1][0], booth.coordinates[1][1]]], {
        color: "blue",
        weight: 2,
        fillColor: "blue",
        fillOpacity: 0.3
    }).addTo(map);
    let cities = Array.from(citiesFromCompany(company));
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

    company.cities = cities;

    const popup = L.popup({
        maxWidth: 300,
        keepInView: true,       // Ensures popups do not go off-screen
        autoPan: true,          // Moves map if needed
        autoPanPadding: [50, 50] // Adds space around popup
    }).setContent(popupContent);

    rect.bindPopup(popup);
    booths[booth.boothId] = rect;
    companyData[booth.boothId] = company;
    companyData[booth.boothId].cities = cities
}

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

            if(Object.hasOwn(company, 'exposure')&&Object.hasOwn(company.exposure, 'interviews')) {
                offers.add("Individual Meetings")
                offersCount["Individual Meetings"] = 200
            }
            

            company.profile.industry?.forEach(industry => industryCount[industry] = (industryCount[industry] || 0) + 1);
            company.profile.desiredProgramme?.forEach(program => programCount[program] = (programCount[program] || 0) + 1);
            company.profile.weOffer?.forEach(offer => offersCount[offer] = (offersCount[offer] || 0) + 1);
            company.cities?.forEach(city => citiesCount[city] = (citiesCount[city] || 0) + 1);

        }
    });
    //console.log(industryCount)
    //console.log(programCount)
    //console.log(offersCount)

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
    //dropdown.innerHTML = `<option value="">All</option>`; // Default option
    /*optionsSet.forEach(option => {
        let optionElement = document.createElement("option");
        optionElement.value = option;
        optionElement.textContent = option;
        dropdown.appendChild(optionElement);
    });*/
    optionsSet.forEach(option => {
        let listItem = document.createElement("li");
        listItem.classList.add("item");
        //listItem.classList.entries[listItem.classList.length-1].setAttribute("name", dropdownId+"Option")
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
                  (profile.industry || []).some(industry => industry.toLowerCase().includes(searchText)) ||
                  (profile.desiredProgramme || []).some(program => program.toLowerCase().includes(searchText)) ||
                  (profile.weOffer || []).some(offer => offer.toLowerCase().includes(searchText)) ||
                  (company.cities || []).some(city => city.toLowerCase().includes(searchText))
                : true;
            //console.log(selectedIndustries);
            //selectedIndustries.forEach(selectedIndustry => console.log(selectedIndustry.innerText));
            let matchesIndustry = selectedIndustries.length>0 ? selectedIndustries.some(selectedIndustry => (profile.industry || []).includes(selectedIndustry.innerText)) : true;
            let matchesProgram = selectedProgrammes.length>0?selectedProgrammes.some(selectedProgram => (profile.desiredProgramme || []).includes(selectedProgram.innerText)) : true;
            let matchesOffer = selectedOffers.length>0? selectedOffers.some(selectedOffer => (profile.weOffer || []).includes(selectedOffer.innerText)) : true;
            let matchesCity = selectedCities.length>0? selectedCities.some(selectedCity => (company.cities || []).includes(selectedCity.innerText)) : true;

            //let matchesIndustry = selectedIndustry ? (profile.industry || []).includes(selectedIndustry) : true;
            //let matchesProgram = selectedProgram ? (profile.desiredProgramme || []).includes(selectedProgram) : true;
            //let matchesOffer = selectedOffer ? (profile.weOffer || []).includes(selectedOffer) : true;
            //let matchesCity = selectedCity ? (company.cities || []).includes(selectedCity) : true;

            //if(selectedOffers == "Individual Meetings" && Object.hasOwn(company, 'exposure')&&Object.hasOwn(company.exposure, 'interviews') && company.exposure.interviews) {
            //    matchesOffer = true;
            //}
            //if(matchesIndustry || matchesProgram || matchesOffer || matchesCity) {
            //    console.log("Company: "+company.name+ " matches industry: "+matchesIndustry+", program: "+matchesProgram+", offer: "+matchesOffer+", city: "+matchesCity)
            //}
            //matchesIndustry=true;
            //matchesProgram=true;
            //matchesOffer=true;
            //matchesCity=true;

            matches = matchesSearch && matchesIndustry && matchesProgram && matchesOffer && matchesCity;
        }

        if (matches) {
            booth.setStyle(highlightStyle); // Highlight matching booth
        } else {
            booth.setStyle(defaultStyle);
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


