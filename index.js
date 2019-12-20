angular.module("directives").controller("mainCtrl", function ($scope, $http) {

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
                region && console.log("after: " + region.originEntity.regionName);
            },
            beforeSelect: function (region) {
                region && console.log("before: " + region.originEntity.regionName);
                return true;
            }
        },
        

        regionConfig: {
            userMagicId: '11',
            setRegion: function () {
                
            },
            getSelectedRegion: function () {
                
            },
            setRegionParent: function () {
                
            },
            regionChanged: function (region) {
                console.log(region.originEntity.regionName);
            }
        },
        setLeaf: function (regionCode) {
            this.regionConfig.setRegion(regionCode);
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

    $http.get('src/tree_select/region.json').success(function(ret) {
        var tree = ret.data;
        var firstLevel = parseInt(tree[0].originEntity.level);
        $scope.regionCtrl.tree = {
            children: tree,
            originEntity: {
                level: (firstLevel - 1)
            }
        };
    });

    $scope.carouselExt = {
        data: [{
            imageUrl: "images/v10.jpg"
        }, {
            imageUrl: "images/v11.jpg"
        }, {
            imageUrl: "images/v12.jpg"
        }, {
            imageUrl: "images/v13.jpg"
        }, {
            imageUrl: "images/v14.jpg"
        }],
        wrapperConfig: {
            isPlay: false,
            layout: 'v',
            playAnimation: 'linear'
        },
        slideConfig: {
        }
    };
});