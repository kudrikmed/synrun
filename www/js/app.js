// Dom7
var $$ = Dom7;
// Framework7 App main instance

var app  = new Framework7({
  root: '#app', // App root element
  id: 'com.synfitness.synrun', // App bundle ID
  name: 'SynRun', // App name
  theme: 'auto', // Automatic theme detection

  // App routes
  routes: routes,
});

// Init/Create views

/*
var catalogView = app.views.create('#view-catalog', {
  url: '/catalog/'
});
var settingsView = app.views.create('#view-settings', {
  url: '/settings/'
});
*/

var runtrackerView = app.views.create('#view-runtracker', {
    url: '/runtracker/'
});

var newsView = app.views.create('#view-news', {
    url: '/news/'
});

/*
var progressView = app.views.create('#view-progress', {
    url: '/progress/'
});
*/
var profileView = app.views.create('#view-profile', {
    url: '/profile/'
});
var programmsView = app.views.create('#view-programms', {
    url: '/programms/'
});

// переопределение кнопки назад
document.addEventListener("backbutton", function (e) {
    // $$('.card-expandable').each(app.card.close(this, true));
    //  (app.card.close($$('.card-expandable').each(), true));

    //закрыть все карточки
	/*
    var cards = document.getElementsByClassName("card-expandable");
    for (var i = 0; i < cards.length; i++) {
        app.card.close(cards[i], true)
    }
*/
 


  // console.log(document.getElementsByClassName("card-expandable"));
  // console.log($$('.card-expandable').prop('className').split(' '));
  // console.log($$('.panel-right').hasClass('panel-active'));
   
    /*
        var popups = document.getElementsByClassName("popup");
        for (var i = 0; i < popups.length; i++) {
            app.popup.close(popups[i], true)
        }
    
        */

		
  var cardIsOpened = false;
    var cards = document.getElementsByClassName("card-expandable");
    for (var i = 0; i < cards.length; i++) {
        app.card.close(cards[i], true)
		if (cards[i].classList.contains('card-closing') || cards[i].classList.contains('card-opened'))
        cardIsOpened = true;
	
    }
 
 if (cardIsOpened)
  {	  
    var cards = document.getElementsByClassName("card-expandable");
    for (var i = 0; i < cards.length; i++) {
        app.card.close(cards[i], true)
    }
	cardIsOpened = false;
  }	
 else if ($$('#my-popup').hasClass('modal-in')){
	console.log("free popup is opened");

}
else if ($$('#beginner-popup').hasClass('modal-in')){
	console.log("beginner popup is opened");

}
else if ($$('.panel-right').hasClass('panel-active'))
{
	console.log('panel is closing');
	app.panel.close('right', true);
}
  else if(document.getElementById("tabruntracker").className == "tab-link")
  {
	   app.tab.show('#view-runtracker', false);
  }
 else
 {
	navigator.app.exitApp();
 }
 
   

}, false);

// глобальные переменные
var coordsArray = [];  // массив для сохранения данных о координатах
var tripDistance = 0;      // пройденное расстояние
var watchID = null; // глобальная переменная отслеживания расположения во время бега
var watchIDStatic = null; // глобальная переменная отслеживания расположения вне тренировки
var watchIDSteps = null; // глобальная переменная отслеживания акселерометра
var speed = 0; // переменная скорости перемещения
var myMap = null; // глобальная переменная, содержащая нашу карту
var stepsCount = 0; // количество пройденных шагов
var targetDopamine = 0; // целевое значение дофамина на тренировку
var currentDopamine = 0; // текущий уровень дофамина
var beginnerGauge; // полукруг с уровнем дофамина в программе для начинающих
var speedSum; // сумма скоростей в одном забеге
var speedArray = []; // массив скоростей в одном забеге
var timeRunStart; // время начала забега 
var successfulTripDistance = 0; // переменная для хранения расстояния в случае успешной тренировки
var successfulTripTime = 0; // переменная для хранения времени в случае успешной тренировки
var currentRunData = []; // данные текущей тренировки
var myProducts;  // список подписок

var navigatorOptions = {
    enableHighAccuracy: true,       // определяет точность геолокации
    timeout: 1000,                  // максимальное время для вычисления позиции, Infinity для бесконечности   
    maximumAge: 1000                   // срок годности кэшированных данных о месторасположении
};

// privacy policy, t&c  https://app-privacy-policy-generator.firebaseapp.com/


document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
   





// загрузка экрана логина при первом старте
if (localStorage.getItem('firstStart') != 'no') {
    console.log('First start of the app');
    app.loginScreen.open('#my-login-screen');
    localStorage.setItem('amountoftrainings', "0");
    localStorage.setItem('totaldistance', "0");
    localStorage.setItem('language', navigator.language);
	
	updateLanguage();
	
    localStorage.setItem('units', 'metric');
	
	var checkNotifications = function(){
    if(cordova.plugins === undefined){
	   setTimeout(checkNotifications, 1000);
    }
    else {
		if(localStorage.getItem('allowNotification')){
       cordova.plugins.notification.local.schedule({  // https://github.com/katzer/cordova-plugin-local-notifications
           title: textNotificationTitle,
           text: textNotificationText,
           trigger: { count: 1, every: {/* month: 10, day: 27,*/ hour: 12, minute: 35}}	                       
                  });
				}
	}
			}
	checkNotifications();

    mixpanel.track("App first start");
    navigator.geolocation.getCurrentPosition(displayStaticLocation, displayError, navigatorOptionsStatic);

}
else {

    console.log('Not first start of the app');



    // запрос в БД прогресса для синхронизации
    app.request.post('https://synrunning.com/services/progress/loadprogress.php', {
        login: localStorage.getItem('login'),
    }, function (data) {
        if (data) {
            var syncData = JSON.parse(data);
            localStorage.setItem('amountoftrainings', syncData['amountoftrainings']);
            localStorage.setItem('totaldistance', syncData['totaldistance']);
        };
    }, function () { console.log('Error during loading') });

    // подключение аналитических служб    
    mixpanel.identify(localStorage.getItem('login'));
    mixpanel.people.set({
        "$first_name": localStorage.getItem('firstname'),
        "$second_name": localStorage.getItem('secondname'),
        "$email": localStorage.getItem('email'),    // only special properties need the $
        "$last_login": new Date(),         // properties can be dates...

        "birthday": localStorage.getItem('birthday'),                 // ...or numbers
        "bodymass": localStorage.getItem('bodymass'),
        "heigth": localStorage.getItem('height'),
        "gender": localStorage.getItem('gender'),                    // feel free to define your own properties
    });

    mixpanel.track("App started");  // https://mixpanel.com  kudrikmed@gmail.com 241089dima
	
	flurryAnalytics = new FlurryAnalytics({   // https://github.com/blakgeek/cordova-plugin-flurryanalytics
    // requried
    appKey: 'JR35ZQ548939JWC74MG2',
    // optional
   // version: 'my_custom_version',       // overrides the version of the app
    continueSessionSeconds: 3,          // how long can the app be paused before a new session is created, must be less than or equal to five for Android devices
    userId: localStorage.getItem('login'),
    gender: localStorage.getItem('gender'),                        // valid values are "m", "M", "f" and "F"
    age: calculateAge(),
    logLevel: 'ERROR',                  // (VERBOSE, DEBUG, INFO, WARN, ERROR)
    enablePulse: true,                  // defaults to false (I think :/ )
    enableLogging: true,                // defaults to false
    enableEventLogging: false,          // should every event show up the app's log, defaults to true
    enableCrashReporting: true,         // should app crashes be recorded in flurry, defaults to false, iOS only
    enableBackgroundSessions: true,     // should the session continue when the app is the background, defaults to false, iOS only
    reportSessionsOnClose: false,       // should data be pushed to flurry when the app closes, defaults to true, iOS only
    reportSessionsOnPause: false        // should data be pushed to flurry when the app is paused, defaults to true, iOS only
});

	
	
	checkSubscription(); // проверить валидность подписки
	
	
	var checkGoogleFit = function(){
		
    if(navigator.health === undefined){
	   setTimeout(checkGoogleFit, 1000);
    }
    else {
        if(localStorage.getItem('installGoogleFit') != 'No')
		{
			navigator.health.isAvailable(
			function(available)
			{
				if(available){
				console.log("Google Fit is available");}
				else{
					console.log("Google Fit is not available");
					app.popup.open('#googlefit-popup');
				}
			});
		}
    }
}

      checkGoogleFit();
	  
	  var checkNotifications = function(){
    if(cordova.plugins === undefined){
	   setTimeout(checkNotifications, 1000);
    }
    else {
		if(localStorage.getItem('allowNotification'))
		{
       cordova.plugins.notification.local.schedule({  // https://github.com/katzer/cordova-plugin-local-notifications
           title: textNotificationTitle,
           text: textNotificationText,
           trigger: { count: 10, every: {/* month: 10, day: 27,*/ hour: 12, minute: 35}}	                       
                  });
				}
	}
			}
	checkNotifications();

				app.tab.show('#view-runtracker', false);



    if (navigator.geolocation) {
        console.log("runtracker tab is opened");
        navigator.geolocation.getCurrentPosition(displayStaticLocation, displayError, navigatorOptionsStatic);
    }


}

}



