// Locations starter data
const locations = [
  {
    name: 'Carnitas\' Snack Shack',
    location: [
      {lat: 32.7485859, lng: -117.1354939}
    ],
    address1: '2632 University Ave',
    address2: 'San Diego, CA 92104',
    foursquare_id: '4de062a2fa76425c5418aae6'
  },
  {
    name: 'Mariposa Ice Cream',
    location: [
      {lat: 32.7635278, lng: -117.1189853}
    ],
    address1: '3450 Adams Ave',
    address2: 'San Diego, CA 92116',
    foursquare_id: '4a9b35f6f964a520c03420e3'
  },
  {
    name: 'Taste of the Himalayas',
    location: [
      {lat: 32.7498876, lng: -117.2091363}
    ],
    address1: '3185 Midway Dr',
    address2: 'San Diego, CA 92110',
    foursquare_id: '4b80469bf964a520486330e3'
  },
  {
    name: 'Nobu',
    location: [
      {lat: 32.70740650717673, lng: -117.1601479135947}
    ],
    address1: '207 5th Ave',
    address2: 'San Diego, CA 92111',
    foursquare_id: '4b27e7a6f964a520088c24e3'
  },
  {
    name: 'Treet',
    location: [
      {lat: 32.754933, lng: -117.222579}
    ],
    address1: '3960 W Point Loma Blvd M',
    address2: 'San Diego, CA 92110',
    foursquare_id: '58d1de222f91cb7d7209cb60'
  }
];
// Processing locations for the ViewModel
var Location = function (location) {
  this.name = ko.observable(location.name);
  this.locations = ko.observableArray(location.location);
  this.shortAddress = ko.observable(location.address1);
  this.fullAddress = ko.computed(function() {
    return location.address1 + ' ' + location.address2
  });
  this.venue_id = ko.observable(location.foursquare_id);
}

var ViewModel = function () {
  // Get map DOM element
  this.mapDiv = document.getElementById('map')
  // Constructor creates a new map
  this.map = new google.maps.Map(this.mapDiv, {
    center: {lat: 32.715738, lng: -117.1610838},
    zoom: 13,
    mapTypeControl: false
    });
  //Create instances observables for the Location List
  this.locationList = ko.observableArray([]);
  this.searchLocationsList = ko.observableArray([]);
  // Add locations to obsevables
  locations.forEach((location) => {
    this.locationList.push(new Location(location));
  });
  // Sets which list to show after a filter
  this.getList = ko.pureComputed(function () {
    return this.searchLocationsList() == '' ? this.locationList() : this.searchLocationsList()
  }, this);
  // Init markers upon map load
  this.favMarkersList = ko.observableArray([]);
  // Markers from the generalSearch
  this.searchMarkersList = ko.observableArray([]);
  //General search for location via Foursquare API
  this.generalSearch = function (data, event) {
    hideMarkers(
      this.searchMarkersList() != '' ? this.searchMarkersList() : this.favMarkersList()
    );
    var map = data.map;
    var bounds = map.getBounds();
    var searchMarkersList = data.searchMarkersList();
    // Gets value of the searchBox
    var searchAreaBox = document.getElementById('search-general').value;
    // Checks for empty SearchBox
    if (searchAreaBox == '') {
      window.alert('Please enter a search item.');
    } else {
      //Set up Foursuare API url
      var url = 'https://api.foursquare.com/v2/venues/explore';
      url += '?' + $.param({
        'client_id': 'WJ5DDPCQKCPMKJGCNLJD3MI51APPH1HEYVFHLGI1KW4YN2QR',
        'client_secret': 'QKNGDVIC4CVANGWBLG2J5ONQNCUYLBIZH3DX2Z4DFL03LQ0P',
        'v': '20171101',
        'intent': 'browse',
        'query': searchAreaBox,
        'll': '32.715738,-117.1610838',
        'radius': '10000',
        'limit': '10'
        });
      // AJAX call to Foursquare
      // Returns JSON of venue search results
      $.get(url)
        .done(function (results) {
          if (results.meta.code == 200) {
            var response = results.response.groups[0].items;
            if (response == '') {
              window.alert(results.response.warning.text)
            }
            // Sets each marker with the data from returned API results
            for(var i = 0; i < response.length; i++){
              var marker = makeMarker();
              var venue = response[i].venue;
              var infowindow = new google.maps.InfoWindow();
              var location = {
                name: venue.name,
                location: [{
                  lat: venue.location.lat,
                  lng: venue.location.lng
                }],
                address1: venue.location.address,
                address2: venue.location.formattedAddress[1],
                foursquare_id: venue.id
              }
              marker.id = venue.id;
              marker.setTitle(venue.name);
              marker.setPosition({
                lat: venue.location.lat,
                lng: venue.location.lng
              });
              marker.setMap(map);
              // Push the marker to our observable array of search result markers
              searchMarkersList.push(marker);
              data.searchLocationsList.push(new Location(location));
              marker.addListener('click', function() {
                // Create an onclick event to open the infowindow at each marker
                populateInfoWindow(this, infowindow);
                this.setIcon(makeMarkerIcon('FFFF24'));
              });
              map.setZoom(13);
            }
          } else {
            window.alert('No results found. Please specify more details.');
          }
      });
    }
  }
  // Filters through locationList
  // Returns all partial matches to the filterBox input
  this.filterList = function (data, event) {
    var locationList = data.searchLocationsList() != '' ? data.searchLocationsList() : data.locationList();
    var filterBox = document.getElementById('filter-list').value;
    if (filterBox != '') {
      var results = locationList.filter((item) => {
        return item.name().toLowerCase().indexOf(filterBox.toLowerCase()) > -1
      });
      data.searchLocationsList.removeAll();
      results.forEach((location) => {
        data.searchLocationsList.push(location)
      });
    } else {
      window.alert('Please specify a filter item.')
    }
  }
  // AJAX call to foursquare for the clicked venue item
  this.getMoreInfo = function (data) {
    var url = 'https://api.foursquare.com/v2/venues/';
    url += data.venue_id();
    url += '?' + $.param({
      'client_id': 'WJ5DDPCQKCPMKJGCNLJD3MI51APPH1HEYVFHLGI1KW4YN2QR',
      'client_secret': 'QKNGDVIC4CVANGWBLG2J5ONQNCUYLBIZH3DX2Z4DFL03LQ0P',
      'v': '20171101'
    });
    $.get(url)
      .done(function (results) {
        if (results.meta.code == 200) {
          var infoUrl = results.response.venue.canonicalUrl;
          window.open(infoUrl, '_blank');
        } else {
          window.alert('No page Found.')
        }
      })
      .fail(function (err) {
        window.alert('Something went wrong.');
      });
  }
}

