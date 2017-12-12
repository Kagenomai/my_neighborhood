/**
* @constructor Processes location into observables for the ViewModel
* @param location (object) initial locations
*/
var Location = function (location) {
  this.name = ko.observable(location.name);
  this.locations = ko.observableArray(location.location);
  this.shortAddress = ko.observable(location.address1);
  // Returns the full address
  this.fullAddress = ko.computed(function() {
    return location.address1 + ' ' + location.address2
  });
  this.venue_id = ko.observable(location.foursquare_id);
}
// Google Maps API callback function
function initMap() {
  /**
  * @constructor Handle all data flow between model and view
  */
  var ViewModel = function () {
    var self = this;
    // Get map DOM element
    self.mapDiv = document.getElementById('map')
    // Constructor creates a new map
    self.map = new google.maps.Map(this.mapDiv, {
      center: {lat: 32.715738, lng: -117.1610838},
      zoom: 13,
      mapTypeControl: false
      });
    self.infowindow = new google.maps.InfoWindow();
    //Create instances observables for the Location List
    self.locationList = ko.observableArray([]);
    self.initialSearch = ko.observableArray([]);
    self.searchLocationsList = ko.observableArray([]);
    // Add locations to obsevables
    locations.forEach((location) => {
      self.locationList.push(new Location(location));
    });
    self.isVisible = ko.observable(false);
    self.showSidebar = function () {
      self.isVisible(!self.isVisible());
      if (self.isVisible() === true) {
        $('#map').css('left','362px');
      } else {
        $('#map').css('left','90px');        
      }
    }
    // Sets which list to show after a filter
    self.getList = ko.pureComputed(function () {
      return this.searchLocationsList() != '' ? this.searchLocationsList() : this.locationList()
    }, this);
    // Init markers upon map load
    self.favMarkersList = ko.observableArray([]);
    // Markers from the generalSearch
    self.searchMarkersList = ko.observableArray([]);
    // Gets value of the searchBox
    self.searchBox = ko.observable();
    self.filterBox = ko.observable();
    /**
    * @description General search for location via Foursquare API
    * @param data (object) contains the data from the binding context of the viewModel
    * @param event (object) DOM element
    */
    self.generalSearch = function (data, event) {
      hideMarkers(
        self.searchMarkersList() != '' ? self.searchMarkersList() : self.favMarkersList()
      );
      var map = data.map;
      var bounds = map.getBounds();
      var searchMarkersList = data.searchMarkersList();
      // Gets value of the searchBox
      var searchAreaBox = data.searchBox();
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
          /**
          * @description AJAX call to Foursquare
          * @param url (string) API call url
          * @return results (object) response JSON of venue search results
          */
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
                var infowindow = self.infowindow;
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
                  var self = this;
                  // Create an onclick event to open the infowindow at each marker
                  populateInfoWindow(this, infowindow);
                  self.setAnimation(google.maps.Animation.BOUNCE);
                  self.setIcon(makeMarkerIcon('FFFF24'));
                  setTimeout(function () {
                    self.setAnimation(null);
                    self.setIcon('');
                  }, 1400)
                });
                map.addListener('center_changed', function() {
                  window.setTimeout(function() {
                    map.panTo(marker.getPosition());
                  }, 3000);
                });
                map.setZoom(13);
              }
            } else {
              window.alert('No results found. Please specify more details.');
            }
        })
        .fail(function (err) {
          window.alert('Something went wrong.');
        });
      }
    }
    /**
    * @description Filters through locationList
    * @param data (object) contains the data from the binding context of the viewModel
    * @param event (object) DOM element
    */
    self.filterList = function (data, event) {
      hideMarkers(
        self.searchMarkersList() != '' ? self.searchMarkersList() : self.favMarkersList()
      );
      var locationList = self.searchLocationsList() != '' ? self.searchLocationsList() : self.locationList();
      var markersList = self.searchMarkersList() != '' ? self.searchMarkersList() : self.favMarkersList();
      var filterBox = self.filterBox();
      // Checks to see if an alphabet has been entered
      if (/[a-zA-Z]/.test(filterBox)) {
        self.initialSearch.removeAll();
        // Filters list to partial match of entered item
        var results = locationList.filter((item) => {
          self.initialSearch.push(item);
          return item.name().toLowerCase().indexOf(filterBox.toLowerCase()) > -1
        });
        data.searchLocationsList.removeAll();
        results.forEach((location) => {
          // Filters marker list to match results
          var marker = markersList.filter((item) => {
             return item.title.toLowerCase().indexOf(location.name().toLowerCase()) > -1
          });
          for (var i = 0; i < marker.length; i++) {
              marker[i].setMap(data.map);
          }
          data.searchLocationsList.push(location)
        });
      }
      if (filterBox == '') {
        if (data.searchLocationsList() != '' && self.searchMarkersList() != '') {
          data.searchLocationsList.removeAll();
          self.initialSearch().forEach((item) => {
            data.searchLocationsList.push(item);
          });
          showMarkers(self.searchMarkersList(), self.map)
        } else if (data.searchLocationsList() != '' && self.searchMarkersList() == '') {
          data.searchLocationsList.removeAll();
          showMarkers(self.favMarkersList(), self.map)
        }
      }
    }
    /**
    * @description AJAX call to foursquare for the clicked venue item
    * @param data (object) contains the data from the binding context of the Location data
    * @param event (object) DOM element
    */
    self.getMoreInfo = function (data, event) {
      var markersList = self.searchMarkersList() != '' ? self.searchMarkersList() : self.favMarkersList();
      var infowindow = self.infowindow;
      // Filters marker list to match DOM element data
      var marker = markersList.filter((item) => {
         return item.title.toLowerCase().indexOf(data.name().toLowerCase()) > -1
      });
      marker[0].setAnimation(google.maps.Animation.BOUNCE);
      marker[0].setIcon(makeMarkerIcon('FFFF24'));
      setTimeout(function () {
        marker[0].setAnimation(null);
        marker[0].setIcon('');
      }, 1400)
      populateInfoWindow(marker[0], infowindow);
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
      var infowindow = viewModel.infowindow;
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
          var self = this;
          // Set infowindow information
          populateInfoWindow(this, infowindow);
          self.setAnimation(google.maps.Animation.BOUNCE);
          self.setIcon(makeMarkerIcon('FFFF24'));
          setTimeout(function () {
            self.setAnimation(null);
            self.setIcon('');
          }, 1400)
        });
      }
      // Show result markers on the map
      showMarkers(viewModel.favMarkersList(), viewModel.map)
    }
  }
  ko.applyBindings(new ViewModel());
}
// Google Map API error callback
function googleError () {
  window.alert('Google Maps could not be loaded.');
}
/**
* @description Display the markers on the maps
* @param markers (object) Map markers to set on map
* @param map (object) Map
*/
function showMarkers (markers, map) {
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);
}

