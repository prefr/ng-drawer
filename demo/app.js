"use strict";

var app  	=   angular.module(
                            'demo',
                             [
                             	'ng',
                             	'ngDrawer'
                             ]
                )

app.run([

    '$rootScope',

    function($rootScope){
        $rootScope.getTime = function(){
            return (new Date()).toLocaleTimeString()
        }
    }
])