var navigatorOptionsStatic = {
    enableHighAccuracy: true,       // определяет точность геолокации
    timeout: 30000,                  // максимальное время для вычисления позиции, Infinity для бесконечности   
    maximumAge: 30000                   // срок годности кэшированных данных о месторасположении
};


// отслеживание и загрузка карты при отрытии таба runtracker
$$('#view-runtracker').on('tab:show', function (e) {
   
    console.log("runtracker tab is opened");

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(displayStaticLocation, displayError, navigatorOptionsStatic);
    }
  
});

function displayStaticLocation(position) { // загрузка карты при запуске приложения

    var latitude = position.coords.latitude; // у объекта position есть свойство coords, содержащее значения широты и долготы, точности их определения
    var longitude = position.coords.longitude;


    if (!myMap) {
        myMap = L.map('map', { center: [latitude, longitude], zoom: 16 });
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'OpenStreetMap' }).addTo(myMap);
    };

    $$('#fabgps').addClass('color-green');  // меняет цвет fab кнопки на зеленый при успешном подключении к gps

};

function displayError(error) { // обработчик ошибок
    var errorTypes = {        // свойство errorTypes содержит числовые значения ошибок
        0: "Unknown error",
        1: "Permission denied by user",
        2: "Position is not available",
        3: "Request timed out"
    };
    var errorMessage = errorTypes[error.code];
    if (error.code == 0 || error.code == 2) {
        errorMessage = errorMessage + " " + error.message;
    }
    console.log(errorMessage);

};




$$('#fabstart').on('click', function () {
    app.popup.open('#my-popup', true);
    mixpanel.track("Free run started");
    window.plugins.insomnia.keepAwake(); //https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin#readme
    coordsArray = [];
    tripDistance = 0;
    currentRunData = [];

    if (navigator.geolocation) {
        watchID = navigator.geolocation.watchPosition(displayLocation, displayError, navigatorOptions); // используются те же обработчики, что и для функции getCurrentPosition
        startStop();
        tripDistance = 0;
    }
    timeRunStart = new Date();
	
	var datatypes = [{
    read: ['heart_rate']
	}];
    navigator.health.requestAuthorization(datatypes, console.log("OAuth2 Ok"), console.log("OAuth2 error"));
    //  window.addEventListener("devicemotion", processAccelerationEvent, true);
});


function processAccelerationEvent() {
    console.log(DeviceMotionEvent.acceleration.x);
};

$$('#fabstop').on('click', function () {
    window.plugins.insomnia.allowSleepAgain();
    if (watchID) {
        if (localStorage.getItem('amountoftrainings')) {
            localStorage.setItem('amountoftrainings', parseInt(localStorage.getItem('amountoftrainings')) + 1);
        }
        else {
            localStorage.setItem('amountoftrainings', 1);
        }
        if (!isNaN(parseFloat($$('#traveledDistance').text()))) {
            if (localStorage.getItem('totaldistance')) {
                localStorage.setItem('totaldistance', parseInt(localStorage.getItem('totaldistance')) + parseFloat($$('#traveledDistance').text()) * 1000);
            }
            else {
                localStorage.setItem('totaldistance', parseFloat($$('#traveledDistance').text()) * 1000);
            }
        }
        app.request.post('https://synrunning.com/services/progress/saveprogress.php', {
            login: localStorage.getItem('login'),
            data: JSON.stringify(localStorage, null, '\t')
        }, function (data) {
            if (data == "success") {
                localStorage.setItem('issaved', true);
            }
            else {
                localStorage.setItem('issaved', false);
            }
        }, function () {
            console.log('Error during saving!');
        });

        app.request.post('https://synrunning.com/services/progress/savetraining.php', {
            login: localStorage.getItem('login'),
            data: JSON.stringify(currentRunData, null, '\t'),
            program: "free"
        }, function (data) {
            console.log(data);
            if (data == "success") {
                // что-нибудь
            }
            else {
                console.log("saving failed!");
            }
        }, function () {
            console.log('Error during saving!');
        });

        // показать экран успешной тренировки, если дистанция больше 0
        if (parseFloat($$('#traveledDistance').text()) > 0) {
            successfulTripDistance = $$('#traveledDistance').text();
            successfulTripTime = $$('#time').text();
            app.popup.open('#congradulations-popup', true); 
        }


        navigator.geolocation.clearWatch(watchID); //передаем значение watchID при его наличии для остановки отслеживания
        watchID = null;
        console.log("Tracking stopped");
        $$('#speed').text('');
        $$('#traveledDistance').text('');
        startStop();
       // window.removeEventListener("devicemotion", processAccelerationEvent);
        mixpanel.track("Free run stopped");
   
        navigator.geolocation.getCurrentPosition(displayStaticLocation, displayError, navigatorOptionsStatic);

        coordsArray = [];
        tripDistance = 0;
        speedArray = [];
        speedSum = 0;
        timeRunStart = 0;
        currentRunData = [];


        app.popup.close('#my-popup', true);

    }

});

function displayLocation(position) { // данный обработчик вызывается, когда браузер динамически получает данные о месторасположении и передает объект position

    var latitude = position.coords.latitude; // у объекта position есть свойство coords, содержащее значения широты и долготы, точности их определения
    var longitude = position.coords.longitude;
    var speed = position.coords.speed;
    var accuracy = position.coords.accuracy;

    var gender = 0;
    if (localStorage.getItem('gender') == 'Male')
    { gender = 1 };

    if (localStorage.getItem('units') == "metric") {
        $$('#speed').text((speed * 3.6).toFixed(1) + " " + textKmH);
    }
    if (localStorage.getItem('units') == "imperial") {
        $$('#speed').text((speed * 3.6 / 1.609344).toFixed(1) + " " + textMiH);
    }

    speedArray.push(speed);
    if (speedSum) {
        speedSum += speed;
    }
    else {
        speedSum = speed;
    }
    var averageSpeed = speedSum / speedArray.length;
    var currentTime = new Date();
    var runTime = (currentTime - timeRunStart) / 60000;
    var timeLine = (currentTime - timeRunStart);
	var pulseValue = 0;

	navigator.health.query({      // https://github.com/dariosalvi78/cordova-plugin-health при установке переменные в двойных кавычках, плагин долго грузится (deviceisready)
        startDate: new Date(new Date().getTime() - 60 * 60 * 60 * 1000), // one day
        endDate: new Date(), // now
        dataType: 'heart_rate',
        limit: 10
    }, function (data){
		if(data){
		var pulse = parseInt(data[data.length-1]['value']);
		console.log("Pulse number is " + pulse);
		pulseValue = pulse;
		}
	}, function(error){
		console.log(error);
	})

	var currentAdrenalin;
    var currentNoradrenalin;
    var currentDopamine;
	
	if (pulseValue != 0 && !pulseValue.isNaN)
	{
	currentAdrenalin = predictadrenaline([runTime, (pulseValue + (averageSpeed * 3.6) + tripDistance / 200)], [gender, 60]).toFixed(1);
    currentNoradrenalin = predictnoradrenaline([runTime, (pulseValue + (averageSpeed * 3.6) + tripDistance / 200)], [gender, 60]).toFixed(1);
    currentDopamine = predictdopamine([runTime, (pulseValue + (averageSpeed * 3.6) + tripDistance / 200)], [gender, 60]).toFixed(1);
	}
    else{
    // аргументы ([время мин, ЧСС], [пол (0 - женский, 1 - мужской), Vo2 max // 40-60-80])
    currentAdrenalin = predictadrenaline([runTime, (60 + (averageSpeed * 3.6) + tripDistance / 200)], [gender, 60]).toFixed(1);
    currentNoradrenalin = predictnoradrenaline([runTime, (60 + (averageSpeed * 3.6) + tripDistance / 200)], [gender, 60]).toFixed(1);
    currentDopamine = predictdopamine([runTime, (60 + (averageSpeed * 3.6) + tripDistance / 200)], [gender, 60]).toFixed(1);
	}

    $$('#dopamine').text(currentDopamine + " " + textPgMl);
    $$('#adrenalin').text(currentAdrenalin + " " + textPgMl);
    $$('#noradrenalin').text(currentNoradrenalin + " " + textPgMl);

    // Calculate distance from last position if available
	var computedDistance = -1;
    var lastPos = coordsArray[coordsArray.length - 1];
    if (lastPos) {

        if (speed > 0 && accuracy < 30) {
            tripDistance = tripDistance + computeDistance(lastPos, position.coords);
			computedDistance = computeDistance(lastPos, position.coords);
        }
    }
    else {
        tripDistance = 0;
    }

  
	// $$('#trackerPopupDisclaimer').text("latitude is " + latitude + " longitude is " + longitude + " tripDistance is " + tripDistance + " calculate trip distance is " + computedDistance + " last position is " + lastPos + " coords.array length" + coordsArray.length + " accuracy " + accuracy);
   
   // Add new coordinates to array
    coordsArray.push(position.coords);

    currentRunData.push(
        {
            latitude: latitude,
            longitude: longitude,
            speed: speed,
            distance: tripDistance,
            time: timeLine,
            dopamine: currentDopamine,
            adrenaline: currentAdrenalin,
            noradrenalin: currentNoradrenalin,
			pulse: pulseValue
        }

    );

    if (localStorage.getItem('units') == "metric") {
      //  $$('#traveledDistance').text((tripDistance / 1000).toFixed(1) + ' ' + textkm);
	  $$('#traveledDistance').text((tripDistance / 1000).toString().match(/^-?\d+(?:\.\d{0,1})?/)[0] + ' ' + textkm);
    }
    if (localStorage.getItem('units') == "imperial") {
        $$('#traveledDistance').text((tripDistance / 1609.344).toFixed(1) + ' ' + textm);
    }

    if (!myMap) {
        myMap = L.map('map', { center: [latitude, longitude], zoom: 16 });
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '@OpenStreetMap' }).addTo(myMap);
        //    L.tileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', { attribution: 'OpenStreetMap' }).addTo(myMap);
        /*     L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
                 maxZoom: 18,
                 id: 'mapbox.streets'
             }).addTo(myMap);
        */
    }
}

