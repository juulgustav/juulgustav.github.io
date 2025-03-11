// Define the dimensions of your image (in pixels)
var imageWidth = 4678;  // Replace with your image width
var imageHeight = 1654; // Replace with your image height

var offsetX = imageWidth*1;
var offsetY = imageHeight*1;

// Calculate map bounds using Leaflet's CRS.Simple (for pixel-based maps)
var panBounds = [[-offsetY, -offsetY], [imageHeight+offsetY, imageWidth+offsetY]];
var bounds = [[0, 0], [imageHeight, imageWidth]];



// Initialize the map with the custom bounds
var map = L.map('map').setView([65.620366, 22.135477], 16); // Center the map
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

function getCoordinates(apartment, index) {
    console.log(apartment.adress);
    let titel = `<b>${apartment.adress} med ${apartment.bostadskö} som värd</b>`;
    let inflyttningsDatumeStylized = apartment.inflyttningsdatum.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
    inflyttningsDatumeStylized = inflyttningsDatumeStylized.replace(/(\p{L})/u, match => match.toUpperCase());
        let marker =L.marker([apartment.latitud, apartment.longitud]).addTo(markerClusters)
            .bindPopup(`
            <strong>${apartment.länk && apartment.länk.length>0 ? "<a href=\""+apartment.länk+"\">"+titel+"</a>" : titel}</strong><br>
            ${apartment.storlek}:a på ${apartment.våning} våningen med ${apartment.kvm}m²<br>
            <strong>Hyra:</strong> ${apartment.hyra}kr<br>
            <strong>Möblerad:</strong> ${apartment.möblerad ? "Ja":"Nej"}<br>
            <strong>Lägenhetstyp:</strong> ${apartment.lägenhetstyp}<br>
            <strong>Tidigareinflyttning:</strong> ${apartment.tidigareInflyttning ? "Ja":"Nej"}<br>
            <strong>Korridor:</strong> ${apartment.korridor ? "Ja":"Nej"}<br>

            <strong>Inflyttningsdatum:</strong> ${inflyttningsDatumeStylized}<br>

            <br>
            <strong>About Us:</strong><br>
            ${apartment.beskrivning || "Information not available"}<br>
            <strong>${apartment.länk && apartment.länk.length>0 ? "" : "Direktlänk saknas:(<br>"}</strong>
            <button id="more-info-btn" name=${index}>More Info</button>
            `);
            //.openPopup();
    //apartments.push(marker)
    apartment.marker = marker;
  }

//function getCoordinatesFromAdress(address) {
//    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
//      .then(response => response.json())
//      .then(data => {
//        if (data.length > 0) {
//          let lat = data[0].lat;
//          let lon = data[0].lon;
//          console.log(`Coordinates: ${lat}, ${lon}`);
//
//          // Move the map to the new location
//          map.setView([lat, lon], 14);
//
//          // Add a marker
//          L.marker([lat, lon]).addTo(map)
//            .bindPopup(`Address: ${address}<br>Lat: ${lat}, Lon: ${lon}`)
//            .openPopup();
//        } else {
//          alert("Address not found!");
//        }
//      })
//      .catch(error => console.error("Geocoding error:", error));
//  }
//getCoordinatesFromAdress("Vänortsvägen 46, Luleå")
// Fetch both JSON files

//var apartments = []; // Store rectangle layers so we can remove them later
var apartmentData = [];
var markerClusters  = L.markerClusterGroup({
    maxClusterRadius: 50, // Cluster radius in pixels
    spiderfyOnMaxZoom: true, // Expand markers when zoomed in
    showCoverageOnHover: true, // Hide the cluster area outline on hover
    disableClusteringAtZoom: 21 // Disable clustering when zoomed in beyond level 16
});
document.getElementById('info-modal').style.display = "none";

