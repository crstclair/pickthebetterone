voteApp.service('multipartForm', ['$http', function($http){ /* Adapted from: https://uncorkedstudios.com/blog/multipartformdata-file-upload-with-angularjs */
    this.post = function(uploadUrl, data){
        var fd = new FormData();
        for(var key in data)
            fd.append(key, data[key]);
        return $http.post(uploadUrl, fd, {
            transformRequest: angular.indentity,
            headers: { 'Content-Type': undefined }
        });
    };
}]).service('storeBallot', [function() {
    var ballot;
    var firstVote = true;

    this.get = function() {
        return ballot;
    };

    this.put = function(b) {
        ballot = b;
        firstVote = false;
    };

    this.isFirstVote = function () {
        return firstVote;
    }
}]).service('serverErrorMessenger', [function () {
    var subscribers = [];
    
    this.reportError = function (info) {
        subscribers.forEach(function (val) {
            val.reportError(info);
        });
    };

    this.clearError = function () {
        subscribers.forEach(function (val) {
            val.clrError();
        });
    };

    this.subscribe = function (receiveError, clrError) {
        subscribers.push({'reportError': receiveError, 'clrError': clrError});
    };
}]);