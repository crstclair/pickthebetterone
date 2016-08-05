/**
 * Created by Chris on 3/28/2016.
 */

var voteApp = angular.module('voteApp', ['ngRoute', 'ngAnimate', 'angular-google-analytics', 'ngSocial', 'voteAppControllers']);

voteApp.config(['$routeProvider', 'AnalyticsProvider',
    function($routeProvider, AnalyticsProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'ballot.html',
                controller: 'BallotCtrl as ballot'
            })
            .when('/stats/:thingName', {
                templateUrl: 'stats.html',
                controller: 'StatsCtrl as stats'
            })
            .when('/submit/', {
                templateUrl: 'submit.html',
                controller: 'SubmitCtrl as submit'
            })
            .when('/leaders/', {
                templateUrl: 'leaders.html', 
                controller: 'LeadersCtrl as leaders'
            })
            .when('/matchup/', {
                templateUrl: 'matchup.html',
                controller: 'MatchupCtrl'
            })
            .when('/m/:leftThing/:rightThing', {
                templateUrl: 'ballot.html',
                controller: 'ViewMatchupCtrl'
            })
            .when('/user/:username', {
                templateUrl: 'profile.html',
                controller: 'ProfileCtrl'
            })
            .when('/settings/', {
                templateUrl: 'settings.html',
                controller: 'SettingsCtrl'
            })
            .when('/reset/', {
                templateUrl: 'reset.html',
                controller: 'ResetCtrl'
            })
            .when('/np/:token', {
                templateUrl: 'newpassword.html',
                controller: 'NewPasswordCtrl'
            })
            .when('/verify/:token', {
                templateUrl: 'verify.html',
                controller: 'VerifyEmailCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });

        AnalyticsProvider.setAccount('UA-78147470-1').setDomainName('www.pickthebetterone.com');
    }
]).filter('encode', function() {
    return window.encodeURIComponent;
});