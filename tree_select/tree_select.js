var main = angular.module('directives');

main.directive("treeSelect", function ($compile, $timeout) {
    return {
        restrict: "E",
        scope: {
            treeConfig: '=',
            tree: '=',
            setValue: '=',
            oneCombineMode: '@',
        },
        templateUrl: "./tree_select/tree_select.html",
        link: function (scope, ele, attrs) {
            var treeConfig = {
                entityField: '',
                valueField: '',
                textField: '',
                childrenField: '',
                beforeSelect: function () {
                    return true;
                },
                afterSelect: function () {
                    return true;
                }
            };
            scope.treeConfig = angular.extend(treeConfig, scope.treeConfig);

            // 找路径: 每个路径的上的节点均满足 obj[key] === value 的条件
            var findPathInTree = function (tree, key, value, resetFn) {
                if (!tree) {
                    return [];
                }

                var leaf = null;
                for (var i = 0; i < tree.length; i++) {
                    leaf = tree[i][scope.treeConfig.entityField];
                    if (leaf[key] === value) {
                        resetFn(leaf);
                        return [tree[i]].concat(findPathInTree(tree[i][scope.treeConfig.childrenField], key, value, resetFn));
                    }
                }
                return [];
            };
            var resetTreeSelected = function (tree, resetFn) {
                if (!tree) { return; }

                for (var i = 0; i < tree.length; i++) {
                    resetFn(tree[i][scope.treeConfig.entityField]);
                    if (tree[i][scope.treeConfig.childrenField]) {
                        resetTreeSelected(tree[i][scope.treeConfig.childrenField], resetFn);
                    }
                }
            };
            // 找路径: 最后的节点满足 obj[key] === value 的条件
            var findPathInTreeLeaf = function (tree, key, value) {
                if (!tree) {
                    return [];
                }

                var path = [],
                    leaf = null;
                for (var i = 0; i < tree.length; i++) {
                    leaf = tree[i][scope.treeConfig.entityField];
                    if (leaf[key] === value) {
                        return [tree[i]];
                    } else if (tree[i][scope.treeConfig.childrenField] && tree[i][scope.treeConfig.childrenField].length > 0) {
                        path = findPathInTreeLeaf(tree[i][scope.treeConfig.childrenField], key, value);
                        if (path.length === 0) {
                            continue;
                        } else {
                            return [tree[i]].concat(path);
                        }
                    }
                }
                return [];
            };
            // 为每一个改变树路径的函数绑定选中前后的方法
            var bindSelect = function (evalFn, returnFn, context) {
                return function () {
                    if (context.avoidCycle) {
                        context.avoidCycle = false;
                        return;
                    }
                    if (typeof scope.treeConfig.beforeSelect === 'function' &&
                        !scope.treeConfig.beforeSelect(returnFn.apply(context, arguments))) {
                        return;
                    }
                    evalFn.apply(context, arguments);
                    if (typeof scope.treeConfig.afterSelect === 'function') {
                        scope.treeConfig.afterSelect(returnFn.apply(context, arguments));
                    }
                };
            };

            scope.treeConfig.leafPath = [];
            // 为了保持setValue同步，每个改变路径的函数（setValue除外）都需要额外更新setValue值
            // 在此过程中，可能出现死循环，故使用该变量避免: 
            // 每次使用前置true，则触发setValue时相当于跳过具体的执行函数，之后再置为false
            scope.treeConfig.avoidCycle = false;
            scope.treeConfig.isTreeShow = false;

            /**
             * 假设A为移动前所在的节点，B为移动后所在的节点
             * 1. 移动到同级 -- A状态取消选中 B状态变成选中
             * 2. 移动到父级 -- A状态取消选中 A所在的父级取消选中 B状态变成选中 (此时A所在的父级可能就是B)
             * 3. 移动到下级 -- A状态变成选中 B状态变成选中
             * 4. 移动到外部 -- 所有节点状态取消选中，隐藏列表
             * 5. 移动之前的不是节点 -- B状态变成选中
             * 在移动到的目标不明的情况下，无法判断该进行哪种处理。所以进行了一个延迟处理
             */
            var invokeImediately = function () {}, invokeLaterTimer = null;
            scope.moveLeaf = function (parent, leaf) {
                // 情况 5
                leaf[scope.treeConfig.entityField].selected = true;
                if (parent[scope.treeConfig.entityField]) { // 顶级节点不触发调用
                    invokeImediately(parent, leaf);
                }
            };
            scope.leaveLeaf = function (parent, leaf) {
                invokeImediately = function (moveTargetParent, moveTarget) {
                    $timeout.cancel(invokeLaterTimer);
                    invokeLaterTimer = null;
                    // 情况 4
                    if (!moveTarget) {
                        scope.treeConfig.isTreeShow = false;
                        resetTreeSelected(scope.tree[scope.treeConfig.childrenField], function (leaf) {
                            leaf.selected = false;
                        });
                        return;
                    }
                    if (!(leaf && moveTargetParent && parent)) {
                        return;
                    }

                    if (leaf[scope.treeConfig.entityField].level === moveTarget[scope.treeConfig.entityField].level) {
                        // 情况1
                        leaf[scope.treeConfig.entityField].selected = false;
                    } else if (leaf[scope.treeConfig.entityField].level > moveTarget[scope.treeConfig.entityField].level) {
                        // 情况2
                        leaf[scope.treeConfig.entityField].selected = false;
                        // 此时parent和moveTarget可能是同一个节点
                        parent[scope.treeConfig.entityField].selected = false;
                        moveTarget[scope.treeConfig.entityField].selected = true;
                    } else if (leaf[scope.treeConfig.entityField].level < moveTarget[scope.treeConfig.entityField].level) {
                        // 情况3
                        leaf[scope.treeConfig.entityField].selected = true;
                    }
                }
                invokeLaterTimer = $timeout(invokeImediately, 200);
            };

            scope.selectLeaf = bindSelect(function (leaf) {
                this.leafPath = findPathInTree(scope.tree[scope.treeConfig.childrenField], 'selected', true, function (item) {
                    item.selected = false;
                });
                if (scope.setValue !== leaf[this.entityField][this.valueField]) {
                    this.avoidCycle = true;
                }
                scope.setValue = leaf[this.entityField][this.valueField];
                // 隐藏列表
                scope.treeConfig.isTreeShow = false;
                invokeImediately = function () {};
            }, function (leaf) {
                return leaf;
            }, scope.treeConfig);

            scope.selectPath = bindSelect(function (index) {
                this.leafPath = this.leafPath.splice(0, index + 1);
                this.avoidCycle = true;
                scope.setValue = this.leafPath[index];
            }, function (index) {
                return this.leafPath[index];
            }, scope.treeConfig);

            scope.unbindWatch = scope.$watch('setValue', bindSelect(function (newVal, oldVal, sco) {
                if (oldVal === newVal) {
                    return;
                }

                var treePath = findPathInTreeLeaf(scope.tree[scope.treeConfig.childrenField],
                    scope.treeConfig.valueField, newVal);
                this.leafPath = treePath;
            }, function (newVal, oldVal, sco) {
                return this.leafPath[this.leafPath.length - 1];
            }, scope.treeConfig));

            scope.$on("$destroy", function () {
                scope.unbindWatch();
            });
        }
    }
});