/**
 * AngularJS module setup for admin pages: attaches JWT to every $http request.
 * Pages must load this after angular.min.js, then extend with .controller(...).
 */
angular.module("myModule", [])
    .factory("petcareAuthInterceptor", function () {
        return {
            request: function (config) {
                var t = localStorage.getItem("token");
                if (t) {
                    config.headers = config.headers || {};
                    config.headers.Authorization = "Bearer " + t;
                }
                return config;
            }
        };
    })
    .config(["$httpProvider", function ($httpProvider) {
        $httpProvider.interceptors.push("petcareAuthInterceptor");
    }]);
