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
    figma.showUI(__html__,{position:{x:vX,y:vY},themeColors:true});
} else if ( figma.command == 'pixel' ){ 
    //覆盖栅格化
    var info = 1;
    var a = figma.currentPage;
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
    var a = figma.currentPage;
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
    var a = figma.currentPage;
    var b = a.selection;
    var info = 'line'
    easePickTable(info,a,b)  
} else if ( figma.command == 'areaTable' ){
    var a = figma.currentPage;
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
    var a = figma.currentPage;
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
//postmessage(["light","setTheme"])
//console.log(viewportX);

var tabInfo;
var importNum = 1,xx = 0,yy = 0,time = 0,ww = 0,hh = 0;
var find = [],searchTime = 0,seaechOldNodes = [];
var cutMax = 4096;
var stylePage = '附录/变量&样式表';
var mixType = {
    "Pd":mixPd,
    "R":mixR,
    "WH":mixWH,
    "S":mixS,
    "isV":mixisV,
}
var searchType = "Text",searchArea = "Page";
var diffStyleNode = []
var diffColorTime = 0;
var pickTableArea = false;
//核心功能
figma.ui.onmessage = (message) => { 
    const info = message[0]
    const type = message[1]
    //console.log(message)
    //插件自动休眠
    if ( type == "sleep"){
        if (info == true){
            //console.log(type + ":" + info)
            figma.ui.resize(160, 60);
            //figma.ui.moveTo(figma.viewport.positionOnDom.x + figma.viewport.positionOnDom.width - 100,48 + rulerH)
            
        }else{
            figma.ui.resize(UI[0], UI[1]);
        }
    }
    //插件最大化
    if ( type == "big"){
        if (info){
            UI = [UI[0] * 2,UI[1] * 1.3]
            figma.ui.resize(UI[0], UI[1]);  
        } else {
            UI = [300,660]
            figma.ui.resize(UI[0], UI[1]);
        }
    }
    //双击底部获取当前节点信息(开发用)
    if ( type == "getnode"){
        if (figma.currentPage.selection.length > 0){
            console.log("当前节点信息：")
            console.log(figma.currentPage.selection[0])
        } else {
            //console.log(figma.currentPage.parent)
            console.log("未选中对象")
        }
    }
    //批量创建画板
    if (type == "createrframe") {
        console.log("创建画板：",info.length,"个");
        var a = figma.currentPage;
        var b = a.selection;

        //反传对象尺寸信息
        if ( info == 0 && b.length > 0){
            var frameInfo = [];
            b.forEach(item => {
                frameInfo.push(item.name.split(item.width)[0].trim() + '\t' + item.width + '\t' + item.height + '\n')
            })
            postmessage([frameInfo,'getFrame'])
        }


        var gap = 30;
        var maxW ,maxH ;
        var viewX = Math.floor( figma.viewport.center.x - ((figma.viewport.bounds.width/2  - 300)* figma.viewport.zoom))/// figma.viewport.bound.width/2 + 300;
        var viewY = Math.floor(figma.viewport.center.y);
        var x = viewX;
        var y = viewY;
        var allH = [];
        var allW = [];
        var ws = [0];
        var hs = [0];

        function easeframe(info,x,y,gap,isCreater){
            var starX = x, starY = y;
            var kvAll = info.filter(item => item.name.toLowerCase().split("kv").length > 1);
            var HH = info.filter(item => item.w > item.h && item.name.toLowerCase().split("kv").length == 1).sort((a, b) => b.w * b.h - a.w * a.h);//横板
            var maxW = Math.max(...HH.map(item => item.w));//找出最宽的图，作为横板换行标准
            var LL = info.filter(item => item.w < item.h && item.name.toLowerCase().split("kv").length == 1).sort((a, b) => b.w * b.h - a.w * a.h);//竖版
            var maxH = Math.max(...HH.map(item => item.h));//找出最高的图，作为竖版换行标准
            var FF = info.filter(item => item.w == item.h).sort((a, b) => b.w - a.w);//方形
            maxW = Math.max(1920,maxW);
            maxH = Math.max(1920,maxH);//1920是常见KV尺寸
            console.log("最宽",maxW,";最高：",maxH);

            var kvH = [0]
            for(var i = 0; i < kvAll.length; i++){
                var frame = kvAll[i]
                var s = frame.s ? frame.s : '';
                var type = frame.type ? frame.type : '';
                var isPng = type == 'png' ? true : false;
                createFrame({name:frame.name,w:frame.w,h:frame.h,x:x,y:y,s:s,type:type},isPng)
                x += frame.w + gap
                kvH.push(frame.h)
            }

            x = starX;
            y = starY + Math.max(...kvH) + gap;
            console.log("横版起点：",x,y)

            var lineH = [];
            var lineAllW;
            for(var i = 0; i < HH.length; i++){  
                var frame = HH[i];
                var s = frame.s ? frame.s : '';
                var type = frame.type ? frame.type : '';
                var isPng = type.toLowerCase() == 'png' ? true : false;
                createFrame({name:frame.name,w:frame.w,h:frame.h,x:x,y:y,s:s,type:type},isPng);
                lineAllW += frame.w + gap;
                lineH.push(frame.h)
                if (HH[i + 1] && (lineAllW + HH[i + 1].w) <= maxW){
                    x += frame.w + gap;
                } else {
                    //console.log(lineH)
                    x = starX;
                    y += Math.max(...lineH) + gap;
                    lineH = [];
                    lineAllW = 0;
                }
                
            }

            x = starX + maxW + gap;
            y = starY + Math.max(...kvH) + gap;
            console.log("竖版起点：",x,y)

            var lineW = [];
            var lineAllH;
            for(var i = 0; i < LL.length; i++){      
                var frame = LL[i];
                var s = frame.s ? frame.s : '';
                var type = frame.type ? frame.type : '';
                var isPng = type.toLowerCase() == 'png' ? true : false;
                if(frame.name.split('弹窗').length > 1 ){
                    isPng = true
                }
                createFrame({name:frame.name,w:frame.w,h:frame.h,x:x,y:y,s:s,type:type},isPng);
                lineAllH += frame.h + gap;
                lineW.push(frame.w);
                if (LL[i + 1] && (lineAllH + LL[i + 1].h) <= maxH){
                    y += frame.h + gap;
                } else {
                    y = starY + Math.max(...kvH) + gap;
                    x += Math.max(...lineW)+ gap;
                    lineW = [];
                    lineAllH = 0;
                }
                
            }

            x = starX + maxW + gap;
            y = starY + Math.max(...kvH) + gap + maxH;
            console.log("方版起点：",x,y)

            lineH = [];
            lineAllW = 0;
            for(var i = 0; i < FF.length; i++){  
                var frame = FF[i];
                var s = frame.s ? frame.s : '';
                var type = frame.type ? frame.type : '';
                var isPng = type.toLowerCase() == 'png' ? true : false;
                createFrame({name:frame.name,w:frame.w,h:frame.h,x:x,y:y,s:s,type:type},isPng);
                lineAllW += frame.w + gap;
                lineH.push(frame.h)
                if (FF[i + 1] && (lineAllW + FF[i + 1].w) <= maxW){
                    x += frame.w + gap;
                } else {
                    //console.log(lineH)
                    x = starX;
                    y += Math.max(...lineH) + gap;
                    lineH = [];
                    lineAllW = 0;
                }
                
            }

            function createFrame(framedata,isPng){
                var node = figma.createFrame()
                node.x = framedata.x;
                node.y = framedata.y;
                /*
                node.width = framedata.w;
                node.height = framedata.h;
                */
                node.resize(framedata.w,framedata.h)
                var minName = framedata.name + ' ' + framedata.w + '×' + framedata.h;
                var maxName = framedata.name + ' ' + framedata.s + 'k ' + framedata.w + '×' + framedata.h;
                node.name = framedata.s ? maxName : minName
                node.setPluginData('s',String(framedata.s));
                node.setPluginData('type',framedata.type);
                if (isPng) {
                    node.fills = []
                }

            }
        }

        easeframe(info,x,y,gap,true)
    }
    //自动排列
    if ( info == 'autoLayout'){
        var a = figma.currentPage;
        var b = a.selection;
        var x = Math.min(...b.map(item => item.x)),XX = Math.min(...b.map(item => item.x));
        var y = Math.min(...b.map(item => item.y)),YY = Math.min(...b.map(item => item.y));
        var nodes = []
        for ( var i = 0; i < b.length; i++){
            nodes.push({x:b[i].x,y:b[i].y,w:b[i].width,h:b[i].height,i:i,})
            
            if( i == b.length - 1){
                //console.log(nodes)
                var HH = nodes.filter(item => item.w > item.h).sort((a, b) => b.w - a.w);//横板
                var maxW = Math.max(...HH.map(item => item.w))
                var LL = nodes.filter(item => item.w < item.h).sort((a, b) => b.h - a.h);//竖版
                var maxH = Math.max(...HH.map(item => item.h))
                var FF = nodes.filter(item => item.w == item.h).sort((a, b) => b.w - a.w);//方形
                var gap = 30;
                var lineMaxH = [],lineMaxW = [];
                var lineW = 0,lineH = 0;
                for(var e = 0; e < HH.length; e++){
                    if ( e !== HH.length - 1){
                        lineW += HH[e].w + HH[e + 1].w ;
                    }
                    lineMaxH.push([HH[e].h]);
                    //console.log(lineMaxH)                   
                    b[HH[e].i].x = x
                    b[HH[e].i].y = y
                    
                    if ( lineW > maxW){
                        //console.log(lineMaxH) 
                        lineW = 0;
                        x = XX;
                        y = y + Math.max(...lineMaxH) + gap;
                        lineMaxH = []
                    } else {
                        x = x + HH[e].w; 
                    }
                }
                for(var e = 0; e < LL.length; e++){
                    if ( e !== LL.length - 1){
                        lineH += LL[e].h + LL[e + 1].h ;
                    }
                    lineMaxW.push([LL[e].w]);
                    //console.log(lineMaxH)                   
                    b[LL[e].i].x = x
                    b[LL[e].i].y = y
                    
                    if ( lineH > maxH){

                        lineH = 0;
                        y = YY;
                        x = x + Math.max(...lineMaxW) + gap;
                        lineMaxW = []
                    } else {
                        y = y + LL[e].h; 
                    }
                }
                
            }
        }
    }
    //监听tab切换
    if ( type == 'tabSet'){
        tabInfo = "tab-" + info 
        //console.log("tab-" + info)
    }

}


//封装postMessage
function postmessage(data){
    /*figma*/
    figma.ui.postMessage({pluginMessage:data})
    /*mastergo*/
    //mg.postMessage(data)
  }

function mixPd(star,node,end,num,index){
    for ( var i = 0; i < star.length; i++){
        node[i].paddingTop = star[i].paddingTop + ((end[i].paddingTop - star[i].paddingTop)/num)*index
        node[i].paddingRight = star[i].paddingRight + ((end[i].paddingRight - star[i].paddingRight)/num)*index
        node[i].paddingBottom = star[i].paddingBottom + ((end[i].paddingBottom - star[i].paddingBottom)/num)*index
        node[i].paddingLeft = star[i].paddingLeft + ((end[i].paddingLeft - star[i].paddingLeft)/num)*index
    } 
}

function mixR(star,node,end,num,index){
    for ( var i = 0; i < star.length; i++){
        node[i].rotation = star[i].rotation + ((end[i].rotation - star[i].rotation)/num)*index
    }  
}

function mixWH(star,node,end,num,index){
    for ( var i = 0; i < star.length; i++){
        node[i].width = star[i].width + ((end[i].width - star[i].width)/num)*index
        node[i].height = star[i].height + ((end[i].height - star[i].height)/num)*index
    }  
}

function mixS(star,node,end,num,index){
    for ( var i = 0; i < star.length; i++){
        //console.log(num)
        var scale = 1 + Math.sqrt( (end[i].width * end[i].height)/(star[i].width * star[i].height) )/(num * 2) * index
        //console.log(scale)
        node[i].rescale(scale,{scaleCenter:'CENTER'})
    }  
}

async function mixisV(star,node,end,num,index){
    for ( var i = 0; i < star.length; i++){
        var V = await star[i].findChildren((item) => item.isVisible == true).length + (( end[i].findChildren((item) => item.isVisible == true).length - star[i].findChildren((item) => item.isVisible == true).length)/num)*index

        for( var ii = 0; ii < V; ii++){
            console.log(V,ii, node[i].children[ii])
            node[i].children[ii].isVisible = true
        }
            
    }  
}
