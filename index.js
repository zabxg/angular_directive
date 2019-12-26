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
        data1: [{
            imageUrl: "images/num_1.png"
        }, {
            imageUrl: "images/num_2.png"
        }, {
            imageUrl: "images/num_3.png"
        }, {
            imageUrl: "images/num_4.png"
        }, {
            imageUrl: "images/num_5.png"
        }, {
            imageUrl: "images/num_6.png"
        }, {
            imageUrl: "images/num_7.png"
        }, {
            imageUrl: "images/num_8.png"
        }, {
            imageUrl: "images/num_9.png"
        }, {
            imageUrl: "images/num_10.png"
        }],
        data2: [{
            imageUrl: "images/num_6.png"
        }, {
            imageUrl: "images/num_7.png"
        }, {
            imageUrl: "images/num_8.png"
        }, {
            imageUrl: "images/num_9.png"
        }, {
            imageUrl: "images/num_10.png"
        }],
        data: [{
            imageUrl: "images/num_1.png"
        }, {
            imageUrl: "images/num_2.png"
        }, {
            imageUrl: "images/num_3.png"
        }, {
            imageUrl: "images/num_4.png"
        }, {
            imageUrl: "images/num_5.png"
        }, {
            imageUrl: "images/num_6.png"
        }, {
            imageUrl: "images/num_7.png"
        }, {
            imageUrl: "images/num_8.png"
        }, {
            imageUrl: "images/num_9.png"
        }, {
            imageUrl: "images/num_10.png"
        }],
        wrapperConfig: {
            isPlay: false,
            viewSize: 3,
            // layout: 'v',
            playAnimation: 'linear'
        },
        slideConfig: {
        },
        change: function () {
            if (this.data[0].imageUrl !== "images/num_1.png") {
                this.data = this.data1;
            } else {
                this.data = this.data2;
            }
        },
        add: function () {
            this.data.push({
                imageUrl: "images/num_infinite.png"
            });
        },
        remove: function () {
            this.data.pop();
        },
        increaseView: function () {
            this.wrapperConfig.viewSize++;
        },
        reduceView: function () {
            this.wrapperConfig.viewSize--;
        },
        alert: function (msg) {
            alert("This is: " + msg);
        }
    };
});