Promise.all([
    fetch('Json/Lägenheter.json?nocache='+ (new Date()).getTime()).then(response => response.json()),
    fetch('Json/Lägenheter.json?nocache='+ (new Date()).getTime()).then(response => response.headers.get('Last-Modified')),
])
.then(([apartmentsData, modTime]) => {
    console.log(apartmentsData);
    modTime = new Date(modTime);
    console.log(modTime);
    document.getElementById('last-modified-date').innerHTML = "Uppdaterad: "+modTime.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', hour:'numeric', minute:'numeric'});
    apartmentsData.forEach(apartment => {
        //apartment.adress +=", Luleå, Sweden";
        apartment.inflyttningsdatum = apartment.inflyttningsdatum ? new Date(apartment.inflyttningsdatum) : null;
        apartment.tidigareInflyttning = apartment.tidigareInflyttning ? new Date(apartment.tidigareInflyttning) : null;
        getCoordinates(apartment,apartmentData.length);
        apartmentData.push(apartment);
    });
    map.addLayer(markerClusters);
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


function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function populateDropdowns() {
    let bostadsområden = new Set();
    let rok = new Set();
    let värdar = new Set();
    let möblerad = new Set();
    let lägenhetstyp = new Set();


    let bostadsområdeCount= {}
    let rokCount= {}
    let värdarCount= {}
    let möbleradCount= {}
    let lägenhetstypCount= {}



    Object.values(apartmentData).forEach(apartment => {
        bostadsområden.add(apartment.bostadsområde);
        rok.add(apartment.storlek);
        värdar.add(apartment.bostadskö);
        möblerad.add(apartment.möblerad);
        lägenhetstyp.add(apartment.lägenhetstyp);

        
        bostadsområdeCount[apartment.bostadsområde] = (bostadsområdeCount[apartment.bostadsområde] || 0) + 1
        rokCount[apartment.storlek] = (rokCount[apartment.storlek] || 0) + 1
        värdarCount[apartment.bostadskö] = (värdarCount[apartment.bostadskö] || 0) + 1
        möbleradCount[apartment.möblerad] = (möbleradCount[apartment.möblerad] || 0) + 1
        lägenhetstypCount[apartment.lägenhetstyp] = (lägenhetstypCount[apartment.lägenhetstyp] || 0) + 1

    });


    bostadsområden = Array.from(bostadsområden);
    bostadsområden.sort(function(a, b){return bostadsområdeCount[b]-bostadsområdeCount[a]})
    rok = Array.from(rok);
    rok.sort(function(a, b){return rokCount[b]-rokCount[a]})
    värdar = Array.from(värdar);
    värdar.sort(function(a, b){return värdarCount[b]-värdarCount[a]})
    möblerad = Array.from(möblerad);
    möblerad.sort(function(a, b){return möbleradCount[b]-möbleradCount[a]})
    lägenhetstyp = Array.from(lägenhetstyp);
    lägenhetstyp.sort(function(a, b){return lägenhetstypCount[b]-lägenhetstypCount[a]})
    let list = []
    Object.values(bostadsområden).forEach(bostadsområde => {
        list.push([bostadsområde,bostadsområdeCount[bostadsområde]]);
    });
    console.log(list)
    list = []
    Object.values(rok).forEach(rok => {
        list.push([rok,rokCount[rok]]);
    });
    console.log(list)
    list = []
    Object.values(värdar).forEach(värd => {
        list.push([värd,värdarCount[värd]]);
    });
    console.log(list)
    list = []
    Object.values(möblerad).forEach(möbler => {
        list.push([möbler,möbleradCount[möbler]]);
    });
    console.log(list)
    list = []
    Object.values(lägenhetstyp).forEach(lägenhetenstyp => {
        list.push([lägenhetenstyp,lägenhetstypCount[lägenhetenstyp]]);
    });
    console.log(list)


    addOptionsToDropdown("bostadsområdeFilter", bostadsområden);
    addOptionsToDropdown("rokFilter", rok);
    addOptionsToDropdown("värdFilter", värdar);
    addOptionsToDropdown("möbleradFilter", möblerad);
    addOptionsToDropdown("lägenhetstypFilter", lägenhetstyp);
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
    var selectedBostadsområden = document.getElementById("bostadsområdeFilter");
    var selectedROK = document.getElementById("rokFilter");
    var selectedVärdar = document.getElementById("värdFilter");
    var selectedMöblerad = document.getElementById("möbleradFilter");
    var selectedLägenhetstyp = document.getElementById("lägenhetstypFilter");


    selectedBostadsområden = Array.from(selectedBostadsområden.children).filter(item => item.className == "item checked");
    selectedROK = Array.from(selectedROK.children).filter(item => item.className == "item checked");
    selectedVärdar = Array.from(selectedVärdar.children).filter(item => item.className == "item checked");
    selectedMöblerad = Array.from(selectedMöblerad.children).filter(item => item.className == "item checked");
    selectedLägenhetstyp = Array.from(selectedLägenhetstyp.children).filter(item => item.className == "item checked");

    //console.log(selectedIndustries);
    selectedBostadsområden.forEach(selectedIndustry => console.log(selectedIndustry.innerText));


    // Reset all booths to default style
    Object.values(apartmentData).forEach(apartment => {
        //apartment.marker.opacity =0;
        markerClusters.addLayer(apartment.marker);
        //console.log(apartment.marker);
    });

    console.log(selectedBostadsområden);
    if (!searchText && selectedBostadsområden.length==0 && selectedROK.length==0 && selectedVärdar.length==0 && selectedMöblerad.length==0 && selectedLägenhetstyp.length ==0) {
        return; // No filters applied
    }
    console.log(searchText);
    // Loop through all booth layers
    Object.values(apartmentData).forEach(apartment => {
        var matches = false;

        let matchesSearch = searchText
                ? apartment.bostadsområde?.toLowerCase().includes(searchText) ||
                //apartment.storlek.toLowerCase().includes(searchText) ||
                apartment.beskrivning?.toLowerCase().includes(searchText) ||
                apartment.adress?.toLowerCase().includes(searchText) ||
                //apartment.kvm.toLowerCase().includes(searchText) ||
                apartment.inflyttningsdatum?.toLowerCase().includes(searchText)
                : true;


        let matchesBostadsområde = selectedBostadsområden.length>0 ? selectedBostadsområden.some(selectedBostadsområde => selectedBostadsområde.innerText==apartment.bostadsområde) : true;
        //console.log(matchesSearch);
        console.log(apartment.adress.toLowerCase().includes(searchText))
        //selectedBostadsområden.forEach(selectedIndustry => console.log(selectedIndustry.innerText));
        //console.log(apartment.bostadsområde);
        //selectedBostadsområden.forEach(selectedIndustry => console.log(selectedIndustry.innerText==apartment.bostadsområde));
        let matchesROK = selectedROK.length>0 ? selectedROK.some(selectedROK => selectedROK.innerText==apartment.storlek) : true;
        let matchesVärdar = selectedVärdar.length>0 ? selectedVärdar.some(selectedVärd => selectedVärd.innerText==apartment.bostadskö) : true;
        let matchesMöblerad = selectedMöblerad.length>0 ? selectedMöblerad.some(selectedMöbler => selectedMöbler.innerText==apartment.möblerad.toString()) : true;
        let matchesLägenhetstyp = selectedLägenhetstyp.length>0 ? selectedLägenhetstyp.some(selecLägenhettyp => selecLägenhettyp.innerText==apartment.lägenhetstyp) : true;

        matches = matchesBostadsområde && matchesROK && matchesVärdar && matchesMöblerad && matchesLägenhetstyp && matchesSearch;
        if(!matches)
        {
            //apartment.marker.opacity =0;
            markerClusters.removeLayer(apartment.marker);
        }
    });
}
map.on('popupopen', function(pop) {
    console.log("Popup!")
    // Open modal when "More Info" button is clicked

    document.querySelectorAll('[id=more-info-btn]').forEach(buton => buton.addEventListener('click', function(e) {
        console.log("Button clicked!")
        console.log(e.target.name)
        console.log(pop)
        const modalContent = document.querySelector('.modal-content');
        //let apartment =apartmentData.find(o => o.marker.popup = pop);
        let apartment =apartmentData[e.target.name];
        let inflyttningsDatumeStylized = apartment.inflyttningsdatum.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
        inflyttningsDatumeStylized = inflyttningsDatumeStylized.replace(/(\p{L})/u, match => match.toUpperCase());
        // Update the modal content dynamically
        modalContent.innerHTML = `
            <span class="close-btn">&times;</span>
            <b>${apartment.adress} med ${apartment.bostadskö} som värd</b><br>
            ${apartment.storlek}:a på ${apartment.våning} våningen med ${apartment.kvm}m²<br>
            <strong>Hyra:</strong> ${apartment.hyra}kr<br>
            <strong>Möblerad:</strong> ${apartment.möblerad ? "Ja" : "Nej"}<br>
            <strong>Lägenhetstyp:</strong> ${apartment.lägenhetstyp}<br>
            <strong>Tidigare inflyttning:</strong> ${apartment.tidigareInflyttning ? "Ja" : "Nej"}<br>
            <strong>Korridor:</strong> ${apartment.korridor ? "Ja" : "Nej"}<br>
            <strong>Inflyttningsdatum:</strong> ${inflyttningsDatumeStylized}<br>
            <br>
            <strong>About Us:</strong><br>
            ${apartment.beskrivning || "Information not available"}<br>
            <strong>${apartment.länk && apartment.länk.length>0 ? "<a href=\""+apartment.länk+"\">Länk till lägenhet</a>" : "Direktlänk saknas:("}</strong>
            <img src=${apartment.bildLänk}>
            <img src=${apartment.planlösningsLänk}>
        `;

        document.getElementById('info-modal').style.display = "block";

        // Close modal when the user clicks on the close button (×)
        document.querySelector('.close-btn').addEventListener('click', function() {
            document.getElementById('info-modal').style.display = "none";
        });
        // Close modal if the user clicks outside the modal
        //window.onclick = function(event) {
        //    if (event.target == document.getElementById('info-modal')) {
        //        document.getElementById('info-modal').style.display = "none";
        //    }
        //};
    }));

    
});




