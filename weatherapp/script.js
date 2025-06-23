const wAPIkey = "995b626f8e1404b00d411fb5a4e1eff0"; // do not care, it is free anyway

const curWeather = {
    cityInput: document.getElementById("cityInput"),
    dateCUR: document.getElementById("dateCUR"),
    tempCUR: document.getElementById("tempCUR"),
    realfeelCUR: document.getElementById("realfeelCUR"),
    
    sunriseCUR: document.getElementById("sunriseCUR"),
    sunsetCUR: document.getElementById("sunsetCUR"),
    durationCUR: document.getElementById("durationCUR"),
    skyCUR: document.getElementById("skyCUR"),
    iconCUR: document.getElementById("iconCUR"),
};

const hourlyWeather = {
    tableBody: document.getElementById("hourlyTableBody"),
}

const nearbyPlaces = {
    nearbyPlacesTable: document.getElementById("nearbyPlacesTable"),
    tableBody: document.getElementById("nearbyPlacesTableBody"),
};

const navigation = {
    buttonToday: document.getElementById("today"),
    button5day: document.getElementById("5-day"),
}

const forecast5days = {
    table5days: document.getElementsByClassName("days5")[0],
    table5daysbBody: document.getElementById("table5daysBody"),
    table5daysTR: document.getElementById("mainTR"),

    tableHourlySelected: document.getElementById("hourlySelectedBody"),
    selectedDay: document.getElementById("selectedDay"),

};

const container = document.getElementsByClassName("containerWeather")[0];
const container2 = document.getElementsByClassName("containerWeather2")[0];
const errorBlock = document.getElementsByClassName("errorBlock")[0];
let isShowingError = false;

class Weather{
    constructor(lat, lng, type){
        this.lat = lat;
        this.lng = lng;
        this.type = type;
    }

    getWeatherJsonCurrent = async function(){
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${this.lat}&lon=${this.lng}&appid=${wAPIkey}&units=metric`;
        const response = await fetch(url); 
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        return data;
    }

    getWeatherJsonHourly = async function(){
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${this.lat}&lon=${this.lng}&appid=${wAPIkey}&units=metric`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        return data;
    }

    getWeatherJsonNearby = async function(){
        const url = `https://api.openweathermap.org/data/2.5/find?lat=${this.lat}&lon=${this.lng}&cnt=5&appid=${wAPIkey}&units=metric`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        return data;
    }

    formatUnixTimestamp = function(unixTimestamp, timeZoneOffset = 0) {
        const date = new Date((unixTimestamp + timeZoneOffset) * 1000);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    calculateDayDuration = function(sunrise, sunset) {
        const durationInSeconds = sunset - sunrise;
        const hours = Math.floor(durationInSeconds / 3600);
        const minutes = Math.floor((durationInSeconds % 3600) / 60);
    
        return `${hours}h ${minutes}m`;
    }

    degreesToCompass = function(degrees) {
        const compassPoints = [
          "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
          "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
        ];
      
        const index = Math.round(degrees / 22.5) % 16;
        return compassPoints[index];
      }
}

class City {
    constructor(){
        if ("geolocation" in navigator) {
            this.initializeCity();
        } else {
            this.name = "Rivne";
        }
    }

    showError = function() {
        errorBlock.innerHTML = `<img src="img/error404.png" alt="error" style="width: 100%; height: 100%;">
        <h1 style="text-align: center; color: white;">City not found</h1>`;
        errorBlock.style.top = "200px";
        container.style.display = "none";
        container2.style.display = "none";
        isShowingError = true;
    }

    hideError = function() {
        isShowingError = false;
        errorBlock.innerHTML = "";
        errorBlock.style.top = "0px";
        if (navigation.button5day.style.borderBottom == "2px solid rgb(14, 253, 249)") {
            container2.style.display = "block";
        } else {
            container.style.display = "block";
        }
    }

    initializeCity = async function(){
        let latlng = this.getCoordinates();
        let cityData = await this.getCity(latlng.lat, latlng.lng);
        this.name = cityData.city;
        this.country = cityData.countryName;
        console.log(this.name, this.country);

        curWeather.cityInput.value = `${this.name}, ${this.country}`;
        return latlng;
    };

    getCoordinatesByCity = async function(city){
        try {

            const url = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${wAPIkey}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
    
            this.lat = data[0].lat;
            this.lng = data[0].lon;
            this.country = data[0].country;
            console.log(data);
            
            curWeather.cityInput.value = `${city}, ${this.country}`;
    
            this.getWeatherData();
            if (isShowingError){
                this.hideError();
            }
        }
        catch (error) {
            console.error("Error getting city coordinates:", error);
            this.showError();
        }
    };

