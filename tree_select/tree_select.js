var main = angular.module('directives');

main.directive("treeSelect", function ($compile, $timeout) {
    return {
        restrict: "E",
        scope: {
            treeConfig: '=',
            tree: '='
            // oneCombineMode: '@',
        },
        templateUrl: "./tree_select/tree_select.html",
        link: function (scope, ele, attrs) {
            var treeConfig = {
                isShow: true,
                entityField: '',
                valueField: '',
                textField: '',
                childrenField: '',
                selectedNode: null,
                beforeSelect: function () {
                    return true;
                },
                afterSelect: function () {
                    return true;
                }
            };
            scope.treeConfig = angular.extend(treeConfig, scope.treeConfig);

            // 找路径: 每个路径的上的节点均满足 obj[key] === value 的条件
            var findPathInTree = function (tree, key, value, resetFn, path, entityField, childrenField) {
                if (!tree || !tree.length) {
                    return path;
                }

                var leaf = null;
                for (var i = 0; i < tree.length; i++) {
                    leaf = tree[i][entityField];
                    if (leaf[key] === value) {
                        resetFn(leaf);
                        path.push(tree[i]);
                        return findPathInTree(tree[i][childrenField], key, value,
                            resetFn, path, entityField, childrenField);
                    }
                }
                return path;
            };
            var resetTree = function (tree, resetFn, entityField, childrenField) {
                if (!tree) { return; }

                if (tree[childrenField]) {
                    for (var i = 0; i < tree[childrenField].length; i++) {
                        resetFn(tree[childrenField][i][entityField]);
                        resetTree(tree[childrenField][i], resetFn, entityField, childrenField);
                    }
                    resetFn(tree[entityField]);
                }
            };
            // 找路径: 最后的节点满足 obj[key] === value 的条件
            var findPathInTreeLeaf = function (tree, key, value, entityField, childrenField) {
                if (!tree || !tree.length) {
                    return [];
                }

                var path = [],
                    leaf = null;
                for (var i = 0; i < tree.length; i++) {
                    leaf = tree[i][entityField];
                    if (leaf[key] === value) {
                        return [tree[i]];
                    } else if (tree[i][childrenField] && tree[i][childrenField].length > 0) {
                        path = findPathInTreeLeaf(tree[i][childrenField], key, value, entityField, childrenField);
                        if (path.length) {
                            path.unshift(tree[i]);
                            return path;
                        }
                    }
                }
                return [];
            };
            var resetPathInTreeLeaf = function (tree, key, value, resetFn, entityField, childrenField) {
                if (!tree) { return false; }

                if (tree[entityField][key] === value) {
                    return true;
                }
                if (tree[childrenField]) {
                    var correctNode = false;
                    for (var i = 0; i < tree[childrenField].length; i++) {
                        correctNode = resetPathInTreeLeaf(tree[childrenField][i], 
                            key, value, resetFn, entityField, childrenField);
                        if (correctNode) {
                            resetFn(tree[childrenField][i][entityField]);
                            resetFn(tree[entityField]);
                            return true;
                        }
                    }
                }
                return false;
            };

            var unbind = scope.$watchCollection("tree", function (newVal) {
                console.dir(newVal)
                if (newVal && newVal[scope.treeConfig.entityField]) {
                    newVal[scope.treeConfig.entityField].open = true;
                }
            });
            var unbind2 = scope.$watchCollection("treeConfig.setValue", function (newVal) {
                var selectNodes = findPathInTreeLeaf(scope.tree, scope.treeConfig.valueField, newVal, 
                    scope.treeConfig.entityField, scope.treeConfig.childrenField);
                var selectedNode;
                if (selectNodes.length) {
                    selectedNode = selectNodes[selectNodes.length - 1];
                    scope.selectNode(selectedNode);
                } else {
                    scope.selectNode(null);
                }
            });

            var lastParentNode = null, lastNode = null;
            var invokeLater = null;
            scope.showTreeNode = function (event, parentNode, node) {
                event.stopPropagation();
                invokeLater && $timeout.cancel(invokeLater);
                var entityField = scope.treeConfig.entityField;
                if (lastParentNode && node && lastParentNode !== node &&
                    lastParentNode[entityField].level === node[entityField].level) {
                    lastParentNode[entityField].open = false;
                }

                parentNode[entityField].open = true;
                if (node) {
                    node[entityField].open = true;
                    resetPathInTreeLeaf(scope.tree, "magicId", node[entityField].magicId, function (nodeData) {
                        nodeData.open = true;
                    }, entityField, scope.treeConfig.childrenField);
                }
                
                lastParentNode = null;
                lastNode = null;
            };
            scope.hideTreeNode = function (event, parentNode, node) {
                event.stopPropagation();
                lastParentNode = parentNode;
                if (node) {
                    node[scope.treeConfig.entityField].open = false;
                    lastNode = node;
                }

                invokeLater && $timeout.cancel(invokeLater);
                invokeLater = $timeout(function () {
                    resetTree(scope.tree, function (nodeData) {
                        nodeData.open = false;
                    }, scope.treeConfig.entityField, scope.treeConfig.childrenField);
                }, 100);
            };
            scope.selectNode = function (node) {
                if (scope.treeConfig.beforeSelect) {
                    if (!scope.treeConfig.beforeSelect(node)) {
                        return;
                    }
                }
                scope.treeConfig.selectedNode = node || null;
                if (scope.treeConfig.afterSelect) {
                    scope.treeConfig.afterSelect(node);
                }
            };

            
            scope.$on("$destroy", function () {
                unbind();
            });
        }
    }
});