$$('#congradulations-popup').on('popup:open', function () {
    $$('#congradulationsDistanceValue').text(successfulTripDistance);
    $$('#congradulationsTimeValue').text(successfulTripTime);
    var averageSpeed = 0;
    averageSpeed = speedSum / speedArray.length;

    if (localStorage.getItem('units') == "metric") {
        $$('#congradulationsAverageSpeedValue').text((averageSpeed * 3.6).toFixed(1) + " " + textKmH);
    }
    if (localStorage.getItem('units') == "imperial") {
        $$('#congradulationsAverageSpeedValue').text((averageSpeed * 3.6 / 1.609344).toFixed(1) + " " + textMiH);
    }

    $$('#congradulationsUseProgramms').text(textTryProgramm);
    $$('#congradulationsUseProgrammsHref').text(textTryProgrammHref);
});

$$('#congradulationsUseProgrammsHref').on('click', function () {
    mixpanel.track("Moved from congradulations href to programms tab");
    app.tab.show('#view-programms', false);
    app.popup.close('#congradulations-popup', true);
});

$$('#textFreeSuccessClose').on('click', function () {
    app.popup.close('#congradulations-popup', true);
});

$$('#textFreeSuccessShare').on('click', function () {
    app.popup.close('#congradulations-popup', true);
    mixpanel.track("Share button after free training pressed");

    var textMessageShareResult = "";
    if (localStorage.getItem('gender') == "Female") {
        textMessageShareResult = textForShareFemale + " " + successfulTripDistance + " " + textInZa + " " + successfulTripTime;
    }
    if (localStorage.getItem('gender') == "Male") {
        textMessageShareResult = textForShareMale + " " + successfulTripDistance + " " + textInZa + " " + successfulTripTime;
    }

    var shareResult = {
        message: textMessageShareResult, // not supported on some apps (Facebook, Instagram)
        subject: 'SynRun', // fi. for email
        // files: ['', ''], // an array of filenames either locally or remotely
        url: 'https://www.synrunning.com'
        // chooserTitle: 'Pick an app' // Android only, you can override the default share sheet title,
        // appPackageName: 'com.apple.social.facebook' // Android only, you can provide id of the App you want to share with
    };

    var onSuccessShareResult = function (result) {
        mixpanel.track("Share result completed? " + result.completed); // On Android apps mostly return false even while it's true
        mixpanel.track("Shared result to app: " + result.app); // On Android result.app since plugin version 5.4.0 this is no longer empty. On iOS it's empty when sharing is cancelled (result.completed=false)
    };

    var onErrorShareResult = function (msg) {
        mixpanel.track("Sharing result failed with message: " + msg);
    };

    window.plugins.socialsharing.shareWithOptions(shareResult, onSuccessShareResult, onErrorShareResult);
});

$$('#view-news').on('tab:show', function (e) {
	
	 var newsTitle = document.getElementById('newstitle');
    newsTitle.innerHTML = textAppName;
  
    console.log("news tab is opened");
    mixpanel.track("Tab info opened");

    app.request.post('https://synrunning.com/services/news/news.php', { newslanguage: newsLanguage }, function (data) {
        
        var news = data.split('%$%');  // мой разделитель

        var newsBlock = document.getElementById('newsplace');
        newsBlock.innerHTML = "";

        for (var c = 0; c < (news.length - 1); c++) {


            // создание карточки с новостью

            var newElement = document.createElement('div');
            newElement.id = news[c]; newElement.className = "card card-expandable";
            newsBlock.appendChild(newElement);

            var newCardContent = document.createElement('div');
            newCardContent.className = "card-content";
            newElement.appendChild(newCardContent);

            var background = document.createElement('div');
            //    background.style = "background: url(./images/cordova.png) no-repeat center bottom; background-size: cover; height: 240px"
            newCardContent.appendChild(background);

            var newCloseButton = document.createElement('a');
            newCloseButton.href = "#";
            newCloseButton.className = "link card-close card-opened-fade-in color-white";
            newCloseButton.style = "position: absolute; right: 15px; top: 15px";
            newCardContent.appendChild(newCloseButton);

            var iconCloseButton = document.createElement('i');
            iconCloseButton.className = "icon f7-icons";
            iconCloseButton.innerHTML = "close_round_filled";
            newCloseButton.appendChild(iconCloseButton);

            var parsedNews = JSON.parse(news[c]);

            // картинка на фон
            background.style = "background : url(" + parsedNews['picture'] + ") no-repeat center bottom; background-size: cover; height: 240px";


            // создание заглавия для новости
            var newNewsHeader = document.createElement('div');
            newNewsHeader.className = "card-header display-block text-color-primary"; newNewsHeader.style = "height: 40px; color: white; backgroung-color: pink";
            newNewsHeader.innerHTML = parsedNews['newsheader'];
            newCardContent.appendChild(newNewsHeader);

            // создание тела новости
            var newNewsBody = document.createElement('div');
            newNewsBody.className = "card-content-padding";
            newNewsBody.innerHTML = parsedNews['newsmain'];
            newCardContent.appendChild(newNewsBody);

            var newButtonBlock = document.createElement('div');
            newButtonBlock.className = "block";
            newButtonBlock.style.paddingBottom = '10px';
            newCardContent.appendChild(newButtonBlock);

            //создание ряда с двумя столбцами
            var newRow = document.createElement('div');
            newRow.className = "row";
            newButtonBlock.appendChild(newRow);


            var leftCol = document.createElement('div');
            leftCol.className = "col-50";
            newRow.appendChild(leftCol);


            var rightCol = document.createElement('div');
            rightCol.className = "col-50";
            newRow.appendChild(rightCol);

            // гиперссылка читать далее
            var newReadMoreButton = document.createElement('a');
            newReadMoreButton.href = parsedNews['newurl'];
            newReadMoreButton.className = "link external button button-fill button-round button-large";
            newReadMoreButton.innerHTML = textReadMore;
            leftCol.appendChild(newReadMoreButton);

            // кнопка закрыть карточку
            var newBottomCloseButton = document.createElement('a');
            newBottomCloseButton.href = "#";
            newBottomCloseButton.className = "button button-fill button-round button-large card-close";
            newBottomCloseButton.innerHTML = textClose;
            rightCol.appendChild(newBottomCloseButton);


        }
    }, function () { console.log('Error'); });
});


// профиль
$$('#view-profile').on('tab:show', function (e) {

    console.log("profile tab is opened");

    var profileTitle = document.getElementById('profileTitle');
    profileTitle.innerHTML = textAppName;
    mixpanel.track("Tab profile opened");


    // имя и фамилия
    var nameSecondName = document.getElementById('username');
    if (localStorage.getItem('firstname') && localStorage.getItem('secondname')) {
        nameSecondName.innerHTML = localStorage.getItem('firstname') + " " + localStorage.getItem('secondname');
    }
    else {
        nameSecondName.innerHTML = "Your name";
    }


    // индекс массы тела
    var bmi = parseInt(localStorage.getItem('bodymass')) / Math.pow(parseInt(localStorage.getItem('height')) / 100, 2);
    var bmihtml = document.getElementById('bmivalue');
    bmihtml.innerHTML = bmi.toFixed(1);

    // безопасная ЧСС  https://chelmetar.ru/raznoe/raschet-zon-chss-raschyot-pulsa-chss-dlya-raznyx-zon-nagruzki.html


    var ageYears = calculateAge();

    var safeHR = 205.8 - (0.685 * ageYears);   // формула Robergs & Landwehr
    console.log(safeHR);
    var hrhtml = document.getElementById('safehrvalue');
    hrhtml.innerHTML = Math.round(safeHR);

    //процент жира
    var gender = 1;  // в данной формуле мужской пол кодируется 1, женский 0
    if (localStorage.getItem('gender') == 'Female') {
        gender = 0;
    }
    var bfp = 1.39 * bmi + 0.23 * ageYears - 10.34 * gender - 9;
    var bfphtml = document.getElementById('fatpercentagevalue');
    bfphtml.innerHTML = Math.round(bfp) + "%";
});

// программы
$$('#view-programms').on('tab:show', function (e) {
    console.log("programs tab is opened");
    mixpanel.track("Tab programms opened");
    if (localStorage.getItem('programm') == 'beginner') {
        beginnerProgramm();
    }
    else {
        showProgramms();
    }
});

