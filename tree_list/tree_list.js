var main = angular.module('directives');

// 是否开启搜索
// 是否开启刷新
// 是否开启自动刷新/刷新频率
// 是否开启一级展开
// 选中的回调
main.directive("treeList", function ($compile, $timeout) {
    return {
        restrict: "E",
        scope: {
            treeConfig: '=',
            liSelected: '&',
        },
        templateUrl: "./tree_list/tree_list.html",
        link: function (scope, ele, attrs) {

            var treeConfig = {
                isSearchOpen: true, // 是否开启搜索
                isFreshOpen: true, // 是否开启刷新
                isAutoFreshOpen: true, // 是否开启自动刷新
                freshFrequency: true, // 刷新频率
                isTopExtend: true // 是否开启一级展开
            };
            treeConfig = angular.extend(treeConfig, scope.treeConfig);

            var setting = {
                addHoverDom: addHoverDom,
                removeHoverDom: removeHoverDom,
                addDiyDom: addDiyDom
            };

            var zNodes = [{
                    id: 1,
                    name: "hover事件显示控件",
                    open: true,
                    nodes: [{
                            id: 11,
                            name: "按钮1"
                        },
                        {
                            id: 12,
                            name: "按钮2"
                        },
                        {
                            id: 13,
                            name: "下拉框"
                        },
                        {
                            id: 141,
                            name: "文本1"
                        },
                        {
                            id: 142,
                            name: "文本2"
                        },
                        {
                            id: 15,
                            name: "超链接"
                        }

                    ]
                },
                {
                    id: 2,
                    name: "始终显示控件",
                    open: true,
                    nodes: [{
                            id: 21,
                            name: "按钮1"
                        },
                        {
                            id: 22,
                            name: "按钮2"
                        },
                        {
                            id: 23,
                            name: "下拉框"
                        },
                        {
                            id: 24,
                            name: "文本"
                        },
                        {
                            id: 25,
                            name: "超链接"
                        }
                    ]
                }
            ];

            function addHoverDom(treeId, treeNode) {
                if (treeNode.parentNode && treeNode.parentNode.id != 1) return;
                var aObj = $("#" + treeNode.tId + IDMark_A);
                if (treeNode.id == 11) {
                    if ($("#diyBtn_" + treeNode.id).length > 0) return;
                    var editStr = "<span id='diyBtn_space_" + treeNode.id + "' >&nbsp;</span><button type='button' class='diyBtn1' id='diyBtn_" + treeNode.id + "' title='" + treeNode.name + "' onfocus='this.blur();'></button>";
                    aObj.append(editStr);
                    var btn = $("#diyBtn_" + treeNode.id);
                    if (btn) btn.bind("click", function () {
                        alert("diy Button for " + treeNode.name);
                    });
                } else if (treeNode.id == 12) {
                    if ($("#diyBtn_" + treeNode.id).length > 0) return;
                    var editStr = "<button type='button' class='diyBtn2' id='diyBtn_" + treeNode.id + "' title='" + treeNode.name + "' onfocus='this.blur();'></button>";
                    aObj.after(editStr);
                    var btn = $("#diyBtn_" + treeNode.id);
                    if (btn) btn.bind("click", function () {
                        alert("diy Button for " + treeNode.name);
                    });
                } else if (treeNode.id == 13) {
                    if ($("#diyBtn_" + treeNode.id).length > 0) return;
                    var editStr = "<span id='diyBtn_space_" + treeNode.id + "' >&nbsp;</span><select class='selDemo ' id='diyBtn_" + treeNode.id + "'><option value=1>1</option><option value=2>2</option><option value=3>3</option></select>";
                    aObj.append(editStr);
                    var btn = $("#diyBtn_" + treeNode.id);
                    if (btn) btn.bind("change", function () {
                        alert("diy Select value=" + btn.attr("value") + " for " + treeNode.name);
                    });
                } else if (treeNode.id == 141) {
                    if ($("#diyBtn_" + treeNode.id).length > 0) return;
                    var editStr = "<span class='test' id='diyBtn_" + treeNode.id + "'>Text Demo...</span>";
                    aObj.append(editStr);
                } else if (treeNode.id == 142) {
                    if ($("#diyBtn_" + treeNode.id).length > 0) return;
                    var editStr = "<span id='diyBtn_" + treeNode.id + "'>Text Demo...</span>";
                    aObj.after(editStr);
                } else if (treeNode.id == 15) {
                    if ($("#diyBtn1_" + treeNode.id).length > 0) return;
                    if ($("#diyBtn2_" + treeNode.id).length > 0) return;
                    var editStr = "<a id='diyBtn1_" + treeNode.id + "' onclick='alert(1);return false;' style='margin:0 0 0 5px;'>链接1</a>" +
                        "<a id='diyBtn2_" + treeNode.id + "' onclick='alert(2);return false;' style='margin:0 0 0 5px;'>链接2</a>";
                    aObj.append(editStr);
                }
            }

            function removeHoverDom(treeId, treeNode) {
                if (treeNode.parentNode && treeNode.parentNode.id != 1) return;
                if (treeNode.id == 15) {
                    $("#diyBtn1_" + treeNode.id).unbind().remove();
                    $("#diyBtn2_" + treeNode.id).unbind().remove();
                } else {
                    $("#diyBtn_" + treeNode.id).unbind().remove();
                    $("#diyBtn_space_" + treeNode.id).unbind().remove();
                }
            }

            function addDiyDom(treeId, treeNode) {
                if (treeNode.parentNode && treeNode.parentNode.id != 2) return;
                var aObj = $("#" + treeNode.tId + IDMark_A);
                if (treeNode.id == 21) {
                    var editStr = "<button type='button' class='diyBtn1' id='diyBtn_" + treeNode.id + "' title='" + treeNode.name + "' onfocus='this.blur();'></button>";
                    aObj.append(editStr);
                    var btn = $("#diyBtn_" + treeNode.id);
                    if (btn) btn.bind("click", function () {
                        alert("diy Button for " + treeNode.name);
                    });
                } else if (treeNode.id == 22) {
                    var editStr = "<button type='button' class='diyBtn2' id='diyBtn_" + treeNode.id + "' title='" + treeNode.name + "' onfocus='this.blur();'></button>";
                    aObj.after(editStr);
                    var btn = $("#diyBtn_" + treeNode.id);
                    if (btn) btn.bind("click", function () {
                        alert("diy Button for " + treeNode.name);
                    });
                } else if (treeNode.id == 23) {
                    var editStr = "<select class='selDemo' id='diyBtn_" + treeNode.id + "'><option value=1>1</option><option value=2>2</option><option value=3>3</option></select>";
                    aObj.after(editStr);
                    var btn = $("#diyBtn_" + treeNode.id);
                    if (btn) btn.bind("change", function () {
                        alert("diy Select value=" + btn.attr("value") + " for " + treeNode.name);
                    });
                } else if (treeNode.id == 24) {
                    var editStr = "<span id='diyBtn_" + treeNode.id + "'>Text Demo...</span>";
                    aObj.after(editStr);
                } else if (treeNode.id == 25) {
                    var editStr = "<a id='diyBtn1_" + treeNode.id + "' onclick='alert(1);return false;'>链接1</a>" +
                        "<a id='diyBtn2_" + treeNode.id + "' onclick='alert(2);return false;'>链接2</a>";
                    aObj.after(editStr);
                }
            }
            var zTreeInstance = $("#treeDemo").zTree(setting, clone(zNodes, ""));

            // scope.$on("$destroy", function () {
            //     scope.unbindWatch();
            // });
        }
    }
});