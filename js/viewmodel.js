var init = function() {

    function ViewModel() {

        var self = this;
        //custom icon to replace default marker
        var custom_icon = 'ico/ico.png';

        //List of bars nearby
        self.bars = [
            {
                name: "Il Fornaio San Jose",
                lat: 37.3308907,
                lng: -121.8878925,
                icon: custom_icon,
                venue_id: '4a26bfc3f964a520d37e1fe3'
            }, {
                name: "Flames Eatery & Bar",
                lat: 37.3359807,
                lng: -121.8860979,
                icon: custom_icon,
                venue_id: '49eb8216f964a520e9661fe3'
            }, {
                name: "Temple Bar and Lounge",
                lat: 37.335234,
                lng: -121.889323,
                icon: custom_icon,
                venue_id: '5601a7a7498e5f3e462ea185'
            }, {
                name: "Haberdasher",
                lat: 37.3299927,
                lng: -121.8862924,
                icon: custom_icon,
                venue_id: '558e3ddc498ede18a43826cc'
            }, {
                name: "55 South",
                lat: 37.3351805,
                lng: -121.8899495,
                icon: custom_icon,
                venue_id: '509dbfa7e4b0f56d608ba241'
            }, {
                name: "Paper Plane",
                lat: 37.3350104,
                lng: -121.8895216,
                icon: custom_icon,
                venue_id: '53336ce5498e6ec45340b722'
            }
        ];

        /*-----------------------GOOGLE MAPS-----------------------*/
        //This location is set by default when map initialize
        self.defaultLocation = [37.3357001, -121.8879522];

        //Variables for tracking state of the marker animation and info window
        var bounce, infoWindowOpen;

        //Initializing empty array to store markers.
        self.markers = [];


        //creating literal with default coordinates of the google's object latlan
        self.defCoords = new google.maps.LatLng(self.defaultLocation[0], self.defaultLocation[1]);

        function setMap(coords) {
            var googleLatAndLong = coords;
            var bounds = new google.maps.LatLngBounds();
            var latLngBounds = bounds.extend(googleLatAndLong);

            //Object with map settings
            var mapOptions = {
                zoom: 15,
                center: googleLatAndLong,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                disableDefaultUI: true
            };

            //Container for the map
            var mapDiv = document.getElementById("mapDiv");
            var map = new google.maps.Map(mapDiv, mapOptions);


            //Listening for a resize event and makes map 'responsive' by centering it when resize event fires
            google.maps.event.addDomListener(window, "resize", function () {
                var center = map.getCenter();
                google.maps.event.trigger(map, "resize");
                map.setCenter(center);
            });

            return map;
        }


        //Intialize the map using the defaultLocation Google maps latlan object
        self.map = setMap(self.defCoords);
        self.infoWindow = new google.maps.InfoWindow();

        //Set markers
        function addMarker(map, latlong, title, content, icon) {
            var markerOptions = {
                position: latlong,
                map: map,
                title: title,
                animation: google.maps.Animation.DROP,
                clickable: true,
                icon: icon
            };

            var marker = new google.maps.Marker(markerOptions);
            google.maps.event.addListener(marker, "click", function () {
                //this function shows info window for clicked marker, fires ajax request on marker click and displays info in the info window
                self.showInfo(marker);
            });

            //disable bouncing on info window close
            google.maps.event.addListener(self.infoWindow, "closeclick", function () {
                disableAnimation();
                self.infoWindow.setContent(''); //removing info window content on its close event
            });

            function disableAnimation() {
                if (bounce) {
                    bounce.setAnimation(null)
                }
            }
            return marker;
        }

        //Toggle the info window for currently selected bar
        self.selectBar = function (bar) {
            for (var i = 0; i < self.markers.length; i++) {
                if (bar.name == self.markers[i].title) {
                    toggleInfoWindow(i);
                }
            }
        }.bind(this);

        //toggle info window for a particular bar
        function toggleInfoWindow(id) {
            google.maps.event.trigger(self.markers[id], 'click');
        }

        //Initialize google map
        self.initMap = function (data) {
            for (var i = 0; i < data.length; i++) {
                var location = data[i];
                var googleLatAndLong = new google.maps.LatLng(location.lat, location.lng);
                var windowContent = location.name;
                //Create and add markers to map
                var marker = addMarker(self.map, googleLatAndLong, location.name, windowContent, location.icon);
                //Add marker to data self
                self.markers.push(marker);
            }
        };

        //Search query observable
        self.query = ko.observable("");

        //Observable to display an error message if Foursqure fails to load (hidden by default)
        self.foursquareErrorMsg = ko.observable("hidden");

        //Computed observable tp handle search
        self.filteredBars = ko.computed(function () {

            //hide all markers
            for (var i = 0; i < self.markers.length; i++) {
                self.markers[i].setVisible(false);
            }

            //search criteria, case insensitive
            var filter = this.query().toLowerCase();
            return self.bars.filter(function (item, index, array) {
                //search for matches
                if (item.name.toLowerCase().indexOf(filter) > -1) {
                    //show marker for matched item
                    if (typeof self.markers[index] !== 'undefined') {
                        self.markers[index].setVisible(true)
                    }
                    return item;
                }
            });
        }, this);

        //Forsquare tokens
        var CLIENT_ID = "S25E3SSGPYUPISXYCYUMYV0SSQPYOLWRJNG21JGNBGRFQQ0Y";
        var CLIENT_SECRET = "SS1NVHDU2Q5GGAFZJV0RM2BRANSJTJEGXHG1QB54ETDYG1KI";

        self.showInfo = function (placeItem) {
            toggleBounce();
            self.infoWindow.close();
            self.infoWindow.open(self.map, placeItem);
            var id; //venue id of the bar
            var infoWindowString; //string to be put into the info window

            //get venue id of the bar by its name
            self.bars.forEach(function (val) {
                if (val.name == placeItem.title) {
                    id = val.venue_id;
                }
            });
            //FS API call
            $.ajax({
                url: 'https://api.foursquare.com/v2/venues/' + id + '?client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&v=20150909',
                data: {
                    format: 'json'
                },
                //Display caption 'Loading...' until info window data is fetched
                beforeSend: function () {
                    self.infoWindow.setContent('Loading....')
                },
                //Error handling
                error: function () {
                    self.foursquareErrorMsg("show")
                },
                dataType: 'jsonp',
                //Building a string to be displayed in the info window
                success: function (data) {
                    infoWindowString = "<p class='text-center'><strong><a class='name ' href='" +
                        data.response.venue.canonicalUrl +
                        "'>" +
                        data.response.venue.name +
                        "</a></strong></p>" +
                        "<p>"
                        + data.response.venue.location.address +
                        "</p><p><span class='label lbl-custom label-success'><strong>" +
                        data.response.venue.rating +
                        "</strong><sup> / 10</sup></span>" +
                        "<span class='label lbl-custom label-info'>" +
                        data.response.venue.categories[0].name +
                        "</span><span class='label lbl-custom label-primary'>"
                        + data.response.venue.hereNow.count +
                        " people checked-in now</span></p>" +
                        "<img src='" + data.response.venue.photos.groups[0].items[0].prefix + "250x100" +
                        data.response.venue.photos.groups[0].items[0].suffix + "'</img>";
                    //put string into the info window
                    self.infoWindow.setContent(infoWindowString);
                },
                type: 'GET'
            });

            function toggleBounce() {
                if (bounce) {
                    bounce.setAnimation(null);
                }
                if (bounce != placeItem) {
                    placeItem.setAnimation(google.maps.Animation.BOUNCE);
                    bounce = placeItem;
                } else {
                    bounce = null;
                }
            }
        };

        //Initialize the map with the bars and foursquare data
        self.initMap(self.bars)
    }


    var ViewModel = new ViewModel();

//initialize knockout
    ko.applyBindings(ViewModel);
};