function showProgramms() {

    var programmsTitle = document.getElementById('programmtitle');
    programmsTitle.innerHTML = textAppName;

    var programmsView = document.getElementById('programmview');
    programmsView.innerHTML = "";

    var beginnerCard = document.createElement('div');
    beginnerCard.className = "card card-expandable";
    programmsView.appendChild(beginnerCard);


    var beginnerCardContent = document.createElement('div');
    beginnerCardContent.className = "card-content";
    beginnerCard.appendChild(beginnerCardContent);

    var background = document.createElement('div');
    background.style = "background: url(./images/startrunning.jpg) no-repeat center bottom; background-size: cover; height: 240px"
    beginnerCardContent.appendChild(background);

    var newCloseButton = document.createElement('a');
    newCloseButton.href = "#";
    newCloseButton.className = "link card-close card-opened-fade-in color-white";
    newCloseButton.style = "position: absolute; right: 15px; top: 15px";
    beginnerCardContent.appendChild(newCloseButton);

    var iconCloseButton = document.createElement('i');
    iconCloseButton.className = "icon f7-icons";
    iconCloseButton.innerHTML = "close_round_filled";
    newCloseButton.appendChild(iconCloseButton);

    // название для программы beginner
    var beginnerHeader = document.createElement('div');
    beginnerHeader.className = "card-header display-block"; beginnerHeader.style = "height: 40px color: white; backgroung-color: pink";
    beginnerHeader.innerHTML = textEasyStart;
    beginnerCardContent.appendChild(beginnerHeader);

    // создание тела программы
    var beginnerBody = document.createElement('div');
    beginnerBody.className = "card-content-padding";
    beginnerBody.innerHTML = textEasyStartDescription;
    beginnerCardContent.appendChild(beginnerBody);

    //создание блока для кнопок
    var beginnerButtonBlock = document.createElement('div');
    beginnerButtonBlock.className = "block";
    beginnerButtonBlock.style.paddingBottom = '10px';
    beginnerCardContent.appendChild(beginnerButtonBlock);

    //создание ряда с двумя столбцами
    var newBeginnerRow = document.createElement('div');
    newBeginnerRow.className = "row";
    beginnerButtonBlock.appendChild(newBeginnerRow);


    var leftBeginnerCol = document.createElement('div');
    leftBeginnerCol.className = "col-50";
    newBeginnerRow.appendChild(leftBeginnerCol);


    var rightBeginnerCol = document.createElement('div');
    rightBeginnerCol.className = "col-50";
    newBeginnerRow.appendChild(rightBeginnerCol);

    // кнопка выбрать программу для начинающих
    var selectBeginnerButton = document.createElement('a');
    selectBeginnerButton.className = "button button-fill button-round button-large color-green card-close";
    selectBeginnerButton.id = "selectbeginnerprogramm";
    selectBeginnerButton.innerHTML = textSelect;
    leftBeginnerCol.appendChild(selectBeginnerButton);

    //выбор программы
    selectBeginnerButton.onclick = function (e) {
        mixpanel.track("Beginner programm selected");
        localStorage.setItem('beginnerday' + 1, 'current');
        for (var i = 2; i <= 21; i++) {
            localStorage.setItem('beginnerday' + i, 'not finished');
        }
        programmsView.innerHTML = "";
        localStorage.setItem('programm', 'beginner');
        beginnerProgramm();

    }

    // кнопка закрыть карточку
    var closeBeginnerButton = document.createElement('a');
    closeBeginnerButton.href = "#";
    closeBeginnerButton.className = "button button-fill button-round button-large card-close";
    closeBeginnerButton.innerHTML = textClose;
    rightBeginnerCol.appendChild(closeBeginnerButton);
}

function beginnerProgramm() {

    var programmsTitle = document.getElementById('programmtitle');
    programmsTitle.innerHTML = textEasyStart;


    var Days = [];
    for (var i = 1; i <= 21; i++) {
        if (localStorage.getItem('beginnerday' + i) == 'complete') {
            Days.push({
                title: textDay + ' ' + i,
                subtitle: textComplete,
				after: '',
                class: 'item-content'
            });
        }
        if (localStorage.getItem('beginnerday' + i) == 'current') {
            Days.push({
                title: textDay + ' ' + i,
                subtitle: textCurrent,
				after: textRun,
                class: 'item-link item-content popup-open'
            });
        }
        if (localStorage.getItem('beginnerday' + i) == 'not finished') {
            Days.push({
                title: textDay + ' ' + i,
                subtitle: textNotFinished,
				after: '',
                class: 'item-content'
            });
        }
    }
    var beginnerView = document.getElementById('programmview');
    beginnerView.innerHTML = "";

    var beginnerList = document.createElement('div');
    beginnerList.className = "list virtual-list media-list";
    beginnerList.id = "beginnervirtuallist";
    beginnerView.appendChild(beginnerList);

    var beginnerVirtualList = app.virtualList.create({
        el: '#beginnervirtuallist',
        items: Days,
        height: 72,
        itemTemplate:
        '<li>' +
        '<a href="#" id="{{title}}" data-popup="#beginner-popup" class="{{class}}">' +
        '<div class="item-inner">' +
        '<div class="item-title-row">' +
        '<div class="item-title">{{title}}</div>' +
		'<div class="item-after">{{after}}</div>' +
        '</div>' +
        '<div class="item-subtitle">{{subtitle}}</div>' +
        '</div>' +
        '</a>' +
        '</li>'
    });
}

$$('#view-progress').on('tab:show', function (e) {

    console.log("progress tab is opened");
    var progressTitle = document.getElementById('progresstitle');
    progressTitle.innerHTML = textAppName;
    mixpanel.track("Tab progress opened");

    var login = localStorage.getItem('login');

    var gender = 0;
    if (localStorage.getItem('gender') == 'Male')
    { gender = 1 };

    var level;
    if (gender) {
        level = textBeginnerMale;
    }
    else {
        level = textBeginnerFemale;
    }


    if (!isNaN(localStorage.getItem('amountoftrainings')) && localStorage.getItem('amountoftrainings') != null) {
        $$('#trainingsvalue').text(localStorage.getItem('amountoftrainings'));
    }
    else {
        $$('#trainingsvalue').text('0');
    }

    if (!isNaN(localStorage.getItem('totaldistance'))) {
        if (localStorage.getItem('units') == "metric") {
            var totalDistanceParcedMetric = (parseInt(localStorage.getItem('totaldistance')) / 1000).toFixed(1);
            $$('#totaldistancevalue').text(totalDistanceParcedMetric + ' ' + textkm);
        }
        if (localStorage.getItem('units') == "imperial") {
            var totalDistanceParcedImperial = (parseInt(localStorage.getItem('totaldistance')) / 1609.344).toFixed(1);
            $$('#totaldistancevalue').text(totalDistanceParcedImperial + ' ' + textm);
        }


    }
    else {
        $$('#totaldistancevalue').text('0');
    }

    var levelPercentage = (parseInt($$('#trainingsvalue').text()) / 10) * 100;

    if (parseInt($$('#trainingsvalue').text()) > 10) {
        if (gender) {
            level = textIntermediateMale;
        }
        else {
            level = textIntermediateFemale;
        }
        levelPercentage = (parseInt($$('#trainingsvalue').text()) / 100) * 100;
    }
    if (parseInt($$('#trainingsvalue').text()) > 100) {
        if (gender) {
            level = textProMale;
        }
        else {
            level = textProFemale;
        }
        levelPercentage = 100;
    }
    $$('#currentlevelvalue').text(level);


    app.progressbar.show(document.getElementById('levelprogressbar'), levelPercentage, "pink");


    var burnedcalories = 0; // https://run-studio.com/blog/skolko-kaloriy-szhigaetsya-pri-bege



    if (!isNaN(localStorage.getItem('totaldistance'))) {
        if (gender) {
            burnedcalories = parseInt(localStorage.getItem('totaldistance')) * 56 / 1000;
        }
        else {
            burnedcalories = parseInt(localStorage.getItem('totaldistance')) * 77 / 1000;
        }
    }
    else {
        burnedcalories = 0;
    }

    $$('#caloriesburnedvalue').text(burnedcalories.toFixed(1) + " " + textccal);

    var burnedfats = 0;
    burnedfats = burnedcalories / 19.29;

    $$('#fatburnedvalue').text(burnedfats.toFixed(1) + " " + textg);

    checkAchievements();
});


