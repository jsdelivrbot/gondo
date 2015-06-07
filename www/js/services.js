angular.module('gondoApp.services',[]).factory('Points',['$http','PARSE_CREDENTIALS',function($http,PARSE_CREDENTIALS){
  return {
    getAll:function(){
            return $http.get('https://api.parse.com/1/classes/point',{
                headers:{
                    'X-Parse-Application-Id': PARSE_CREDENTIALS.APP_ID,
                    'X-Parse-REST-API-Key':PARSE_CREDENTIALS.REST_API_KEY,
                }
            });
        },
        
   }
   
}]).value('PARSE_CREDENTIALS',{
    APP_ID: 'rrsohOEgGvpryzrfLLZcOVFg0b8a48vebVrHBIi6',
    REST_API_KEY:'7GtlSOFMqtMGApjS8KGsGhPgCIU4OywSik9zLsvM'
})
.factory('Auth', ['$firebaseAuth', function($firebaseAuth) {
    var ref = new Firebase('https://gondodb.firebaseio.com/');
    return $firebaseAuth(ref);
}])
.factory('BGgeolocation', ['$firebaseAuth', '$cordovaBackgroundGeolocation', '$rootScope',
  function($firebaseAuth, $cordovaBackgroundGeolocation, $rootScope) {
    
    return {
      start:function() {
        var ref = new Firebase('https://gondodb.firebaseio.com/');
        var authData = $firebaseAuth(ref).$getAuth();
        var options = {
            url: 'https://gondodb.firebaseio.com/users/' + authData.uid + '/positions.json',
            desiredAccuracy: 10,
            stationaryRadius: 20,
            distanceFilter: 30,
            notificationTitle: 'Gondo', // <-- android only, customize the title of the notification
            notificationText: 'background geolocation', // <-- android only, customize the text of the notification
            activityType: 'gondo',
            debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
            stopOnTerminate: false // <-- enable this to clear background location settings when the app terminates
        };
      
        document.addEventListener("deviceready", function () {

          // `configure` calls `start` internally
          $cordovaBackgroundGeolocation.configure(options)
          .then(
            null, // Background never resolves
            function (err) { // error callback
              console.error(err);
            },
            function (location) { // notify callback
              console.log(location);
          });
        });
        $rootScope.locations = [];

        var ref = new Firebase('https://gondodb.firebaseio.com/users/'+ authData.uid + '/positions');
        ref.limitToLast(1).on('child_added', function(snap) {
          console.log('found new position!', snap.val());
          $rootScope.$broadcast('new_position', snap.val());

          $rootScope.latestPosition = snap.val().location;
          if(!$rootScope.locationMarker) {
          $rootScope.locationMarker = new google.maps.Marker({
                  icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 3,
                      fillColor: 'blue',
                      strokeColor: 'blue',
                      strokeWeight: 5,
                      map: null
                  }
              });
              console.log('location marker created!');
          }

          if(!$rootScope.pathLine) {
            $rootScope.pathLine = new google.maps.Polyline({
                  strokeColor: '#3366cc',
                  fillOpacity: 0.4,
                  map: null
              });
              console.log('path created!');
          }

          if($rootScope.previousLocation) {
            var prevLocation = $rootScope.previousLocation;
            $rootScope.locations.push(new google.maps.Marker({
                  icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 3,
                      fillColor: 'green',
                      strokeColor: 'green',
                      strokeWeight: 5,
                      map: null
                  },
                  position: new google.maps.LatLng(prevLocation.latitude, prevLocation.longitude)
              }));
          }

          var latestPositionLatLng = new google.maps.LatLng($rootScope.latestPosition.latitude, $rootScope.latestPosition.longitude);
          
          if($rootScope.me) {
            $rootScope.me.setPosition(latestPositionLatLng);
          }
          if($rootScope.map) {
            $rootScope.map.setCenter(latestPositionLatLng);
          }

          $rootScope.locationMarker.setPosition(latestPositionLatLng);
          $rootScope.pathLine.getPath().push(latestPositionLatLng);
          $rootScope.previousLocation = $rootScope.latestPosition;
        });


      },
      stop:function() {
        document.addEventListener("deviceready", function () {
          $cordovaBackgroundGeolocation.stop();
        });
      }
    }
}])
.factory('User',['$firebaseAuth', '$firebaseObject', '$firebaseArray', function($firebaseAuth, $firebaseObject, $firebaseArray){
  return {
    get:function(){
          var ref = new Firebase('https://gondodb.firebaseio.com/');
          var auth = $firebaseAuth(ref);
          var authData = auth.$getAuth();
          if(authData) {
            ref.child('users').child(authData.uid).once('value', function(snap) {
                console.log('user data:', snap.val());
                return $firebaseObject(snap.val());
            });
          } else {
            console.log('cannot get authdata');
          }
        }

    
        
   }
   
}])
.constant('facebookInit', function(facebookAppID) {
 
    var initialized = false;
 
    return function($q) {
 
        if (initialized) {
            return;
        }
 
        var deferred = $q.defer();
 
        if (window.cordova) {
            ionic.Platform.ready(function() {
                console.log('ionic.Platform.ready');
 
                initialized = true;
                deferred.resolve();
            });
        } else {
            window.fbAsyncInit = function() {
                FB.init({
                    appId      : facebookAppID,
                    cookie     : true,
                    xfbml      : true,
                    version    : 'v2.0'
                });
                console.log('FB javascript SDK initialized');
 
                initialized = true;
                deferred.resolve();
            };
 
            (function () {
                if (!window.FB) {
                    console.debug("launching FB SDK");
                    var e = document.createElement('script');
 
                    e.src = document.location.protocol + '//connect.facebook.net/en_US/sdk.js';
 
                    e.async = true;
                    document.getElementById('fb-root').appendChild(e);
                }
            }());
        }
 
        return deferred.promise;
    };
}).factory('facebook', function() {
    //var console = logFactory('FB');
 
    if (window.cordova) {
        //console.debug('Running as a Cordova app, returning FB Cordova plugin');
        return window.facebookConnectPlugin;
    } else {
        //console.debug('Running as a non-Cordova app. Returning a wrapper around FB web API');
        
        // Adapted slightly from: https://github.com/Wizcorp/phonegap-facebook-plugin/blob/master/www/js/facebookConnectPlugin.js
        return {
 
            getLoginStatus: function (s, f) {
                // Try will catch errors when SDK has not been init
                try {
                    FB.getLoginStatus(function (response) {
                        s(response);
                    });
                } catch (error) {
                    if (!f) {
                        //console.error(error.message);
                    } else {
                        f(error.message);
                    }
                }
            },
 
            showDialog: function (options, s, f) {
 
                if (!options.name) {
                    options.name = "";
                }
                if (!options.message) {
                    options.message = "";
                }
                if (!options.caption) {
                    options.caption = "";
                }
                if (!options.description) {
                    options.description = "";
                }
                if (!options.link) {
                    options.link = "";
                }
                if (!options.picture) {
                    options.picture = "";
                }
 
                // Try will catch errors when SDK has not been init
                try {
                    FB.ui({
                            method: options.method,
                            message: options.message,
                            name: options.name,
                            caption: options.caption,
                            description: (
                                options.description
                                ),
                            link: options.link,
                            picture: options.picture
                        },
                        function (response) {
                            if (response && response.request) {
                                s(response);
                            } else {
                                f(response);
                            }
                        });
                } catch (error) {
                    if (!f) {
                        //console.error(error.message);
                    } else {
                        f(error.message);
                    }
                }
            },
            // Attach this to a UI element, this requires user interaction.
            login: function (permissions, s, f) {
                // JS SDK takes an object here but the native SDKs use array.
                var permissionObj = {};
                if (permissions && permissions.length > 0) {
                    permissionObj.scope = permissions.toString();
                }
 
                FB.login(function (response) {
                    if (response.authResponse) {
                        s(response);
                    } else {
                        f(response.status);
                    }
                }, permissionObj);
            },
 
            getAccessToken: function (s, f) {
                var response = FB.getAccessToken();
                if (!response) {
                    if (!f) {
                        //console.error("NO_TOKEN");
                    } else {
                        f("NO_TOKEN");
                    }
                } else {
                    s(response);
                }
            },
 
            logEvent: function (eventName, params, valueToSum, s, f) {
                // AppEvents are not avaliable in JS.
                s();
            },
 
            logPurchase: function (value, currency, s, f) {
                // AppEvents are not avaliable in JS.
                s();
            },
 
            logout: function (s, f) {
                // Try will catch errors when SDK has not been init
                try {
                    FB.logout( function (response) {
                        s(response);
                    })
                } catch (error) {
                    if (!f) {
                        //console.error(error.message);
                    } else {
                        f(error.message);
                    }
                }
            },
 
            api: function (graphPath, permissions, s, f) {
                // JS API does not take additional permissions
 
                // Try will catch errors when SDK has not been init
                try {
                    FB.api(graphPath, function (response) {
                        if (response.error) {
                            f(response);
                        } else {
                            s(response);
                        }
                    });
                } catch (error) {
                    if (!f) {
                        //console.error(error.message);
                    } else {
                        f(error.message);
                    }
                }
            }
        };
    }
});