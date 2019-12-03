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

    $scope.treeCtrl = {
        treeConfig: {
            isSearchOpen: true, // 是否开启搜索
            isFreshOpen: true, // 是否开启刷新
            isAutoFreshOpen: true, // 是否开启自动刷新
            freshFrequency: true, // 刷新频率
            isTopExtend: true, // 是否开启一级展开
        },
        liSelected: function (selectedLi) {
            console.log(selectedLi);
        }
    };

    $http.get('tree_select/region.json').success(function(ret) {
        var tree = ret.data;
        $scope.regionCtrl.tree = {
            children: tree
        };
    });
});