function checkAchievements() {

    /*
    var achievementsBlock = document.getElementById('achievements');
    achievementsBlock.innerHTML = textAchievementsNotYet;
    */

    document.getElementById('firstachievement').style.display = "none";
    document.getElementById('secondachievement').style.display = "none";


    // ачивка за первую пробежку

    document.getElementById('firstachievementname').innerHTML = textFirstAchievementName;
    document.getElementById('firstachievementshortdescription').innerHTML = textFirstRun;
    document.getElementById('firstachievementdescription').innerHTML = textFirstAchievementDescription;
    document.getElementById('firstachievementshare').innerHTML = textShare;

    document.getElementById('firstachievement').onclick = function () {
        mixpanel.track("Share first achievement button pressed");

        var textMessageFirstAchievement = "";
        if (localStorage.getItem('gender') == "Female") {
            textMessageFirstAchievement = textFirstAchievementDescription + ". " + textShareFirstAchievementFemale;
        }
        if (localStorage.getItem('gender') == "Male") {
            textMessageFirstAchievement = textFirstAchievementDescription + ". " + textShareFirstAchievementMale;
        }
        console.log(localStorage.getItem('gender'));

        var shareFirstAchievement = {
            message: textMessageFirstAchievement, // not supported on some apps (Facebook, Instagram)
            subject: 'SynRun', // fi. for email
            // files: ['', ''], // an array of filenames either locally or remotely
            url: 'https://www.synrunning.com'
            // chooserTitle: 'Pick an app' // Android only, you can override the default share sheet title,
            // appPackageName: 'com.apple.social.facebook' // Android only, you can provide id of the App you want to share with
        };
        
       
          //  navigator.share(textFirstAchievementDescription + ". " + textShareFirstAchievementMale);  // плагин nl.madebymark.share  https://github.com/markmarijnissen/cordova-plugin-share
        
        var onSuccessFirstAchevementShare = function (result) {
            mixpanel.track("Share first achievement completed? " + result.completed); // On Android apps mostly return false even while it's true
            mixpanel.track("Shared first achievement to app: " + result.app); // On Android result.app since plugin version 5.4.0 this is no longer empty. On iOS it's empty when sharing is cancelled (result.completed=false)
        };

        var onErrorFirstAchevementShare = function (msg) {
            mixpanel.track("Sharing first achievement failed with message: " + msg);
        };

        window.plugins.socialsharing.shareWithOptions(shareFirstAchievement, onSuccessFirstAchevementShare, onErrorFirstAchevementShare);
    };

    if (parseInt(localStorage.getItem('amountoftrainings')) >= 1 && parseInt(localStorage.getItem('totaldistance')) >= 0) {
        document.getElementById('firstachievement').style.display = "block";
    };

    // ачивка за вторую пробежку
   
};


$$('#textShareLevel').on('click', function () {
    // plugin https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin/

    mixpanel.track("Share level button pressed");

    if (localStorage.getItem('gender') == "Female") {
        var shareCurrentLevel = {
            message: textForLevelShareFemale + " " + $$('#currentlevelvalue').text(), // not supported on some apps (Facebook, Instagram)
            subject: 'SynRun', // fi. for email
            // files: ['', ''], // an array of filenames either locally or remotely
            // url: 'https://www.website.com/foo/#bar?a=b',
            // chooserTitle: 'Pick an app' // Android only, you can override the default share sheet title,
            // appPackageName: 'com.apple.social.facebook' // Android only, you can provide id of the App you want to share with
        };
    }
    if (localStorage.getItem('gender') == "Male") {
        var shareCurrentLevel = {
            message: textForLevelShareMale + " " + $$('#currentlevelvalue').text(), // not supported on some apps (Facebook, Instagram)
            subject: 'SynRun', // fi. for email
            // files: ['', ''], // an array of filenames either locally or remotely
            // url: 'https://www.website.com/foo/#bar?a=b',
            // chooserTitle: 'Pick an app' // Android only, you can override the default share sheet title,
            // appPackageName: 'com.apple.social.facebook' // Android only, you can provide id of the App you want to share with
        };
    }
    var onSuccessLevelShare = function (result) {
        console.log("Share completed? " + result.completed); // On Android apps mostly return false even while it's true
        console.log("Shared to app: " + result.app); // On Android result.app since plugin version 5.4.0 this is no longer empty. On iOS it's empty when sharing is cancelled (result.completed=false)
    };

    var onErrorLevelShare = function (msg) {
        console.log("Sharing failed with message: " + msg);
    };

    window.plugins.socialsharing.shareWithOptions(shareCurrentLevel, onSuccessLevelShare, onErrorLevelShare);
     
});  


$$('#beginner-popup').on('popup:open', function () {
    mixpanel.track("Beginner workout started");
    console.log("background mode enable");
    window.plugins.insomnia.keepAwake();
    coordsArray = [];
    tripDistance = 0;
    timeRunStart = new Date();
    startStop();
    currentRunData = [];

    if (navigator.geolocation) {
        console.log("Navigation is ok");
        watchID = navigator.geolocation.watchPosition(beginnerRunning, displayError, navigatorOptions); // используются те же обработчики, что и для функции getCurrentPosition
    }



    beginnerGauge = app.gauge.create({

        el: '.beginnergauge',
        type: 'semicircle',
        valueTextColor: '#ff6a84',
        borderColor: '#ff6a84',
        value: 0,
        valueText: '-',
        labelText: '-'
    });
	
	navigator.health.requestAuthorization(datatypes, console.log("OAuth2 Ok"), console.log("OAuth2 error"));
});

function beginnerRunning(position) {

    var latitude = position.coords.latitude; // у объекта position есть свойство coords, содержащее значения широты и долготы, точности их определения
    var longitude = position.coords.longitude;
    var speed = position.coords.speed;
    var accuracy = position.coords.accuracy;
    var gaugeValue;
    var gaugeTextValue;
    var gaugeTextLabelValue;
    var runTime;


    var gender = 0;
    if (localStorage.getItem('gender') == 'Male')
    { gender = 1 };



    var day;
    for (day = 1; day <= 21; day++) {
        if (localStorage.getItem('beginnerday' + day) == 'current') {
            break;
        }
    }

    // собственно программа тренировки
    switch (day) {
        case 1:
            if (gender == 0)
            { targetDopamine = 40 };
            if (gender == 1)
            { targetDopamine = 40 };
            break;

        case 2:
            if (gender == 0)
            { targetDopamine = 41 };
            if (gender == 1)
            { targetDopamine = 41 };
            break;
        case 3:
            if (gender == 0)
            { targetDopamine = 42 };
            if (gender == 1)
            { targetDopamine = 42 };
            break;
        case 4:
            if (gender == 0)
            { targetDopamine = 43 };
            if (gender == 1)
            { targetDopamine = 43 };
            break;
        case 5:
            if (gender == 0)
            { targetDopamine = 45 };
            if (gender == 1)
            { targetDopamine = 45 };
            break;
        case 6:
            if (gender == 0)
            { targetDopamine = 46 };
            if (gender == 1)
            { targetDopamine = 46 };
            break;

        case 7:
            if (gender == 0)
            { targetDopamine = 47 };
            if (gender == 1)
            { targetDopamine = 47 };
            break;
        case 8:
            if (gender == 0)
            { targetDopamine = 48 };
            if (gender == 1)
            { targetDopamine = 48 };
            break;
        case 9:
            if (gender == 0)
            { targetDopamine = 49 };
            if (gender == 1)
            { targetDopamine = 49 };
            break;
        case 10:
            if (gender == 0)
            { targetDopamine = 50 };
            if (gender == 1)
            { targetDopamine = 50 };
            break;
        case 11:
            if (gender == 0)
            { targetDopamine = 51 };
            if (gender == 1)
            { targetDopamine = 51 };
            break;

        case 12:
            if (gender == 0)
            { targetDopamine = 52 };
            if (gender == 1)
            { targetDopamine = 52 };
            break;
        case 13:
            if (gender == 0)
            { targetDopamine = 54 };
            if (gender == 1)
            { targetDopamine = 54 };
            break;
        case 14:
            if (gender == 0)
            { targetDopamine = 56 };
            if (gender == 1)
            { targetDopamine = 56 };
            break;
        case 15:
            if (gender == 0)
            { targetDopamine = 58 };
            if (gender == 1)
            { targetDopamine = 58 };
            break;
        case 16:
            if (gender == 0)
            { targetDopamine = 60 };
            if (gender == 1)
            { targetDopamine = 60 };
            break;

        case 17:
            if (gender == 0)
            { targetDopamine = 61 };
            if (gender == 1)
            { targetDopamine = 61 };
            break;
        case 18:
            if (gender == 0)
            { targetDopamine = 62 };
            if (gender == 1)
            { targetDopamine = 62 };
            break;
        case 19:
            if (gender == 0)
            { targetDopamine = 64 };
            if (gender == 1)
            { targetDopamine = 64 };
            break;
        case 20:
            if (gender == 0)
            { targetDopamine = 65 };
            if (gender == 1)
            { targetDopamine = 65 };
            break;
    }
    $$('#targetDopamine').text(targetDopamine + " " + textPgMl);
    // Calculate distance from last position if available
    var lastPos = coordsArray[coordsArray.length - 1];
    if (lastPos) {
        if (speed > 0 && accuracy < 30) {
            tripDistance += computeDistance(lastPos, position.coords);

        }
    }
    else {
        tripDistance = 0;
    }


    speedArray.push(speed);
    if (speedSum) {
        speedSum += speed;
    }
    else {
        speedSum = speed;
    }
    var averageSpeed = speedSum / speedArray.length;

    if (localStorage.getItem('units') == "metric") {
        $$('#beginnerSpeed').text((speed * 3.6).toFixed(1) + " " + textKmH);
    }
    if (localStorage.getItem('units') == "imperial") {
        $$('#beginnerSpeed').text((speed * 3.6 / 1.609344).toFixed(1) + " " + textMiH);
    }


    var currentTime = new Date();
    runTime = (currentTime - timeRunStart) / 60000;
    var timeLine = currentTime - timeRunStart;
	var pulseValue = 0;

	navigator.health.query({      // https://github.com/dariosalvi78/cordova-plugin-health при установке переменные в двойных кавычках, плагин долго грузится (deviceisready)
        startDate: new Date(new Date().getTime() - 60 * 60 * 60 * 1000), // one day
        endDate: new Date(), // now
        dataType: 'heart_rate',
        limit: 10
    }, function (data){
		if(data){
		var pulse = parseInt(data[data.length-1]['value']);
		console.log("Pulse number is " + pulse);
		pulseValue = pulse;
		}
	}, function(error){
		console.log(error);
	})

	
	if (pulseValue != 0 && !pulseValue.isNaN)
	{
    currentDopamine = predictdopamine([runTime, (pulseValue + (averageSpeed * 3.6) + tripDistance / 200)], [gender, 60]).toFixed(1);
	}
    else{
    currentDopamine = predictdopamine([runTime, (60 + (averageSpeed * 3.6) + tripDistance / 200)], [gender, 60]).toFixed(1);
	}


    $$('#beginnerDopamine').text(currentDopamine + " " + textPgMl);

    gaugeValue = currentDopamine / targetDopamine;
    //gaugeTextValue = currentDopamine + " " + textPgMl;
    gaugeTextValue = (gaugeValue * 100).toFixed(0) + " %";
    gaugeTextLabelValue = textOfTarget;



    if (gaugeValue < 1000) {
        beginnerGauge.update(
            {
                value: gaugeValue,
                valueText: gaugeTextValue,
                labelText: gaugeTextLabelValue

            });
    }
    // Add new coordinates to array
    coordsArray.push(position.coords);

    currentRunData.push(
        {
            latitude: latitude,
            longitude: longitude,
            speed: speed,
            distance: tripDistance,
            time: timeLine,
            dopamine: currentDopamine,
			pulse: pulseValue
        }

    );

    if (localStorage.getItem('units') == "metric") {
        $$('#beginnerTraveledDistance').text((tripDistance / 1000).toString().match(/^-?\d+(?:\.\d{0,1})?/)[0] + ' ' + textkm);
    }
    if (localStorage.getItem('units') == "imperial") {
        $$('#beginnerTraveledDistance').text((tripDistance / 1609.344).toString().match(/^-?\d+(?:\.\d{0,1})?/)[0] + ' ' + textm);
    }

    if (currentDopamine >= targetDopamine && currentDopamine > 1) {
        navigator.vibrate(200);
    }


}