ko.bindingHandlers.googleMapsAPI = {
  init: function (element, valueAccessor, allBindings, viewModel) {
    // Unwraps the value bound to the DOM
    var value = ko.unwrap(valueAccessor());
    // Create a searchbox in order to execute a places search
    var searchBox = new google.maps.places.SearchBox(
        document.getElementById('search-general'));
    // Bias the searchbox to within the bounds of the map.
    searchBox.setBounds(viewModel.map.getBounds());
    var largeInfowindow = new google.maps.InfoWindow();
    // Processes the location array to create an array of markers on initialize.
    for (var i = 0; i < value.length; i++) {
      marker = makeMarker();
      marker.setPosition(value[i].locations()[0]);
      marker.setTitle(value[i].name());
      marker.id = value[i].venue_id();
      // Push the marker to our observable array of markers.
      viewModel.favMarkersList.push(marker);
      // Create an onclick event to open the infowindow at each marker.
      marker.addListener('click', function() {
        populateInfoWindow(this, largeInfowindow);
        this.setIcon(makeMarkerIcon('FFFF24'));
      });
    }
    // Show result markers on the map
    showMarkers(viewModel.favMarkersList(), viewModel.map)
  }
}

// Display the markers on the maps
function showMarkers (markers, map) {
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);
}

// Hides the markers on the maps
function hideMarkers (markers) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

// Initialize a marker instance
function makeMarker() {
  var marker = new google.maps.Marker({
    animation: google.maps.Animation.DROP
  });
  return marker;
}

// Change the marker icon
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}

// Initialize an instance of infowindow when the marker is clicked.
function populateInfoWindow(marker, infowindow) {
  var url = 'https://api.foursquare.com/v2/venues/';
  url += marker.id;
  url += '?' + $.param({
    'client_id': 'WJ5DDPCQKCPMKJGCNLJD3MI51APPH1HEYVFHLGI1KW4YN2QR',
    'client_secret': 'QKNGDVIC4CVANGWBLG2J5ONQNCUYLBIZH3DX2Z4DFL03LQ0P',
    'v': '20171101'
  });
  // AJAX call to Foursquare API using the stored venue id in the marker
  // Returns JSON data about the venue
  $.get(url)
    .done(function (results) {
      var venue = results.response.venue;
      // Check to make sure the infowindow is not already opened
      if (infowindow.marker != marker) {
        // Clear the infowindow content
        infowindow.setContent('');
        infowindow.marker = marker;
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
          infowindow.marker = null;
          marker.setIcon(makeMarkerIcon('0091ff'));
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;
        // Sets streetview image
        function getStreetView(data, status) {
          var htmlStr = '';
          if (status == google.maps.StreetViewStatus.OK) {
            var nearStreetViewLocation = data.location.latLng;
            var heading = google.maps.geometry.spherical.computeHeading(
              nearStreetViewLocation, marker.position);
            // Set venue information within the infowindow
            htmlStr += `<div>${marker.title}</div><div id="pano"></div>`;
            htmlStr += `<div>${venue.location.address}</div>`;
            htmlStr += `<div>${venue.location.formattedAddress[1]}</div>`;
            htmlStr += `<div>${venue.contact.formattedPhone}</div>`;
            htmlStr += `<div>${venue.hours.status}</div>`;
            infowindow.setContent(htmlStr);
            var panoramaOptions = {
              position: nearStreetViewLocation,
              pov: {
                heading: heading,
                pitch: 15
              }
            };
            // Instance of the StreetView panorama
            var panorama = new google.maps.StreetViewPanorama(
              document.getElementById('pano'), panoramaOptions);
          } else {
            htmlStr +=`<div>${marker.title}</div><div>No StreetView was Found.</div>`;
            htmlStr += `<div>${venue.location.address}</div>`;
            htmlStr += `<div>${venue.location.formattedAddress[1]}</div>`;
            htmlStr += `<div>${venue.contact.formattedPhone}</div>`;
            htmlStr += `<div>${venue.hours.status}</div>`;
            infowindow.setContent(htmlStr);
          }
        }
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the clicked marker.
        infowindow.open(map, marker);
      }
    })
    .fail(function (err) {
      window.alert('Something went wrong.');
    });
}

ko.applyBindings(new ViewModel());
