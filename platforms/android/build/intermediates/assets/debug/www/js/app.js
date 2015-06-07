// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('gondoApp', ['ionic', 'firebase','gondoApp.controllers','gondoApp.services', 'ngCordova'])

.run(function($ionicPlatform, $state, $rootScope, $location, Auth, $firebaseObject, $cordovaBackgroundGeolocation) {

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    Auth.$onAuth(function (authData) {
        if (authData) {
            console.log("Logged in as:", authData.uid);
            console.log("Authenticated successfully with payload:", authData);
            var ref = new Firebase('https://gondodb.firebaseio.com/');
            $state.go('tabs.home');

            
            if(authData.provider !== 'password') {
              ref.child('users').once('value', function(snap) {
                if(!snap.hasChild(authData.uid)) {
                  var user = {};
                  if(authData.provider === 'google') {
                    user = {
                      picture: authData.google.cachedUserProfile.picture,
                      nome: authData.google.displayName
                    };

                  } else if(authData.provider === 'facebook') {
                    user = {
                      picture: authData.facebook.cachedUserProfile.picture.data.url,
                      nome: authData.facebook.cachedUserProfile.first_name,
                      cognome: authData.facebook.cachedUserProfile.last_name,
                      email: authData.facebook.cachedUserProfile.email
                    };
                  }
                  
                  console.log("NEW User: ", user);
                  ref.child("users").child(authData.uid).set(user);
                  console.log('user created!');
                }
              });
            }


            $rootScope.user = $firebaseObject(ref.child('users').child(authData.uid));
            if(!$rootScope.user.picture){
              $rootScope.user.picture = 'img/Icon-user.png';
            } 

        } else {
            console.log("Logged out");
        }



    })

    $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
      // We can catch the error thrown when the $requireAuth promise is rejected
      // and redirect the user back to the home page
      if (error === "AUTH_REQUIRED") {
        $state.go('login');
      }
    });
    Parse.initialize("rrsohOEgGvpryzrfLLZcOVFg0b8a48vebVrHBIi6", "3aLEG2pnlNZcZVF0UPrJBPlZzH8KLfWbIda5DDHc");



    /*var options = { timeout: 30000 };
    navigator.geolocation.watchPosition(onSuccess, onError, options);
    function onSuccess(position) {
      alert('Latitude: '  + position.coords.latitude    + '\n' +
          'Longitude: ' + position.coords.longitude + '\n');
    }
    function onError(error) {
      alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}*/
  });
})

.config(function($stateProvider, $urlRouterProvider, facebookInit) {
 

  $stateProvider
    .state('login', {
      url: "/login",
      templateUrl: "templates/login.html",
      controller: 'loginCtrl',
      resolve: {
        // controller will not be loaded until $waitForAuth resolves
        // Auth refers to our $firebaseAuth wrapper in the example above
        "currentAuth": ["Auth", function(Auth) {
          // $waitForAuth returns a promise so the resolve waits for it to complete
          return Auth.$waitForAuth();
        }],
        "waitForFacebook": facebookInit(1443864645931103)
      }
    })
    .state('tabs', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html",
      controller: 'TabsCtrl',
      resolve: {
          // controller will not be loaded until $requireAuth resolves
          // Auth refers to our $firebaseAuth wrapper in the example above
          "currentAuth": ["Auth", function(Auth) {
            // $requireAuth returns a promise so the resolve waits for it to complete
            // If the promise is rejected, it will throw a $stateChangeError (see above)
            return Auth.$requireAuth();
        }]
      }
    })
    .state('tabs.home', {
      url: "/home",
      views: {
        'home-tab': {
          templateUrl: "templates/places.html",
          controller: 'HomeCtrl'
        }
      }
    })
    .state('tabs.map', {
      url: "/map",
      views: {
        'map-tab': {
          templateUrl: "templates/map.html",
          controller: 'MapCtrl'
        }
      }
    });
  $urlRouterProvider.otherwise("/tab/home");
 
});