$$('#beginnerfab').on('click', function () {
    window.plugins.insomnia.allowSleepAgain();
    if (watchID) {
        navigator.geolocation.clearWatch(watchID); //передаем значение watchID при его наличии для остановки отслеживания
        watchID = null;

        navigator.geolocation.getCurrentPosition(displayStaticLocation, displayError, navigatorOptionsStatic);
        coordsArray = [];
        // в случае успеха тренировки
		console.log("current dopamine is " + currentDopamine + ", target dopamine is " + targetDopamine);
        if ((currentDopamine >= targetDopamine) && (currentDopamine > 1)) {

            for (var i = 1; i <= 21; i++) {
                if (localStorage.getItem('beginnerday' + i) == 'current') {
                    localStorage.setItem('beginnerday' + i, 'complete');
                    mixpanel.track("Beginner workout finished successfully Day " + i);
                    localStorage.setItem('beginnerday' + (i + 1), 'current');
                    break;
                }
            }

            successfulTripDistance = $$('#beginnerTraveledDistance').text()
            successfulTripTime = $$('#beginnerTime').text();
            app.popup.open('#beginner-congradulations-popup', true);

        }
        // в случае неуспеха тренировки
        if (currentDopamine < targetDopamine) {
            mixpanel.track("Beginner workout finished without progress");
            console.log('Not today (');
        }

        startStop();

        var workoutArray = {
            time: $$('#beginnerTime').text(),
            distance: $$('#beginnerTraveledDistance').text()
        };

        if (localStorage.getItem('amountoftrainings')) {
            localStorage.setItem('amountoftrainings', parseInt(localStorage.getItem('amountoftrainings')) + 1);
        }
        else {
            localStorage.setItem('amountoftrainings', 1);
        }

        // при 4 пробежках с суммарным ненулевым результатом предлагает оценить приложение
        if (parseInt(localStorage.getItem('amountoftrainings')) == 3 && parseInt(localStorage.getItem('totaldistance')) > 0) {
            mixpanel.track('Rating dialog is shown');
            AppRate.preferences = {     // https://github.com/pushandplay/cordova-plugin-apprate
                displayAppName: 'SynRun',
                usesUntilPrompt: 2,
                promptAgainForEachNewVersion: false,
                inAppReview: true,
                storeAppURL: {
                    ios: '<my_app_id>',
                    android: 'http://play.google.com/store/apps/details?id=com.google.android.apps.maps',
                    windows: 'ms-windows-store://pdp/?ProductId=<the apps Store ID>',
                    blackberry: 'appworld://content/[App Id]/',
                    windows8: 'ms-windows-store:Review?name=<the Package Family Name of the application>'
                },
                customLocale: {

                    title: textRatingWouldYouMind,
                    message: textRatingMessage,
                    cancelButtonLabel: textRatingCancelButton,
                    laterButtonLabel: textRatingRemindMeLater,
                    rateButtonLabel: textRatingRateItNow,
                    yesButtonLabel: textRatingYes,
                    noButtonLabel: textRatingNotReally,
                    appRatePromptTitle: textRatingDoYouLike,
                    feedbackPromptTitle: textRatingFeedBack,
                },
                callbacks: {
                    handleNegativeFeedback: function () {
                        window.open('mailto:feedback@example.com', '_system');
                    },
                    onRateDialogShow: function (callback) {
                        callback(1) // cause immediate click on 'Rate Now' button
                    },
                    onButtonClicked: function (buttonIndex) {
                        console.log("onButtonClicked -> " + buttonIndex);
                    }
                },
                openUrl: AppRate.preferences.openUrl
            };
            AppRate.promptForRating();
        }

        if (!isNaN(parseFloat($$('#beginnerTraveledDistance').text()))) {
            if (localStorage.getItem('totaldistance')) {
                localStorage.setItem('totaldistance', parseInt(localStorage.getItem('totaldistance')) + parseFloat($$('#beginnerTraveledDistance').text()) * 1000);
            }
            else {
                localStorage.setItem('totaldistance', parseFloat($$('#beginnerTraveledDistance').text()) * 1000);
            }
        }

        // сохранить localstorage на сервер

        app.request.post('https://synrunning.com/services/progress/saveprogress.php', {
            login: localStorage.getItem('login'),
            data: JSON.stringify(localStorage, null, '\t')

        }, function (data) {
            console.log(data);
            if (data == "success") {
                localStorage.setItem('issaved', true);

            }
            else {
                localStorage.setItem('issaved', false);
            }


        }, function () {
            console.log('Error during saving!');
        });

        app.request.post('https://synrunning.com/services/progress/savetraining.php', {
            login: localStorage.getItem('login'),
            data: JSON.stringify(currentRunData),
            program: "beginner"

        }, function (data) {
            console.log(data);
            if (data == "success") {
                localStorage.setItem('issaved', true);

            }
            else {
                localStorage.setItem('issaved', false);
            }


        }, function () {
            console.log('Error during saving!');
        });


        currentRunData = [];
        tripDistance = 0;
        speedSum = 0;
        speedArray = [];
        timeRunStart = 0;
        app.popup.close('#beginner-popup', true);
        beginnerProgramm();
    }
});

$$('#beginner-congradulations-popup').on('popup:open', function () {
    $$('#congradulationsPopupDistanceValue').text(successfulTripDistance);
    $$('#congradulationsPopupTimeValue').text(successfulTripTime);
    var averageSpeed = 0;
    averageSpeed = speedSum / speedArray.length;

    if (localStorage.getItem('units') == "metric") {
        $$('#congradulationsPopupAverageSpeedValue').text((averageSpeed * 3.6).toFixed(1) + " " + textKmH);
    }
    if (localStorage.getItem('units') == "imperial") {
        $$('#congradulationsPopupAverageSpeedValue').text((averageSpeed * 3.6 / 1.609344).toFixed(1) + " " + textMiH);
    }
});

$$('#textBeginnerSuccessClose').on('click', function () {
    app.popup.close('#beginner-congradulations-popup', true);
});

$$('#textBeginnerSuccessShare').on('click', function () {
    app.popup.close('#beginner-congradulations-popup', true);
    mixpanel.track("Share button after beginner training pressed");

    var textMessageShareResult = "";
    if (localStorage.getItem('gender') == "Female") {
        textMessageShareResult = textForShareFemale + " " + successfulTripDistance + " " + textInZa + " " + successfulTripTime;
    }
    if (localStorage.getItem('gender') == "Male") {
        textMessageShareResult = textForShareMale + " " + successfulTripDistance + " " + textInZa + " " + successfulTripTime;
    }

    var shareResult = {
        message: textMessageShareResult, // not supported on some apps (Facebook, Instagram)
        subject: 'SynRun', // fi. for email
        // files: ['', ''], // an array of filenames either locally or remotely
        url: 'https://www.synrunning.com'
        // chooserTitle: 'Pick an app' // Android only, you can override the default share sheet title,
        // appPackageName: 'com.apple.social.facebook' // Android only, you can provide id of the App you want to share with
    };

    var onSuccessShareResult = function (result) {
        mixpanel.track("Share result beginner completed? " + result.completed); // On Android apps mostly return false even while it's true
        mixpanel.track("Shared result beginner to app: " + result.app); // On Android result.app since plugin version 5.4.0 this is no longer empty. On iOS it's empty when sharing is cancelled (result.completed=false)
    };

    var onErrorShareResult = function (msg) {
        mixpanel.track("Sharing result beginner failed with message: " + msg);
    };

    window.plugins.socialsharing.shareWithOptions(shareResult, onSuccessShareResult, onErrorShareResult);
});

