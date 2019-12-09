define(['jquery'], function($) {
    /**
     * @use <region-select tree="" set-value="" tree-config=""></region-select>
     * @param {Object} scope
     * @param {Function} scope.regionChanged 区域选择回调事件，参数为`regionCode`
     * @param {Object} scope.regionConfig 
     * @param {String} scope.regionConfig.userMagicId 必须，用户magicId，获取权限内的区域树
     * @param {Function} scope.regionConfig.setSelectedRegion 必须，显式设置区域
     * @param {Function} scope.regionConfig.getSelectedRegion 必须，获取区域实体
     * @param {Function} scope.regionConfig.setSelectedRegionParent 显式设置区域为其父级
     */
    var directives = angular.module('components.regionSelect', ['services']);
    directives.directive("regionSelect", function (Models, $timeout, $document, $rootScope, $compile) {
        return {
            restrict: "E",
            scope: {
                regionChanged: '&',
                regionConfig: '='
            },
            template: '<p class="tree-select-path"\
                    ng-mouseover="showTree()"\
                    ng-mouseout="hideTree()">\
                    <span class="tree-select-node" ng-show="regionCtrl.regionPath.length===0">_</span>\
                    <span ng-repeat="leaf in regionCtrl.regionPath" ng-class="{\'next\':!$first}"\
                        class="tree-select-node" ng-click="regionCtrl.selectPath($index)"\
                        >{{leaf.originEntity.regionName}}</span>\
                </p>',
            compile: function (ele, attrs) {
                var treeSelectTemplate = "<tree-select tree-config='regionConfig' tree='regionCtrl.tree'\
                    one-combine-mode='Y' class='tree-select'></tree-select>";
                var scope = $rootScope.$new();
                scope.regionConfig = {
                    tree: [],
                    entityField: 'originEntity',
                    valueField: 'regionCode',
                    textField: 'regionName',
                    childrenField: 'children',
                    setValue: null,
                    setLeaf: function () { },
                    afterSelect: function (region) {
                        if (region) {
                            scope.regionCtrl.regionSelected = region;
                            scope.regionChanged();
                        }
                    }
                };
                var treeSelectDom = $compile($(treeSelectTemplate))(scope);
                $document.append(treeSelectDom);

                return function link($scope, $element, $attrs) {
                    $scope.regionCtrl = {
                        tree: [],
                        regionPath: [],
                        init: function () {
                            var self = this;
                            self.getRegion().then(function (regionTree) {
                                if (regionTree[0] && regionTree[0].originEntity && regionTree[0].originEntity.regionCode) {
                                    $timeout(function () {
                                        scope.regionConfig.setValue = regionTree[0].originEntity.regionCode;
                                        self.regionSelected = regionTree[0];
                                        self.regionSelectedCode = regionTree[0].originEntity.regionCode;
                                        self.tree = {
                                            children: regionTree,
                                            entityField: {}
                                        };
                                    });
                                }
                            });
                        },

                        getRegion: function () {
                            // var deferred = $.Deferred();
                            // Models.Province.one("config/region/tree", scope.regionConfig.userMagicId).get("").then(function (ret) {
                            //     deferred.resolve(ret.data || []);
                            // }, function () {
                            //     deferred.resolve([]);
                            // });
                            // return deferred.promise();

                            $.ajax({
                                type: 'GET',
                                url: "/tree_select/region.json",
                                dataType: 'json',
                                success: function (data) {
                                    console.dir(data);
                                }
                            });
                        },

                        showTree: function () {
                            
                        },
                        hideTree: function () {
                            
                        },

                        selectPath: function (index) {
                            
                        }
                    };

                    // 暴露给外部的方法: setRegion | getRegion | setRegionParent
                    $scope.regionConfig.setRegion = function (regionCode) {
                        scope.regionConfig.setValue = regionCode;
                        $scope.regionCtrl.regionSelectedCode = regionCode;
                    };
                    $scope.regionConfig.getRegion = function () {
                        return $scope.regionCtrl.regionSelected.originEntity;
                    };
                    /**
                     * 显式设置区域为其父级
                     * @param {Number} index 传-1为上一级，-2为上两级
                     */
                    $scope.regionConfig.setRegionParent = function (index) {
                        if ($scope.regionCtrl.regionPath) {
                            var regionIndex = $scope.regionCtrl.regionPath.length - 1 + index;
                            if (regionIndex >= 0) {
                                $scope.regionCtrl.regionSelectedCode = 
                                    $scope.regionCtrl.regionPath[regionIndex].originEntity.regionCode;
                            }
                        }
                    };

                    $scope.regionCtrl.init();
                }
            }
        };
    });
});