/**
* @description Hides the markers on the maps
* @param markers (object) Map markers to set on map
*/
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

/**
* @description Change the marker icon
* @param markerColor (string) Color Hex number
* @return markerImage (image) Marker icon
*/
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

/**
* @description Initialize an instance of infowindow when the marker is clicked
* @param marker (object) Map marker to set an infowindow on
* @param infowindow (object) infowindow instance
*/
function populateInfoWindow(marker, infowindow) {
  var url = 'https://api.foursquare.com/v2/venues/';
  url += marker.id;
  url += '?' + $.param({
    'client_id': 'WJ5DDPCQKCPMKJGCNLJD3MI51APPH1HEYVFHLGI1KW4YN2QR',
    'client_secret': 'QKNGDVIC4CVANGWBLG2J5ONQNCUYLBIZH3DX2Z4DFL03LQ0P',
    'v': '20171101'
  });
  /**
  * @description AJAX call to Foursquare API using the marker id
  * @param url (string) API call url
  * @return results (object) response JSON of venue search results
  */
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
          marker.setIcon('');
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;
        /**
        * @description Sets streetview image
        * @param data (object) Marker info
        * @param status (object) StreetViewStatus
        */
        function getStreetView(data, status) {
          var htmlStr = '';
          if (status == google.maps.StreetViewStatus.OK) {
            var nearStreetViewLocation = data.location.latLng;
            var heading = google.maps.geometry.spherical.computeHeading(
              nearStreetViewLocation, marker.position);
            // Set venue information within the infowindow
            htmlStr += `<div>${marker.title}</div><div id="pano"></div>`;
            if (venue.location.address) {
              htmlStr += `<div>${venue.location.address}</div>`;
            }
            if (venue.location.formattedAddress[1]) {
              htmlStr += `<div>${venue.location.formattedAddress[1]}</div>`;
            }
            if (venue.contact.formattedPhone) {
              htmlStr += `<div>${venue.contact.formattedPhone}</div>`;
            }
            if (venue.hours) {
              htmlStr += `<div>${venue.hours.status}</div>`;
            }
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
            if (venue.location.address) {
              htmlStr += `<div>${venue.location.address}</div>`;
            }
            if (venue.location.formattedAddress[1]) {
              htmlStr += `<div>${venue.location.formattedAddress[1]}</div>`;
            }
            if (venue.contact.formattedPhone) {
              htmlStr += `<div>${venue.contact.formattedPhone}</div>`;
            }
            if (venue.hours) {
              htmlStr += `<div>${venue.hours.status}</div>`;
            }
            infowindow.setContent(htmlStr);
          }
        }
        // Use streetview service to get the closest streetview image within the parameter of the radius
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the clicked marker.
        infowindow.open(map, marker);
      }
    })
    .fail(function (err) {
      window.alert('Something went wrong.');
    });
}