// Login Screen
$$('#my-login-screen .login-button').on('click', function () {
    var username = $$('#my-login-screen [name="username"]').val();
    var password = $$('#my-login-screen [name="password"]').val();

    if (username == "") {
        app.dialog.alert(textEnterUsername);
        return;
    }
    if (password == "") {
        app.dialog.alert(textEnterPassword);
        return;
    }
    app.request.post('https://synrunning.com/services/accounts/login.php', {
        login: username,
        password: password
    }, function (data) {


        if (data == "usernotfound") {
            app.dialog.alert(textNoSuchAccount);
            return;
        }
        if (data == "invalidpassword") {
            app.dialog.alert(textCheckPassword);
            return;
        }

        if (data['login'] != '') {

            var user = JSON.parse(data);

            localStorage.setItem('firstname', user['firstname']);
            localStorage.setItem('secondname', user['secondname']);
            localStorage.setItem('birthday', user['birthday']);
            localStorage.setItem('gender', user['gender']);
            localStorage.setItem('bodymass', user['bodymass']);
            localStorage.setItem('height', user['height']);
            localStorage.setItem('email', user['email']);
            localStorage.setItem('login', user['login']);

            mixpanel.identify(localStorage.getItem('login'));
            mixpanel.people.set({
                "$first_name": localStorage.getItem('firstname'),
                "$second_name": localStorage.getItem('secondname'),
                "$email": localStorage.getItem('email'),    // only special properties need the $
                "$last_login": new Date(),         // properties can be dates...

                "birthday": localStorage.getItem('birthday'),                 // ...or numbers
                "bodymass": localStorage.getItem('bodymass'),
                "heigth": localStorage.getItem('height'),
                "gender": localStorage.getItem('gender'),                    // feel free to define your own properties
            });

            console.log(user['firstname']);
            console.log(user['secondname']);
            console.log(user['birthday']);
            console.log(user['gender']);
            console.log(user['bodymass']);
            console.log(user['height']);
            console.log(user['email']);
            console.log(user['login']);

            // запрос в БД прогресса для синхронизации
            app.request.post('https://synrunning.com/services/progress/loadprogress.php', {
                login: localStorage.getItem('login'),
            }, function (data) {
                if (data) {
                    var syncData = JSON.parse(data);
                    localStorage.setItem('amountoftrainings', syncData['amountoftrainings']);
                    localStorage.setItem('totaldistance', syncData['totaldistance']);
                };
            }, function () { console.log('Error during loading') });

            localStorage.setItem('firstStart', 'no');
            // Close login screen

				
				var checkGoogleFit = function(){
    if(navigator.health === undefined){
	   setTimeout(checkGoogleFit, 1000);
    }
    else {
        if(localStorage.getItem('installGoogleFit') != 'No')
		{
			navigator.health.isAvailable(
			function(available)
			{
				if(available){
				console.log("Google Fit is available");}
				else{
					console.log("Google Fit is not available");
					app.popup.open('#googlefit-popup');
				}
			});
		}
    }
}

      checkGoogleFit();

				app.loginScreen.close('#my-login-screen');
				checkSubscription();
				app.tab.show('#view-runtracker', false);
        }

    }, function () {
        console.log('Error during login');
        app.dialog.alert('Error during login!')
    });
});

// Registration button
$$('#createNewAcc').on('click', function () {
    app.loginScreen.open('#my-registration-screen');
    app.loginScreen.close('#my-login-screen');

});

// Registration

$$('#register-button').on('click', function () {

    var firstnamedata = $$('#my-registration-screen [name="firstname"]').val();
    var secondnamedata = $$('#my-registration-screen [name="secondname"]').val();
    var birthdaydata = $$('#my-registration-screen [name="birthday"]').val();
    var e = document.getElementById("genderselector");
    var genderdata = e.options[e.selectedIndex].value;
    var f = document.getElementById("massselector");
    var massselectordata = f.options[f.selectedIndex].value;
    var bodymassdata = $$('#my-registration-screen [name="bodymass"]').val();
    var g = document.getElementById("heightselector");
    var heightselectordata = g.options[g.selectedIndex].value;
    var heightdata = $$('#my-registration-screen [name="height"]').val();
    var emaildata = $$('#my-registration-screen [name="email"]').val();
    var logindata = $$('#my-registration-screen [name="login"]').val();
    var passworddata = $$('#my-registration-screen [name="password"]').val();
	var termsofusedata = document.getElementById('agreeWithPrivacyPolicy').checked;

    if ($$('#my-registration-screen [name="password"]').val() != $$('#my-registration-screen [name="password2"]').val()) {
        app.dialog.alert(textPasswordAndControlPassword);
        return;
    }
    if (genderdata == "") {
        app.dialog.alert(textSelectGender);
        return;
    }
    if (bodymassdata == "") {
        app.dialog.alert(textSelectBodyMass);
        return;
    }
    if (heightdata == "") {
        app.dialog.alert(textSelectHeight);
        return;
    }
    if (birthdaydata == "") {
        app.dialog.alert(textSelectBirthday);
        return;
    }
    if (emaildata == "") {
        app.dialog.alert(textSelectEmail);
        return;
    }
    if (logindata == "") {
        app.dialog.alert(textSelectLogin);
        return;
    }
    if (passworddata == "") {
        app.dialog.alert(textSelectPassword);
        return;
    }
	if (!termsofusedata) {  //privacy policy
        app.dialog.alert(textAgreePrivacy);
        return;
	}
    if (massselectordata == 'lbs') {
        bodymassdata = Math.round(bodymassdata / 2.205);
    }
    if (heightselectordata == 'inch') {
        heightdata = Math.round(heightdata * 2.54);
    }
    app.request.post('https://synrunning.com/services/accounts/registration.php', {
        firstname: firstnamedata,
        secondname: secondnamedata,
        birthday: birthdaydata,
        gender: genderdata,
        bodymass: bodymassdata,
        height: heightdata,
        email: emaildata,
        login: logindata,
        password: passworddata
    }, function (data) {
        console.log(data);
        if (data == "success") {
            mixpanel.track("New account created");
            mixpanel.identify(logindata);
            mixpanel.people.set({
                "$first_name": firstnamedata,
                "$second_name": secondnamedata,
                "$email": emaildata,    // only special properties need the $
                "$last_login": new Date(),         // properties can be dates...

                "birthday": birthdaydata,                    // ...or numbers
                "bodymass": bodymassdata,
                "heigth": heightdata,
                "gender": genderdata                    // feel free to define your own properties
            });

			flurryAnalytics = new FlurryAnalytics({   // https://github.com/blakgeek/cordova-plugin-flurryanalytics
			// requried
			appKey: 'JR35ZQ548939JWC74MG2',
			// optional
			// version: 'my_custom_version',       // overrides the version of the app
			continueSessionSeconds: 3,          // how long can the app be paused before a new session is created, must be less than or equal to five for Android devices
			userId: localStorage.getItem('login'),
			gender: localStorage.getItem('gender'),                        // valid values are "m", "M", "f" and "F"
			age: calculateAge(),
			logLevel: 'ERROR',                  // (VERBOSE, DEBUG, INFO, WARN, ERROR)
			enablePulse: true,                  // defaults to false (I think :/ )
			enableLogging: true,                // defaults to false
			enableEventLogging: false,          // should every event show up the app's log, defaults to true
			enableCrashReporting: true,         // should app crashes be recorded in flurry, defaults to false, iOS only
			enableBackgroundSessions: true,     // should the session continue when the app is the background, defaults to false, iOS only
			reportSessionsOnClose: false,       // should data be pushed to flurry when the app closes, defaults to true, iOS only
			reportSessionsOnPause: false        // should data be pushed to flurry when the app is paused, defaults to true, iOS only
			});

            localStorage.setItem('firstname', firstnamedata);
            localStorage.setItem('secondname', secondnamedata);
            localStorage.setItem('birthday', birthdaydata);
            localStorage.setItem('gender', genderdata);
            localStorage.setItem('bodymass', bodymassdata);
            localStorage.setItem('height', heightdata);
            localStorage.setItem('email', emaildata);
            localStorage.setItem('login', logindata);
            localStorage.setItem('password', passworddata);
			
			localStorage.setItem('amountoftrainings', "0");
            localStorage.setItem('totaldistance', "0");

            localStorage.setItem('firstStart', 'no');
            navigator.geolocation.getCurrentPosition(displayStaticLocation, displayError, navigatorOptionsStatic);
			
			app.popup.open('#googlefit-popup');
			
                app.loginScreen.close('#my-registration-screen');
				checkSubscription();
				app.tab.show('#view-runtracker', false);
			
  
            
        }
        if (data == "sameloginsameemail") {
            app.dialog.alert(textAlreadyLoginEmail);
        }
        if (data == "samelogin") {
            app.dialog.alert(textAlreadyLogin);
        }
        if (data == "sameemail") {
            app.dialog.alert(textAlreadyEmail);
        }


    }, function () {
        console.log(textErrorDuringRegistration);
        app.dialog.alert(textErrorDuringRegistration);
    });
});


