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
		},{
			name: "Flames Eatery & Bar",
			lat: 37.3359807,
			lng: -121.8860979,
			icon: custom_icon,
			venue_id: '49eb8216f964a520e9661fe3'
		},{
			name: "Temple Bar and Lounge",
			lat: 37.335234,
			lng: -121.889323,
			icon: custom_icon,
			venue_id: '5601a7a7498e5f3e462ea185'
		},{
			name: "Haberdasher",
			lat: 37.3299927,
			lng:  -121.8862924,
			icon: custom_icon,
			venue_id: '558e3ddc498ede18a43826cc'
		},{
			name: "55 South",
			lat: 37.3351805,
			lng:  -121.8899495,
			icon: custom_icon,
			venue_id: '509dbfa7e4b0f56d608ba241'
		},{
			name: "Paper Plane",
			lat: 37.3350104,
			lng: -121.8895216,
			icon: custom_icon,
			venue_id: '53336ce5498e6ec45340b722'
		}
	];

	/*-----------------------GOOGLE MAPS-----------------------*/
	//This location is set by default when map initialize
	self.defaultLocation = [37.3357001,-121.8879522];

	//Variables for tracking state of the marker animation and info window
	var bounce, infoWindowOpen;

	//Initializing empty arrays to store info windows and markers.
	self.infoWindows = [];
	self.markers = [];





	//creating literal with default coordinates of the google's object latlan
	self.defCoords = new google.maps.LatLng(self.defaultLocation[0],self.defaultLocation[1]);

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
		google.maps.event.addDomListener(window, "resize", function() {
			var center = map.getCenter();
			google.maps.event.trigger(map, "resize");
			map.setCenter(center);
		});

		return map;
	}


	//Intialize the map using the defaultLocation Google maps latlan object
	self.map = setMap(self.defCoords);

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
		marker.addListener('click', toggleBounce);

		var infoWindowOptions = {
			content: content,
			position: latlong
		};

		var infoWindow = new google.maps.InfoWindow(infoWindowOptions);
		self.infoWindows.push(infoWindow);

		google.maps.event.addListener(marker, "click", function() {
			if (infoWindowOpen) infoWindowOpen.close();
			infoWindowOpen = infoWindow;
			infoWindow.open(map, marker);
		});

		//disable bouncing on info window close
		google.maps.event.addListener(infoWindow, "closeclick", disableAnimation);

		function disableAnimation() {
			if(bounce){bounce.setAnimation(null)}
		}

		//Toggling bouncing of the markers
		function toggleBounce() {
			if (bounce) {
				bounce.setAnimation(null);
			}
			if (bounce != marker) {
				marker.setAnimation(google.maps.Animation.BOUNCE);
				bounce = marker;
			} else {
				bounce = null;
			}
		}

		return marker;
	}

	//Toggle the info window for currently selected bar
	self.selectBar = function(bar) {
		for (var i = 0; i < self.markers.length; i++) {
			if (bar == self.markers[i].title) {
				toggleInfoWindow(i);
			}
		}
	}.bind(this);

	//toggle info window for a particular bar
	function toggleInfoWindow(id) {
		google.maps.event.trigger(self.markers[id], 'click');
	}

	//Initialize google map
	self.initMap = function(data) {
		for (var i = 0; i < data.length; i++) {
			var location = data[i];
			var googleLatAndLong = new google.maps.LatLng(location.lat,location.lng);
			var windowContent = location.name;
			//Create and add markers to map
			var marker = addMarker(self.map, googleLatAndLong, location.name, windowContent, location.icon);
			//Add marker to data self
			self.markers.push(marker);
		}
	};

	//HTML string to fill info window with Forsquare data.
	var infoWindowString = '';
	self.infoWindowsStrings = [];


    //Search query observable
    self.query = ko.observable("");

    //Observable to display an error message if Foursqure fails to load (hidden by default)
    self.foursquareErrorMsg = ko.observable("hidden");



    //Pushing names of the bars to the array and then to the observable array in order to be able to search
    self.barsList = function() {
	    self.searchResultsList = [];
	    self.searchList = [];
	    for (i = 0; i < self.bars.length; i++) {
	    	var bar = self.bars[i].name;
	    	self.searchResultsList.push(bar);
	    	self.searchList.push(bar.toLowerCase()); //case insensitive search
	    }
	    //put bars to the observable array in order to populate view
	    self.results = ko.observableArray(self.searchResultsList.slice(0));
	};

	//Initialize the list with hard-coded bars
	self.barsList();


	//Search for bars according to the user query if it is not empty.
	self.searchBars = function() {
		//Empties the results and adds the result that matches the query
		self.results.removeAll();
		//Hides the markers, sets markers to visible for found bars
		for (var i = 0; i < self.markers.length; i++) {
			self.markers[i].setVisible(false);
		}
		self.searchList.forEach(function (item, index, array) {
			if (item.indexOf(self.query().toLowerCase()) > -1) {
				self.results.push(self.searchResultsList[index]);
				self.markers[index].setVisible(true);
			}
		});

			//sets all bars to visible if query is empty
			if (self.query() === '') {
				self.results(self.searchResultsList.slice(0));
				self.markers.forEach(function (item, index, array) {
					if (!item.getVisible()) {
						item.setVisible(true);
					}
				});
			}

	}.bind(this);

	//Resets users query, markers, map, bars
	self.reset = function() {
		self.query('');
		if (infoWindowOpen){
			infoWindowOpen.close();
		}
		if (bounce) {
			bounce.setAnimation(null);
		}
		self.searchBars();
		self.map.panTo(self.defCoords);
		self.map.setZoom(15);
	};

	//Show error message if Foursquare is not loaded after 5 secs
	self.foursquareTimer = setTimeout(function() {
		self.foursquareErrorMsg("show");
	}, 5000);

	//Forsquare tokens
	var CLIENT_ID = "23ZBVKL12XL44XDMPUJZFHNY2ZHSQTNGCMOAFJ0HTHC1EG3S";
	var CLIENT_SECRET = "E3PEPIVQ4TAE00V5CGRGB3PEO2CS5TMH4YM14EKJN4L5BALN";

	//API call
	self.fetchBarsData = function() {
	  for (var i=0; i<self.bars.length; i++) {
		  var url = "https://api.foursquare.com/v2/venues/"+ self.bars[i].venue_id+ "?client_id="+ CLIENT_ID+ "&client_secret="+ CLIENT_SECRET+ "&v=20150909&callback=ViewModel.success";
		  var script = document.createElement("script");
		  $(script).attr("src", url);
		  $(script).attr("id", "foursquare");
		  //if script loads clear timeout in order to not display an error msg.
		  script.onload = function (e) {
			  clearTimeout(self.foursquareTimer);
		  };
		  //check if foursquare script included, if so then replace it by a new one in order to check if it loads
		  var _script = document.getElementById("foursquare");
		  var head = document.getElementsByTagName("head")[0];
		  if (_script === null) {
		    head.appendChild(script);
		  } else {
		    head.replaceChild(script, _script);
		  }
	  }
	};

	/*self.loadGoogleScript = function(){
		var script = document.createElement("script");
		$(script).attr("type", "text/javascript");
		$(script).attr("id", "google");
		script.onload = function(event){
			clearTimeout(self.googleTimer);
		}
		script.src = "http://maps.googleapis.com/maps/api/js?sensor=false";
		var _script = document.getElementById("google");
		var head = document.getElementsByTagName("head")[0];
		if (_script === null) {
			head.appendChild(script);
		} else {
			head.replaceChild(script, _script);
		}
	}*/

	//Populate the info windows with information fetched from the Foursquare
	self.success = function(data) {
	  	self.infoWindows.forEach(function (item, index, array) {
	  		if (item.content == data.response.venue.name) {
	  			infoWindowString = "<p class='text-center'><strong><a class='name ' href='"+
					data.response.venue.canonicalUrl+
					"'>"+
					data.response.venue.name+
					"</a></strong></p>"+
					"<p>"
					+data.response.venue.location.address+
					"</p><p><span class='label lbl-custom label-success'><strong>"+
					data.response.venue.rating+
					"</strong><sup> / 10</sup></span>"+
					"<span class='label lbl-custom label-info'>"+
					data.response.venue.categories[0].name+
					"</span><span class='label lbl-custom label-primary'>"
					+data.response.venue.hereNow.count+
					" people checked-in now</span></p>"+
					"<img src='"+data.response.venue.photos.groups[0].items[0].prefix+ "250x100"+
					data.response.venue.photos.groups[0].items[0].suffix+ "'</img>";
	  			item.setContent(infoWindowString);
	  		}
	  	});

	};


	//call foursquare api to get data
	self.fetchBarsData(self.bars);

	//Initialize the map with the bars and foursquare data
	self.initMap(self.bars);
}

var ViewModel = new ViewModel();
//ko.options.useOnlyNativeEvents = true;

//reset map, user query and etc. on click "x" symbol in the input box
$('#search').on('input', function(e) {
	if('' == this.value) {
		ViewModel.reset();
	}
});

//initialize knockout
ko.applyBindings(ViewModel);
