/**
 * Created by Chris on 3/11/2016.
 */
var voteAppControllers = angular.module('voteAppControllers', []);

voteAppControllers.controller('BallotCtrl', ['$scope', '$http', 'Analytics', 'storeBallot', 'serverErrorMessenger', function($scope, $http, Analytics, storeBallot, serverErrorMessenger) {

    var getBallot = function () {
        $http.get('/vote/').then(function(data, status) {
            serverErrorMessenger.clearError();
            $scope.data = data.data;
            $scope.showIntro = storeBallot.isFirstVote();
            storeBallot.put(data.data);
        }, function (data, status) {
            serverErrorMessenger.reportError(data);
        });
    };

    if(storeBallot.get()) {
        $scope.data = storeBallot.get();
    } else {
        getBallot();
    }

    $scope.sendVote = function(index) {
        Analytics.trackEvent('voting', 'vote', index ? 'right' : 'left');

        var postData = {
            id: $scope.data.candidates[index].id,
            opponent: $scope.data.candidates[index ? 0 : 1].id
        };

        $http.post('/vote/', postData).then(function(data, status) {
            serverErrorMessenger.clearError();
            $scope.data = data.data;
            $scope.showIntro = storeBallot.isFirstVote();
            storeBallot.put(data.data);
        }, function (data, status) {
            serverErrorMessenger.reportError(data);
        });
    };

    $scope.skip = function() {
        Analytics.trackEvent('voting', 'skip', 'button');
        getBallot();
    };
}]).controller('StatsCtrl', ['$scope', '$http', '$routeParams', 'serverErrorMessenger', function($scope, $http, $routeParams, serverErrorMessenger) {

    $scope.stats = {};

    $http.get('/stats/' + $routeParams.thingName).then(function(data, status) {
        $scope.stats = data.data;
        serverErrorMessenger.clearError();
    }, function(data) {
        serverErrorMessenger.reportError(data);
    });
}]).controller('SubmitCtrl', ['$scope', '$http', 'multipartForm', 'serverErrorMessenger', function($scope, $http, multipartForm, serverErrorMessenger) {
    $scope.submission = {};

    $scope.send = function() {

        $scope.loading = true;

        multipartForm.post('/addNew/', $scope.submission).then(function (data, status) {
            serverErrorMessenger.clearError();
            $scope.loading = false;

            if(data.data.completed) {
                $scope.submitCompleted = true;
                $scope.messages = null;
            }
            else {
                $scope.messages = data.data.messages;
            }
        }, function (data, status) {
            $scope.loading = false;
            serverErrorMessenger.reportError(data);
        });
    };

    $scope.reset = function () {
        $scope.submitCompleted = false;
        $scope.submission = {};
        $scope.messages = null;
    };
}]).controller('LeadersCtrl', ['$scope', '$http', 'serverErrorMessenger', function ($scope, $http, serverErrorMessenger) {
    $scope.topThings = [];
    $scope.bottomThings = [];
    
    $http.get('/leaders/').then(function (data, status) {
        serverErrorMessenger.clearError();
        $scope.topThings = data.data.topThings;
        $scope.bottomThings = data.data.bottomThings;
    }, function (data, status) {
        serverErrorMessenger.reportError(data);
    })
}]).controller('MatchupCtrl', ['$scope', '$http', 'serverErrorMessenger', 'encodeFilter', function ($scope, $http, serverErrorMessenger, encodeFilter) {
    $scope.matchup = {
        nameInputs: ['', ''],
        things: [],
        url: ""
    };

    $scope.checkThing = function(idx) {
        $scope.loading = true;

        $http.post('/checkThing/', {'name': $scope.matchup.nameInputs[idx]}).then(function (data, status) {
            serverErrorMessenger.clearError();
            $scope.loading = false;
            $scope.matchup.things[idx] = data.data.thing;
            $scope.bucket = $scope.bucket || data.data.bucket;

            //set up URL
            if($scope.matchup.things[0] && $scope.matchup.things[1]) {
                $scope.matchup.url = "https://www.pickthebetterone.com/m/" + encodeFilter($scope.matchup.things[0].name) + "/" + encodeFilter($scope.matchup.things[1].name);
            }
            else {
                $scope.matchup.url = "";
            }
        }, function (data, status) {
            serverErrorMessenger.reportError(data);
            $scope.loading = false;
        });
    }
}]).controller('ViewMatchupCtrl', ['$scope', '$http', '$routeParams', '$location', 'storeBallot', 'serverErrorMessenger', function ($scope, $http, $routeParams, $location, storeBallot, serverErrorMessenger) {
    $scope.showIntro = true;
    
    $http.post('/vote/specify/', {thingNames: [$routeParams.leftThing, $routeParams.rightThing]}).then(function(data, status) {
        serverErrorMessenger.clearError();
        $scope.data = data.data;
    }, function (data, status) {
        serverErrorMessenger.reportError(data);
    });

    $scope.sendVote = function(index) {

        var postData = {
            id: $scope.data.candidates[index].id,
            opponent: $scope.data.candidates[index ? 0 : 1].id
        };

        $http.post('/vote/', postData).then(function(data, status) {
            serverErrorMessenger.clearError();
            storeBallot.put(data.data);
            $location.path('/');
        }, function (data, status) {
            serverErrorMessenger.reportError(data);
        });
    };

    $scope.skip = function() {
        storeBallot.put(null);
        $location.path('/');
    };
}]).controller('ProfileCtrl', ['$scope', '$http', '$routeParams', 'serverErrorMessenger', function ($scope, $http, $routeParams, serverErrorMessenger) {
    $http.get('/profile/' + $routeParams.username).then(function (data, status) {
        serverErrorMessenger.clearError();
        $scope.user = data.data;
    }, function (data, status) {
        serverErrorMessenger.reportError(data);
    });
}]).controller('SettingsCtrl', ['$scope', '$http', 'serverErrorMessenger', function ($scope, $http, serverErrorMessenger) {
    $scope.profile = {};
    $scope.contact = {};
    $scope.password = {};

    $http.get('/settings/').then(function (data, status) {
        serverErrorMessenger.clearError();
        $scope.username = data.data.username;
        $scope.profile = data.data.profile;
        $scope.contact = data.data.contact;
    }, function (data, status) {
        serverErrorMessenger.reportError(data);
    });

    $scope.updateName = function () {
        $scope.profile.loading = true;

        $http.post('/settings/changeDisplayName/', {displayName: $scope.profile.displayName}).then(function (data) {
            $scope.profile.loading = false;
            serverErrorMessenger.clearError();
            if(data.data.completed)
            {
                $scope.profile.completed = true;
                $scope.profile.messages = null;
            }
            else {
                $scope.profile.messages = data.data.messages;
            }
        }, function (data) {
            $scope.profile.loading = false;
            serverErrorMessenger.reportError(data);
        })
    };
    
    $scope.updateEmail = function () {
        $scope.contact.loading = true;

        var postData = {
            email: $scope.contact.email ? $scope.contact.email : null, //Don't send an empty string to the server; the database will record it as empty string instead of null.
            password: $scope.contact.password
        };

        $http.post('/settings/changeEmail/', postData).then(function (data) {
            $scope.contact.loading = false;
            serverErrorMessenger.clearError();
            if(data.data.completed)
            {
                $scope.contact.completed = true;
                $scope.contact.messages = null;
            }
            else {
                $scope.contact.messages = data.data.messages;
            }
        }, function (data) {
            $scope.contact.loading = false;
            serverErrorMessenger.reportError(data);
        })
    };

    $scope.changePassword = function () {
        $scope.password.loading = true;

        $http.post('/settings/changePassword/', {newPassword: $scope.password.newPassword, oldPassword: $scope.password.oldPassword}).then(function (data) {
            $scope.password.loading = false;
            serverErrorMessenger.clearError();
            if(data.data.completed)
            {
                $scope.password.completed = true;
                $scope.password.messages = null;
            }
            else {
                $scope.password.messages = data.data.messages;
            }
        }, function (data) {
            $scope.password.loading = false;
            serverErrorMessenger.reportError(data);
        })
    };
}]).controller('ErrorReportCtrl', ['$scope', 'serverErrorMessenger', function ($scope, serverErrorMessenger) {
    $scope.serverError = false;
    serverErrorMessenger.subscribe(function (info) {
        $scope.serverError = true;
        $scope.errorInfo = info;
    }, function () {
        $scope.serverError = false;
        $scope.errorInfo = {};
    });
}]).controller('LoginCtrl', ['$scope', '$http', 'serverErrorMessenger', function($scope, $http, serverErrorMessenger) {
    $scope.registration = {};
    $scope.loginInfo = {};

    $http.get('/checkSession/').then(function (data) {
        serverErrorMessenger.clearError();
        $scope.loggedIn = data.data.loggedIn;
        $scope.username = data.data.username;
    }, function (data) {
        serverErrorMessenger.reportError(data);
    });

    $scope.register = function () {
        if(!$scope.registration.agreement) {
            return $scope.messages = ["You must agree to the terms of service."];
        }

        $scope.registration.loading = true;

        var postData = {
            username: $scope.registration.username,
            password: $scope.registration.password,
            email: $scope.registration.email ? $scope.registration.email : null //Don't send an empty string to the server; the database will record it as empty string instead of null.
        };

        $http.post('/register/', postData).then(function (data, status) {
            serverErrorMessenger.clearError();
            $scope.registration.loading = false;
            if(data.data.completed) {
                $scope.loggedIn = true;
                $scope.username = data.data.username;
                $scope.messages = null;
            }
            else {
                $scope.messages = data.data.messages;
            }
        }, function (data, status) {
            serverErrorMessenger.reportError(data);
            $scope.registration.loading = false;
        });
    };

    $scope.login = function () {
        $scope.loginInfo.loading = true;

        var postData = {
            username: $scope.loginInfo.username,
            password: $scope.loginInfo.password
        };

        $http.post('/login/', postData).then(function (data, status) {
            serverErrorMessenger.clearError();
            $scope.loginInfo.loading = false;
            if(data.data.completed) {
                $scope.loggedIn = true;
                $scope.username = data.data.username;
                $scope.badLogin = false;
            }
        }, function (data, status) {
            $scope.loginInfo.loading = false;
            if(data.status === 401 || data.status === 400) {
                $scope.badLogin = true;
            }
            else {
                serverErrorMessenger.reportError(data);
            }
        });
    }
}]).controller('ResetCtrl', ['$scope', '$http', 'serverErrorMessenger', function ($scope, $http, serverErrorMessenger) {
    $scope.send = function (val) {
        $http.post('/reset/', {identity: val}).then(function (data) {
            serverErrorMessenger.clearError();
            $scope.completed = data.data.completed;
            $scope.messages = data.data.messages;
        }, function (data) {
            serverErrorMessenger.reportError(data);
        });
    };
}]).controller('NewPasswordCtrl', ['$scope', '$http', '$routeParams', 'serverErrorMessenger', function ($scope, $http, $routeParams, serverErrorMessenger) {
    $http.post('/reset/' + $routeParams.token).then(function (data) {
        serverErrorMessenger.clearError();
        $scope.completed = data.data.completed;
        $scope.newPassword = data.data.newPassword;
        $scope.failed = !data.data.completed;
        $scope.messages = data.data.messages;
    }, function (data) {
        serverErrorMessenger.reportError(data);
    })
}]).controller('VerifyEmailCtrl', ['$scope', '$http', '$routeParams', 'serverErrorMessenger', function ($scope, $http, $routeParams, serverErrorMessenger) {
    $http.post('/verify/' + $routeParams.token).then(function (data) {
        serverErrorMessenger.clearError();
        $scope.completed = data.data.completed;
        $scope.failed = !data.data.completed;
        $scope.messages = data.data.messages;
    }, function (data) {
        serverErrorMessenger.reportError(data);
    })
}]);