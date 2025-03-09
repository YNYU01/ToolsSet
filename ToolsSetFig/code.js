/**
 * [ToolsSet 工具集1.0]
 * ©版权所有：2024-2025 YNYU @lvynyu2.gmail.com
 * 禁止未授权的商用及二次编辑
 * 禁止用于违法行为，如有，与作者无关
 * 二次编辑需将引用部分开源
 * 引用开源库的部分应遵循对应许可
 */
var UI = [300,660];
var vX = figma.viewport.bounds.x,vY = figma.viewport.bounds.y;
figma.skipInvisibleInstanceChildren = true;//忽略不可见元素及其子集

if ( figma.command == 'open' ){
    figma.showUI(__html__,{position:{x:vX,y:vY}});
} else if ( figma.command == 'pixel' ){ 
    //覆盖栅格化
    var info = 1;
    var a = figma.document.currentPage;
    var b = a.selection;
    console.log("原地栅格化：",info,"倍")

    var loading =  figma.notify("生成中，请稍后",{
        position:"bottom",
        isLoading: true,
        timeout: 6000,
    });
    setTimeout(() =>{
        for (var i = 0; i < b.length; i++){
            intXY(b[i]);
            cutNode(a,b[i],info);
            b[i].remove();  
        }
        loading.cancel();
        pickBefore(a.selection);
    },100)
} else if ( figma.command == 'yuhua' ){
    var a = figma.document.currentPage;
    var b = a.selection;
    for (var i = 0; i < b.length; i++){
        var group = figma.group([b[i]]);
        group.name = b[i].name;
        var min = Math.min(b[i].absoluteRenderBounds.width,b[i].absoluteRenderBounds.height);
        var yuhua = Math.ceil(0.044 * min + 6);//蒙版向内缩进值，模糊值则为yuhua*0.8
        //console.log(min,yuhua);
        var mask = figma.createRectangle();
        mask.x = b[i].absoluteRenderBounds.x + yuhua;
        mask.y = b[i].absoluteRenderBounds.y + yuhua;
        mask.width = b[i].absoluteRenderBounds.width - yuhua * 2;
        mask.height = b[i].absoluteRenderBounds.height - yuhua * 2;
        mask.effects = [{
            "type": "LAYER_BLUR",
            "isVisible": true,
            "radius": yuhua * 0.8,
            "blendMode": "PASS_THROUGH"
        }]
        group.insertChild(0,mask);
        var maskG = figma.group([b[i].parent.children[0]]);
        maskG.name = '羽化蒙版';
        maskG.isMask = true;
        maskG.isMaskOutline = false;
        b[i].parent.insertChild(0,b[i].clone());
        b[i].parent.children[0].effects = [{
            "type": "LAYER_BLUR",
            "isVisible": true,
            "radius": yuhua * 0.8,
            "blendMode": "PASS_THROUGH"
        }]
        b[i].parent.children[0].isVisible = false
    }
} else if ( figma.command == 'lineTable' ){
    var a = figma.document.currentPage;
    var b = a.selection;
    var info = 'line'
    easePickTable(info,a,b)  
} else if ( figma.command == 'areaTable' ){
    var a = figma.document.currentPage;
    var b = a.selection;
    var info = 'area'
    easePickTable(info,a,b)  
} else if ( figma.command == 'help' ){
    figma.showUI(__html__);
    figma.ui.hide();
    figma.ui.postMessage(['help','tolink'])//https://ynyu01.github.io/Tools-Help

} else if ( figma.command == 'getnew' ){
    figma.showUI(__html__);
    figma.ui.hide();
    figma.ui.postMessage(['new','tolink'])

} else if ( figma.command == 'tableToArea'){
    var a = figma.document.currentPage;
    var b = a.selection;
    var X = b.map(item => item.absoluteBoundingBox.x)
    var W = b.map(item => item.absoluteBoundingBox.width)
    var XX = [...new Set(X)]
    var WW = [...new Set(W)]
    var Y = b.map(item => item.absoluteBoundingBox.y)
    var H = b.map(item => item.absoluteBoundingBox.height)
    var YY = [...new Set(Y)]
    var HH = [...new Set(H)]
    if ( b.some( node => node.componentProperties[1].value == false || node.componentProperties[2].value == false || node.componentProperties[3].value == false || node.componentProperties[4].value == false)){
        figma.notify("含已合并的表格 / 非全描边表格",{
            type: "error",
            position: "bottom",
            timeout: 3000,
            isLoading: false,
        });
    } else {
        if ( (XX.length == 1 && WW.length == 1 && Math.max(...Y.map((value,index) => value + H[index])) - Math.min(...Y) == H.reduce((acc,item)=> acc + item,0)) ) {
            console.log('竖向合并表格')
            tableToArea(b,'l')        
        } else if ( (YY.length == 1 && HH.length == 1 && Math.max(...X.map((value,index) => value + W[index])) - Math.min(...X) == W.reduce((acc,item)=> acc + item,0))) {
            console.log('横向合并表格')
            tableToArea(b,'h')
        } else if ( XX.length * YY.length == b.length){
            console.log([YY.length,XX.length])
            tableToArea(b,'hl',[YY.length,XX.length])    
        } else {
            console.log('无法合并表格')
        }
    }
}
 
figma.ui.resize(UI[0], UI[1]);

//figma.ui.postMessage({pluginMessage:["light","setTheme"]})

//console.log(viewportX);

//核心功能
figma.ui.onmessage = (message) => { 
    const info = message[0]
    const type = message[1]
    console.log(message)
}