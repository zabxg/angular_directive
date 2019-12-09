var directives = angular.module('directives');
var getPos = function (element) {
    var eleOffset = $(element).offset();
    eleOffset.height = $(element).height();
    return eleOffset;
};
directives.directive("regionSelect", function ($timeout, $document, $http, $rootScope, $compile) {
    return {
        restrict: "E",
        scope: {
            regionConfig: '='
        },
        template: '<p class="tree-select-path"\
                ng-mouseover="regionCtrl.showTree()"\
                ng-mouseout="regionCtrl.hideTree()">\
                <span class="tree-select-node" ng-show="regionCtrl.regionPath.length===0">_</span>\
                <span ng-repeat="leaf in regionCtrl.regionPath track by $index"\
                    ng-class="{\'next\':!$first}"\
                    class="tree-select-node" ng-click="regionCtrl.selectPath($index)"\
                    >{{leaf.originEntity.regionName}}</span>\
            </p>',
        compile: function (ele, attrs) {
            var valueField = 'regionCode';

            var initScope = function (scope, regionScope) {
                scope.treeConfig = {
                    tree: null,
                    isShow: false,
                    entityField: 'originEntity',
                    valueField: valueField,
                    textField: 'regionName',
                    childrenField: 'children',
                    afterSelect: function (region) {
                        if (region) {
                            regionScope.regionScope.regionCtrl.selectRegion(region.originEntity[valueField]);
                        }
                    }
                };
                var pos = getPos(ele);
                scope.treeStyle = {
                    left: pos.left + "px",
                    top: pos.top + pos.height + "px"
                };
            };

            var compileTree = function (scope, regionScope) {
                var template = "<tree-select tree-config='treeConfig'\
                    tree='treeConfig.tree' class='tree-select' ng-style='treeStyle'></tree-select>";
                initScope(scope, regionScope);
                var dom = $(template);
                var linkFn = $compile(dom);
                $(document.body).append(linkFn(scope));
                return {
                    linkFn: linkFn,
                    $destroy: function () {
                        dom.remove();
                        treeScope.$destroy();
                    }
                };
            };

            var treeScope = $rootScope.$new();
            var invokerScope = {
                regionScope: {}
            };
            var compileRes = compileTree(treeScope, invokerScope);
            var treeSelectLinkFn  = compileRes.linkFn;
            var treeSelectDestroy = compileRes.$destroy;

            return function link(regionScope, $element, $attrs) {
                invokerScope.regionScope = regionScope;
                
                // 找路径: 最后的节点满足 obj[key] === value 的条件
                var findPathInTreeLeaf = function (tree, path, key, value, entityField, childrenField) {
                    if (!tree) {
                        return;
                    }
    
                    if (tree[entityField][key] === value) {
                        path.unshift(tree);
                        return true;
                    }

                    if (tree[childrenField]) {
                        var correctNode = false;
                        for (var i = 0; i < tree[childrenField].length; i++) {
                            correctNode = findPathInTreeLeaf(tree[childrenField][i], 
                                path, key, value, entityField, childrenField);
                            if (correctNode) {
                                path.unshift(tree);
                                return true;
                            }
                        }
                    }
                    return false;
                };

                regionScope.regionCtrl = {
                    tree: null,
                    regionPath: [],
                    regionSelected: null,
                    init: function () {
                        var self = this;
                        // default: select first one; refresh tree data;
                        self.getRegion().then(function (regionTree) {
                            self.regionSelected = regionTree.children[0];
                            self.regionPath = [self.regionSelected];
                            
                            self.tree = regionTree;
                            treeScope.treeConfig.tree = regionTree;
                            treeSelectLinkFn(treeScope);
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
                        return $http.get('tree_select/region.json').then(function(ret) {
                            var tree = ret.data.data;
                            var firstLevel = parseInt(tree[0].originEntity.level);
                            return {
                                children: tree,
                                originEntity: {
                                    level: (firstLevel - 1)
                                }
                            };
                        });
                    },

                    showTree: function () {
                        treeScope.treeConfig.isShow = true;
                    },
                    hideTree: function () {
                        treeScope.treeConfig.isShow = false;
                    },

                    selectRegion: function (regionCode) {
                        var path = [];
                        findPathInTreeLeaf(this.tree.children[0], path, valueField,
                            regionCode, "originEntity", "children");
                        this.regionPath = path;
                        this.regionSelected = path[path.length - 1];
                        regionScope.regionConfig.regionChanged(this.regionSelected);
                    },
                    selectPath: function (index) {
                        var regionLevel = this.regionPath.length;
                        if (index < 0) {
                            index += regionLevel;
                        }
                        if (index <= 0) {
                            this.regionPath = this.regionPath.slice(0, 1);
                        } else {
                            this.regionPath = this.regionPath.slice(0, index + 1);
                        }
                    }
                };

                // 暴露给外部的方法: setRegion | getRegion | setRegionParent
                regionScope.regionConfig.setRegion = function (regionCode) {
                    regionScope.regionCtrl.selectRegion(regionCode);
                };
                regionScope.regionConfig.getRegion = function () {
                    return regionScope.regionCtrl.regionSelected.originEntity;
                };
                /**
                 * 显式设置区域为其父级
                 * @param {Number} index 传-1为上一级，-2为上两级
                 */
                regionScope.regionConfig.setRegionParent = function (index) {
                    if (regionScope.regionCtrl.regionPath) {
                        var regionIndex = regionScope.regionCtrl.regionPath.length - 1 + index;
                        if (regionIndex >= 0) {
                            regionScope.regionCtrl.regionSelected = 
                                regionScope.regionCtrl.regionPath[regionIndex];
                        }
                    }
                };
                
                regionScope.$on("$destroy", function () {
                    treeSelectDestroy();
                    unbind();
                });

                regionScope.regionCtrl.init();
            }
        }
    };
});