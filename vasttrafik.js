Module.register("vasttrafik", {
	defaults: {
		// departure: ["brunnsparken, Göteborg"], //9021014004490000
		departure: [], //9021014004490000
		// arrival: {"Axel Dahlströms Torg, Göteborg":"Korsvägen, Göteborg"},
		updateInterval: 120000,
		baseURL: "https://api.vasttrafik.se/",
		apiBaseUrl: "bin/rest.exe/",
		apiVersion: "v2/",
		apiKey: "CYxuPgXNNTm_PzLdRK_RR4G91fIa",
		apiSecret: "BlVjOg9xzqZ9aW1iQ_w0HnXL918a",
		showAccessibility: true,
		rotationPeriod: 10000,
		rotateTimeTable: true,
	},

	start: function() {
		let path = this.config.apiBaseUrl + this.config.apiVersion;
		this.loaded = false;
		this.stationsToShow = this.getStationsToShow();
		Log.log(this.stationsToShow);
		this.tripData = {};
		this.stations = {};
		this.rotateIndex = null;
		this.apiUrls = {
			token: {
				url: "token",
				type: "POST"
			},
			station: {
				url: path + "location.name?",
				type: "GET"
			},
			departure: {
				url: path + "departureBoard?",
				type: "GET"
			},
			arrival: {
				url: path + "arrivalBoard?",
				type: "GET"
			},
		};
		this.iconset = this.getIconset();
		this.getAccessToken();

		let self = this;
		setInterval(function() {
			self.getAccessToken();
		}, this.config.updateInterval);

	},

	getDom: function() {
		let wrapper = document.createElement("div");
		if (Object.keys(this.tripData).length === 0) {
			wrapper.innerHTML = this.iconset.spinner;
			return wrapper;
		}

		if (!this.config.rotateTimeTable) {
			for (let stationName in this.tripData) {
				this.renderTimeTable(wrapper, stationName);
			}
		} else {
			let stationName = this.stationsToShow[this.rotateIndex];
			if (stationName in this.tripData) {
				this.renderTimeTable(wrapper, stationName);
			}
		}
		return wrapper;
	},

	getStyles: function () {
		return [
			"font-awesome.css",
			"vasttrafik.css",
		];
	},

	getScripts: function() {
		return [];
	},

	getIconset: function() {
		return {
			BUS: "<i class='fa fa-bus'></i>",
			TRAM: "<i class='fa fa-train'></i>",
			REG: "<i class='fa fa-train'></i>",
			BOAT: "<i class='fa fa-ship'></i>",
			wheelChair: "<i class='fa fa-wheelchair'></i>",
			spinner: "<i class='fas fa-sync'> Fetching data...</i>",
		};
	},

	renderTimeTable: function(wrapper, stationName) {
		let table = document.createElement("table");
		table.className = "small";

		this.createModuleTitle(wrapper, stationName);
		this.createTableHeader(table);
		Log.log("stationName:");
		Log.log(stationName);
		for (let trips of this.tripData[stationName]) {
			for (let trip of trips) {
				this.fillTable(trip, table);
			}
		}
		wrapper.appendChild(table);
	},

	createModuleTitle: function(wrapper, stationName) {
		let title = document.createElement("div");
		title.innerHTML = stationName + " departure:";
		title.className = "title";
		wrapper.appendChild(title);
	},

	createTableHeader: function(table) {
		let row = document.createElement("tr");
		let headers = ["", "Line", "Direction", "Track", "Time"];
		if (this.config.showAccessibility) {
			headers.unshift("");
		}
		for (let header of headers) {
			let cell = document.createElement("th");
			cell.align = "center";
			cell.innerHTML = header;
			row.appendChild(cell);
		}
		table.appendChild(row);
	},

	fillTable: function(data, table) {
		let row = document.createElement("tr");
		row.innerHTML = `
			<td align="center">${this.iconset[data.type]}</td>
			<td align="center">${data.sname}</td>
			<td align="center">${data.direction}</td>
			<td align="center">${data.track}</td>
			<td align="center">${data.time}</td>
		`;
		if (this.config.showAccessibility){
			row.children[0].insertAdjacentHTML("afterend",
				`<td align="center">${this.iconset[data.accessibility] || ""}</td>`
			);
		}
		table.appendChild(row);
	},

	startRotation: function() {
		let self = this;
		this.rotateIndex = -1;
		setInterval(function() {
			Log.log("inside startRotation interval");
			self.rotateIndex = (self.rotateIndex + 1) % self.stationsToShow.length;
			self.updateDom(1000);
		}, this.config.rotationPeriod);
	},

	getStationsToShow: function() {
		let notUnique = this.config.departure.concat(Object.keys(this.config.arrival));
		return notUnique.filter((elem, pos, arr) => arr.indexOf(elem) == pos);
	},

	getAccessToken: function() {
		let self = this;
		let auth = "Basic " + btoa(this.config.apiKey+":"+this.config.apiSecret);
		let req = this.getReqObj("token", auth, "")
		req.onreadystatechange = function () {
			if (this.readyState == XMLHttpRequest.DONE) {
				switch (this.status) {
				case 200:
					self.authData = JSON.parse(this.response);
					if (!self.loaded) {
						self.getStationsId();
					} else {
						self.getDepartureData();
					}
					break;
				case 401:
					Log.error(self.name + ": Incorrect Key or Secret");
					break;
				default:
					Log.error(self.name + ": Cannot connect to Vastrafik server");
				}
			}
		};
		req.send("grant_type=client_credentials&scope=device123111");
	},

	getStationsId: function() {
		let auth = "Bearer " + this.authData.access_token;
		for (let station of this.config.departure) {
			this.requestSationsId(auth, station, "departure");
		}
		for (let fromStation in this.config.arrival) {
			Log.log("fromStation: " + fromStation);
			Log.log("toStation: " + this.config.arrival[fromStation]);
			this.requestSationsId(auth, fromStation, "arrival");
			this.requestSationsId(auth, this.config.arrival[fromStation], "arrival", fromStation);
		}
	},

	requestSationsId: function(auth, station, stationType, fromStation) {
		let self = this;
		let param = this.getString({
			input: station,
			format: "json"
		});
		let req = this.getReqObj("station", auth, param);
		req.onreadystatechange = function(){
			if (this.readyState == XMLHttpRequest.DONE) {
				switch (this.status) {
				case 200:
					let res = JSON.parse(this.response);
					let stationInfo = (res.LocationList.StopLocation)[0];
					// using the first station in the list as the target
					self.stations[station] = stationInfo.id;
					if (stationType === "arrival") {
						let fStation = (fromStation) ? fromStation : station;
						let tStation = (fromStation) ? station : self.config.arrival[station];
						if ((fStation in self.stations) && (tStation in self.stations)) {
							self.getArrivalData(fStation, tStation);
						}
					}else {
						self.getDepartureData(station);
					}
					break;
				default:
					Log.error(self.name + ": Can not get Station ID --> "+ this.status);
				}
			}
		};
		req.send();
	},

	getDepartureData: function(stationName) {
		let self = this;
		let param = this.getString(Object.assign({
			id: this.stations[stationName],
			format: "json"
		}, this.getDateParam));
		let auth = "Bearer " + this.authData.access_token;
		let req = this.getReqObj("departure", auth, param);
		req.onreadystatechange = function(){
			if (this.readyState == XMLHttpRequest.DONE) {
				switch (this.status) {
				case 200:
					if (!(stationName in self.tripData)) {
						self.tripData[stationName] = [];
					}
					self.tripData[stationName].push((JSON.parse(this.response)).DepartureBoard.Departure);
					if (self.config.rotateTimeTable) {
						if (self.rotateIndex === null) {
							self.startRotation();
						}
					} else {
						self.updateDom(1000);
					}
					break;
				default:
					Log.error(self.name + ": Can not get DEPARTURE data --> "+ this.status);
				}
			}
		};
		req.send();
	},

	getArrivalData: function(fromStation, toStation) {
		let self = this;
		let param = this.getString(Object.assign({
			id: this.stations[fromStation],
			direction: this.stations[toStation],
			format: "json"
		}, this.getDateParam()));
		let auth = "Bearer " + this.authData.access_token;
		let req = this.getReqObj("arrival", auth, param);
		req.onreadystatechange = function(){
			if (this.readyState == XMLHttpRequest.DONE) {
				switch (this.status) {
				case 200:
					if (!(fromStation in self.tripData)) {
						self.tripData[fromStation] = [];
					}
					self.tripData[fromStation].push((JSON.parse(this.response)).ArrivalBoard.Arrival);
					if (self.config.rotateTimeTable) {
						if (self.rotateIndex === null) {
							self.startRotation();
						}
					} else {
						self.updateDom(1000);
					}
					break;
				default:
					Log.error(self.name + ": Can not get ARRIVAL data --> "+ this.status);
				}
			}
		};
		req.send();
	},

	getDateParam: function() {
		let datetime = new Date();
		return {
			date: datetime.getUTCFullYear() + "-" + (datetime.getUTCMonth()+1) + "-" + datetime.getUTCDate(),
			time: encodeURIComponent(datetime.toTimeString().split(" ")[0])
		}
	},
	// helper function to create the request object
	 getReqObj: function(type, auth, param) {
	 	let info = this.apiUrls[type];
	 	let req = new XMLHttpRequest();
		let url = this.config.baseURL + info.url + param
		req.open(info.type, url, true);
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.setRequestHeader("Authorization", auth);
		return req;
	},

	// convert an object to string in url style: {a: 1,b:2 } => a=1&b=2
	getString: function(param) {
		return Object.entries(param).map(([key, val]) => `${key}=${val}`).join("&");
	}
});