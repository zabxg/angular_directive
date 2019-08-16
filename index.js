var main = angular.module("directives", []);

main.controller("mainCtrl", function ($scope, $http) {
    $scope.txt = "angular loaded";

    $scope.name = "yangbo";
    $scope.say = function() {
        // alert('hello!');
    };


    $scope.regionCtrl = {
        tree: [],
        regionName: '',
        regionSelected: null,
        treeConfig: {
            tree: [],
            entityField: 'originEntity',
            valueField: 'regionName',
            // valueField: 'regionCode',
            textField: 'regionName',
            childrenField: 'children',
            setLeaf: function () { },
            afterSelect: function (region) {
                console.dir(region);
            },
            beforeSelect: function (region) {
                // console.dir(region);
                return true;
            }
        },
        
        setLeaf: function (regionName) {
            this.regionSelected = regionName;
        }
    };

    $http.get('tree_select/region.json').success(function(data) {
        $scope.regionCtrl.tree = {
            children: data.region
        };
    });
});