// панель

// выйти из аккаунта через панель
$$('#logoutmenu').on('click', function () {
    app.loginScreen.open('#my-login-screen');
    app.panel.close('right', true);
});

// сменить программу тренировок через панель
$$('#changeprogramm').on('click', function () {
    localStorage.setItem('programm', "");
    showProgramms();
    app.tab.show('#view-programms', false);
    app.panel.close('right', true);
});

// сменить язык через панель
$$('#changelanguage').on('click', function () {
    app.loginScreen.open('#language-and-metrics-screen');
    app.panel.close('right', true);
});

// сохранить язык и единицы измерения
$$('#textSaveAndExitButton').on('click', function () {

    var lang = document.getElementById("languageselector");
    var langdata = lang.options[lang.selectedIndex].value;
    localStorage.setItem('language', langdata);
    console.log(langdata);
    updateLanguage();

    var unit = document.getElementById("unitselector");
    var unitdata = unit.options[unit.selectedIndex].value;
    localStorage.setItem('units', unitdata);
    console.log(unitdata);

    app.loginScreen.close('#language-and-metrics-screen');
});

// сервисы

// возраст в годах
function calculateAge() {
    var birthday = Date.parse(localStorage.getItem('birthday'));
    var ageDifMs = Date.now() - birthday;
    var ageDate = new Date(ageDifMs);
    var ageYears = (Math.abs(ageDate.getUTCFullYear() - 1970));
    return ageYears;
};

// секундомер
var base = 60;
var clocktimer, dateObj, dh, dm, ds, ms;
var readout = '';
var h = 1, m = 1, tm = 1, s = 0, ts = 0, ms = 0, init = 0;

//функция для очистки поля
function clearClock() {
    clearTimeout(clocktimer);
    h = 1; m = 1; tm = 1; s = 0; ts = 0; ms = 0;
    init = 0;
    readout = '00:00:00.00';
    $$('#beginnerTime').text(readout);
}

//функция для старта секундомера
function startTIME() {
    var cdateObj = new Date();
    var t = (cdateObj.getTime() - dateObj.getTime()) - (s * 1000);
    if (t > 999) { s++; }
    if (s >= (m * base)) {
        ts = 0;
        m++;
    } else {
        ts = parseInt((ms / 100) + s);
        if (ts >= base) { ts = ts - ((m - 1) * base); }
    }
    if (m > (h * base)) {
        tm = 1;
        h++;
    } else {
        tm = parseInt((ms / 100) + m);
        if (tm >= base) { tm = tm - ((h - 1) * base); }
    }
    ms = Math.round(t / 10);
    if (ms > 99) { ms = 0; }
    if (ms == 0) { ms = '00'; }
    if (ms > 0 && ms <= 9) { ms = '0' + ms; }
    if (ts > 0) { ds = ts; if (ts < 10) { ds = '0' + ts; } } else { ds = '00'; }
    dm = tm - 1;
    if (dm > 0) { if (dm < 10) { dm = '0' + dm; } } else { dm = '00'; }
    dh = h - 1;
    if (dh > 0) { if (dh < 10) { dh = '0' + dh; } } else { dh = '00'; }
    readout = dh + ':' + dm + ':' + ds + '.' + ms;

    $$('#beginnerTime').text(readout);
    $$('#time').text(readout);

    clocktimer = setTimeout("startTIME()", 10);
}

//Функция запуска и остановки
function startStop() {
    if (init == 0) {
        clearClock();
        dateObj = new Date();
        startTIME();
        init = 1;
    } else {
        clearTimeout(clocktimer);
        init = 0;
    }
} 
function computeDistance(startCoords, destCoords) { // функция принимает значение координат двух точек и возвращает значение расстояния между ними в километрах
    var startLatRads = degreesToRadians(startCoords.latitude);
    var startLongRads = degreesToRadians(startCoords.longitude);
    var destLatRads = degreesToRadians(destCoords.latitude);
    var destLongRads = degreesToRadians(destCoords.longitude);

    var Radius = 6371000; // радиус Земли в метрах
    var distance = Math.acos(Math.sin(startLatRads) * Math.sin(destLatRads) + // используется функция гаверсинуса
        Math.cos(startLatRads) * Math.cos(destLatRads) *
        Math.cos(startLongRads - destLongRads)) * Radius;
    return distance;
}

function degreesToRadians(degrees) {  // перевод градусов в радианы
    var radians = (degrees * Math.PI) / 180;
    return radians;
}
$$('#textInstallGoogleFit').on('click', function () {
	
  var notificationCheck = document.getElementById('notificationsCheckbox').checked;
  var googlefitCheck = document.getElementById('googleFitCheckBox').checked;
  
  if (googlefitCheck)
  {
	navigator.health.promptInstallFit();
  }
  
  if (notificationCheck)
  {
	  localStorage.setItem('allowNotification', true);
	  	  var checkNotifications = function(){
    if(cordova.plugins === undefined){
	   setTimeout(checkNotifications, 1000);
    }
    else {
		if(localStorage.getItem('allowNotification'))
		{
       cordova.plugins.notification.local.schedule({  // https://github.com/katzer/cordova-plugin-local-notifications
           title: textNotificationTitle,
           text: textNotificationText,
           trigger: { count: 10, every: {/* month: 10, day: 27,*/ hour: 12, minute: 35}}	                       
                  });
				}
	}
			}
	checkNotifications();
	  
  }
  console.log(localStorage.getItem('allowNotification'));
  app.popup.open("#subscription-popup");
  app.popup.close('#googlefit-popup', true);
  navigator.geolocation.getCurrentPosition(displayStaticLocation, displayError, navigatorOptionsStatic);
  app.tab.show('#view-runtracker', false);


});

$$('#textCancelGoogleFit').on('click', function () {

  console.log(document.getElementById('notificationsCheckbox').checked);
  localStorage.setItem('allowNotifications', false);
  localStorage.setItem('installGoogleFit', 'No');
  mixpanel.track("Google Fit Blocked");
  mixpanel.track("Notifications Blocked");
  app.popup.open("#subscription-popup");
  app.popup.close('#googlefit-popup', true);
  navigator.geolocation.getCurrentPosition(displayStaticLocation, displayError, navigatorOptionsStatic);
  app.tab.show('#view-runtracker', false);
  
});

// add pulse
$$('#textAddPulsemenu').on('click', function () {

    app.popup.open('#subscription-popup', true);
/*
    app.popup.open('#googlefit-popup', true);
	localStorage.setItem('installGoogleFit', '');
	*/

});


$$('#subscription-popup').on('popup:open', function () {
	
inAppPurchase
  .getProducts(['synrun.subscription.month'])
  .then(function (products) {
    console.log(products);
	myProducts = products;
var productsData = products;
$$('#monthSubscriptionTitle').text(productsData[0]['title'].split(" (", 1));
console.log(productsData[0]['title']);
$$('#monthSubscriptionDescription').text(productsData[0]['description']);
console.log(productsData[0]['description']);
$$('#monthSubscriptionPrice').text(productsData[0]['price']);
console.log(productsData[0]['price']);
    /*
       [{ productId: 'com.yourapp.prod1', 'title': '...', description: '...', currency: '...', price: '...', priceAsDecimal: '...' }, ...]
    */
  })
  .catch(function (err) {
    console.log(err);
  });	
	
});

$$('#monthSubscriptionButton').on('click', function () {
	

  
	inAppPurchase
  .subscribe('synrun.subscription.month')
  .then(function (data) {
    console.log(data);

    /*
      {
        transactionId: ...
        receipt: ...
        signature: ...
      }
    */
  })
  .catch(function (err) {
    console.log(err);
  });
  

  
});
	



$$('#textBuySubscription').on('click', function () {

var subscription;

inAppPurchase
  .restorePurchases()
  .then(function (data) {
    console.log(data);
	if(data[0])
	{
		subscription = data[0]['productId'];
	}
	if (subscription == "synrun.subscription.month")
  {
    app.popup.close('#subscription-popup', true);
	navigator.geolocation.getCurrentPosition(displayStaticLocation, displayError, navigatorOptionsStatic);
    app.tab.show('#view-runtracker', false);
  }
	else
  {
	app.dialog.alert(textSubscriptionIsNotValid);
  }

    /*
      [{
        transactionId: ...
        productId: ...
        state: ...
        date: ...
      }]
    */
  })
  .catch(function (err) {
    console.log(err);
  });

  
 
});

function checkSubscription()
{
	// проверка подписки
	/*
	var subscription;  // валидация подписки

   inAppPurchase
   .restorePurchases()
   .then(function (data) {
	   console.log(data);
	if(data[0])
	{
		subscription = data[0]['productId'];
	}
	if (subscription == "synrun.subscription.month")
  {
	navigator.geolocation.getCurrentPosition(displayStaticLocation, displayError, navigatorOptionsStatic);
    app.tab.show('#view-runtracker', false);
  }
	else
  {
	app.popup.open('#subscription-popup');
  }
  })
  .catch(function (err) {
    console.log(err);
  });
  */
  
   mixpanel.track("Free subscription");
}; 

$$('#textCancelSubscription').on('click', function () {
	
	app.popup.close('#subscription-popup', true);
	});