    changeCity = function(newName, newCountry){
        this.name = newName;
        if (newCountry != null) {
            this.country = newCountry
        }
        this.getCoordinatesByCity(this.name);
    };

    getCoordinates = function(){
        let latlng = {lat: 50.6166, lng: 26.2516};
        navigator.geolocation.watchPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                latlng = {lat: lat, lng: lng};
            },
            function(error) {
                console.error("Error getting user location:", error);
                container.innerHTML = "";
            }
        );
        this.lat = latlng.lat;
        this.lng = latlng.lng;
        return latlng;
    }

    getCity = async function(lat, lng) {
        let url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        this.name = data.city;
        this.country = data.countryName;
        return data;
    };

    getWeatherData = async function(){
        let weather = new Weather(this.lat, this.lng, "daily");
        const data = await weather.getWeatherJsonCurrent();
        const dataHourly = await weather.getWeatherJsonHourly();
        const dataNearby = await weather.getWeatherJsonNearby();
        const hours = dataHourly.list;

        curWeather.dateCUR.innerHTML = new Date().toLocaleDateString();
        curWeather.tempCUR.innerHTML = `${Math.round(parseFloat(data.main.temp))}°C`;
        curWeather.realfeelCUR.innerHTML = `Real feel: ${Math.round(parseFloat(data.main.feels_like))}°C`;
        curWeather.skyCUR.innerHTML = data.weather[0].main;
        curWeather.iconCUR.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

        const formattedSunrise = weather.formatUnixTimestamp(data.sys.sunrise, data.timezone);
        const formattedSunset = weather.formatUnixTimestamp(data.sys.sunset, data.timezone);
        curWeather.sunriseCUR.innerText = `Sunrise: ${formattedSunrise}`;
        curWeather.sunsetCUR.innerText = `Sunset: ${formattedSunset}`;
        curWeather.durationCUR.innerText = `Duration: ${weather.calculateDayDuration(data.sys.sunrise, data.sys.sunset)}`;

        hourlyWeather.tableBody.innerHTML = "";
        for (let i = 0; i < 5; i++) {
            hourlyWeather.tableBody.innerHTML += `
                <tr>
                    <td>${weather.formatUnixTimestamp(hours[i].dt, data.timezone)}</td>
                    <td><img src="http://openweathermap.org/img/wn/${hours[i].weather[0].icon}.png"></td>
                    <td>${hours[i].weather[0].main}</td>
                    <td>${Math.round(parseFloat(hours[i].main.temp))}°C</td>
                    <td>${Math.round(parseFloat(hours[i].main.feels_like))}°C</td>
                    <td>${Math.round((parseFloat(hours[i].wind.speed)*3.6) * 100) / 100} ${weather.degreesToCompass(hours[i].wind.deg)}</td>
                </tr>
            `;
        }

        nearbyPlaces.tableBody.innerHTML = "";
        for (let i = 1; i < 5; i++) {
            nearbyPlaces.tableBody.innerHTML += `
                <tr>
                    <td>${dataNearby.list[i].name}</td>
                    <td><img src="http://openweathermap.org/img/wn/${dataNearby.list[i].weather[0].icon}.png"></td>
                    <td>${Math.round(dataNearby.list[i].main.temp)}°C</td>
                </tr>
            `;
        }
    }

    getWeather5Days = async function(){
        let weather = new Weather(this.lat, this.lng, "5days");
        const data = await weather.getWeatherJsonHourly();
        const currentData = await weather.getWeatherJsonCurrent();
        console.log(data);

        const curDate = new Date();
        const options = { month: 'short', day: 'numeric'};
        const formattedCurDate = curDate.toLocaleDateString('en-US', options).toUpperCase();
        
        forecast5days.table5days.style.margin = 'auto';
        forecast5days.table5days.style.width = '70%';
        forecast5days.table5days.style.marginTop = '40px';

        forecast5days.table5daysTR.innerHTML = "";
        forecast5days.table5daysTR.innerHTML += `
        <td>
            <div class="column1">
                <h4>TONIGHT</h4>
                <h4>${formattedCurDate}</h4>
                <img src="http://openweathermap.org/img/wn/${currentData.weather[0].icon}.png">
                <h4>${Math.round(parseFloat(currentData.main.temp))}°C</h4>
                <h4>${currentData.weather[0].main}</h4>
            </div>
        </td>
        `
        let startDate;
        for (let i = 0; i < 8; i++){
            let date = new Date(data.list[i].dt * 1000); 
            if (date.getHours() == 12 || date.getHours() == 11 || date.getHours() == 13 && date.getDate() != curDate.getDate()){
                startDate = i;
                break;
            }
        }
        const optionsWeekDay = { weekday: 'short' };
        let column = 2;
        for (let i = 0; i < 32; i+=8){
            let dateWeek = new Date(data.list[i+startDate].dt * 1000);
            const dayName = dateWeek.toLocaleDateString('en-US', optionsWeekDay);
            forecast5days.table5daysTR.innerHTML += `
            <td>
                <div class="column${column}">
                    <h4>${dayName.toUpperCase()}</h4>
                    <h4>${dateWeek.toLocaleDateString('en-US', options).toUpperCase()}</h4>
                    <img src="http://openweathermap.org/img/wn/${data.list[i+startDate].weather[0].icon}.png">
                    <h4>${Math.round(parseFloat(data.list[i+startDate].main.temp))}°C</h4>
                    <h4>${data.list[i+startDate].weather[0].main}</h4>
                </div>
            </td>
            `;
            column++;
        }
        this.changeSelectedDay(data, weather, curDate.getDate());
        await this.trackHover5Days(this.changeSelectedDay, curDate.getDate());
        
    }

    trackHover5Days = async function(changeFunc, curDay) {
        let weather = new Weather(this.lat, this.lng, "5days");
        const data = await weather.getWeatherJsonHourly();

        for (const child of forecast5days.table5daysTR.children) {
            child.addEventListener("mouseover", function(){
                child.style.backgroundColor = "rgb(103, 143, 202)";
            });
            child.addEventListener("mouseleave", function(){
                child.style.backgroundColor = "rgb(53, 102, 175)";
            });

            child.addEventListener("click", function(){
                let tdDiv = child.children[0];
                let day = parseInt(tdDiv.className.match(/\d+/), 10) + curDay - 1;
                console.log(day);
                changeFunc(data, weather, day);
                forecast5days.selectedDay.innerHTML = tdDiv.children[0].innerHTML;
            });
        }
    }

    changeSelectedDay = function(data, weather, dayMonth) {
        forecast5days.tableHourlySelected.innerHTML = "";
        let k = 0;
        while (true) {
            let thisDate = new Date(data.list[k].dt * 1000);
            if (thisDate.getDate() == dayMonth || k > 40) break;
            k++;
        }
        let i = 0;
        do {
            let thisDate = new Date(data.list[i+k].dt * 1000);
            if (thisDate.getDate() != dayMonth) {
                break;
            }
            forecast5days.tableHourlySelected.innerHTML += `
                <tr>
                    <td>${weather.formatUnixTimestamp(data.list[i+k].dt, data.timezone)}</td>
                    <td><img src="http://openweathermap.org/img/wn/${data.list[i+k].weather[0].icon}.png"></td>
                    <td>${data.list[i+k].weather[0].main}</td>
                    <td>${Math.round(parseFloat(data.list[i+k].main.temp))}°C</td>
                    <td>${Math.round(parseFloat(data.list[i+k].main.feels_like))}°C</td>
                    <td>${Math.round((parseFloat(data.list[i+k].wind.speed)*3.6) * 100) / 100} ${weather.degreesToCompass(data.list[i+k].wind.deg)}</td>
                </tr>
            `;
            i++;
        } while (true);
    }
}

let city = new City();
city.getWeatherData();

cityInput.addEventListener("change", function(){
    let cityData = cityInput.value.split(", ");
    city.changeCity(cityData[0], cityData[1]);
    if (container2.style.display == "block") {
        city.getWeather5Days();
    }
});

navigation.buttonToday.addEventListener("click", function(){
    if (!isShowingError){
        container.style.display = "block";
    }
    container2.style.display = "none";
    navigation.buttonToday.style.borderBottom = "2px solid rgb(14, 253, 249)";
    navigation.button5day.style.borderBottom = "none";
});

navigation.button5day.addEventListener("click", function(){
    container.style.display = "none";
    if (!isShowingError){
        container2.style.display = "block";
        city.getWeather5Days();
    }
    navigation.buttonToday.style.borderBottom = "none";
    navigation.button5day.style.borderBottom = "2px solid rgb(14, 253, 249)";
});
