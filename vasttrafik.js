Module.register("vasttrafik", {
	defaults: {
		station: "brunnsparken, Göteborg", //9021014004490000
		updateInterval: 120000,
		baseURL: "https://api.vasttrafik.se/",
		apiBaseUrl: "bin/rest.exe/",
		apiVersion: "v2/",
		apiKey: "CYxuPgXNNTm_PzLdRK_RR4G91fIa",
		apiSecret: "BlVjOg9xzqZ9aW1iQ_w0HnXL918a"
	},

	start: function() {
		let path = this.config.apiBaseUrl + this.config.apiVersion;
		this.departureData = null;
		this.stationId = null;
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
		this.iconset = {
			BUS: "<i class='fa fa-bus'></i>",
			TRAM: "<i class='fa fa-train'></i>",
			BOAT: "<i class='fa fa-ship'></i>",
			wheelChair: "<i class='fa fa-wheelchair'></i>",
			spinner: "<i class='fas fa-sync'> Fetching data...</i>",
		};
		this.getAccessToken();

		let self = this;
		setInterval(function() {
			self.getAccessToken();
		}, this.config.updateInterval)
	},

	getDom: function() {
		let wrapper = document.createElement("div");
		if (this.departureData == null) {
			wrapper.innerHTML = this.iconset.spinner;
			return wrapper;
		}
		Log.log(this.departureData);
		Log.log(this.config.showAccessibility);
		this.createModuleTitle(wrapper);

		let table = document.createElement("table");
		table.className = "small";
		this.createTableHeader(table);

		for (let i=0; i < this.departureData.length; i++) {
			this.fillTable(this.departureData[i], table);
		}
		wrapper.appendChild(table);
		return wrapper;
	},

	getStyles: function () {
		return [
			"font-awesome.css",
			"vasttrafik.css",
		];
	},

	createModuleTitle: function(wrapper) {
		let title = document.createElement("div");
		title.innerHTML = this.station + " departure:";
		title.className = "title";
		wrapper.appendChild(title);
	},

	createTableHeader: function(table) {
		let row = document.createElement("tr");
		let headers = ["", "Line", "Direction", "Track", "Time"];
		if (this.config.showAccessibility) {
			headers.unshift("");
		}
		for (let i = 0; i < headers.length; i++) {
			let cell = document.createElement("th");
			cell.align = "center";
			cell.innerHTML = headers[i];
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

	getAccessToken: function() {
		let self = this;
		let auth = "Basic " + btoa(this.config.apiKey+":"+this.config.apiSecret);
		let req = this.getReqObj("token", auth, "")
		req.onreadystatechange = function () {
			if (this.readyState == XMLHttpRequest.DONE) {
				switch (this.status) {
				case 200:
					self.authData = JSON.parse(this.response);
					if (self.stationId === null) {
						self.getStationId();
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

	getStationId: function() {
		let self = this;
		let param = this.getString({
			input: this.config.station,
			format: "json"
		});
		let auth = "Bearer " + this.authData.access_token;
		let req = this.getReqObj("station", auth, param);
		req.onreadystatechange = function(){
			if (this.readyState == XMLHttpRequest.DONE) {
				switch (this.status) {
				case 200:
					let res = JSON.parse(this.response);
					// using the first station in the list as the target
					let stationInfo = (res.LocationList.StopLocation)[0];
					self.station = stationInfo.name;
					self.stationId = stationInfo.id;
					self.getDepartureData();
					break;
				default:
					Log.error(self.name + ": Can not get Station ID --> "+ this.status);
				}
			}
		};
		req.send();
	},

	getDepartureData: function() {
		let self = this;
		let datetime = new Date();
		let param = this.getString({
			id: this.stationId,
			date: datetime.getUTCFullYear() + "-" + (datetime.getUTCMonth()+1) + "-" + datetime.getUTCDate(),
			time: encodeURIComponent(datetime.toTimeString().split(" ")[0]),
			format: "json"
		});
		let auth = "Bearer " + this.authData.access_token;
		let req = this.getReqObj("departure", auth, param);
		req.onreadystatechange = function(){
			if (this.readyState == XMLHttpRequest.DONE) {
				switch (this.status) {
				case 200:
					self.departureData = (JSON.parse(this.response)).DepartureBoard.Departure;
					self.updateDom(1000);
					break;
				default:
					Log.error(self.name + ": Can not DEPARTURE --> "+ this.status);
				}
			}
		};
		req.send();
	},

	getReqObj: function(type, auth, param) {
		let info = this.apiUrls[type];
		let req = new XMLHttpRequest();
		let url = this.config.baseURL + info.url + param
		req.open(info.type, url, true);
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.setRequestHeader("Authorization", auth);
		return req;
	},

	getString: function(param) {
		return Object.entries(param).map(([key, val]) => `${key}=${val}`).join("&");
	}
});