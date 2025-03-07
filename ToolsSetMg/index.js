/**
 * [ToolsSet 工具集1.0]
 * ©版权所有：2024-2025 YNYU @lvynyu2.gmail.com
 * 禁止未授权的商用及二次编辑
 * 禁止用于违法行为，如有，与作者无关
 * 二次编辑需将引用部分开源
 * 引用开源库的部分应遵循对应许可
 */
if ( mg.command == 'open' ){
    mg.showUI(__html__);
} else if ( mg.command == 'pixel' ){ 
    //覆盖栅格化
    var info = 1;
    var a = mg.document.currentPage;
    var b = a.selection;
    console.log("原地栅格化：",info,"倍")

    var loading =  mg.notify("生成中，请稍后",{
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
} else if ( mg.command == 'yuhua' ){
    var a = mg.document.currentPage;
    var b = a.selection;
    for (var i = 0; i < b.length; i++){
        var group = mg.group([b[i]]);
        group.name = b[i].name;
        var min = Math.min(b[i].absoluteRenderBounds.width,b[i].absoluteRenderBounds.height);
        var yuhua = Math.ceil(0.044 * min + 6);//蒙版向内缩进值，模糊值则为yuhua*0.8
        //console.log(min,yuhua);
        var mask = mg.createRectangle();
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
        var maskG = mg.group([b[i].parent.children[0]]);
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
} else if ( mg.command == 'lineTable' ){
    var a = mg.document.currentPage;
    var b = a.selection;
    var info = 'line'
    easePickTable(info,a,b)  
} else if ( mg.command == 'areaTable' ){
    var a = mg.document.currentPage;
    var b = a.selection;
    var info = 'area'
    easePickTable(info,a,b)  
} else if ( mg.command == 'help' ){
    mg.showUI(__html__);
    mg.ui.hide();
    mg.ui.postMessage(['help','tolink'])//https://ynyu01.github.io/Tools-Help

} else if ( mg.command == 'getnew' ){
    mg.showUI(__html__);
    mg.ui.hide();
    mg.ui.postMessage(['new','tolink'])

} else if ( mg.command == 'tableToArea'){
    var a = mg.document.currentPage;
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
        mg.notify("含已合并的表格 / 非全描边表格",{
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
    
//console.log(mg.currentUser)
mg.ui.postMessage([mg.themeColor,'setTheme']);
//console.log(mg.viewport.rulerVisible)
var rulerH = 0;
var UI = [300,660]
if (mg.viewport.rulerVisible == true){
    rulerH = 17;
}else{
    rulerH = 0;
}
mg.ui.resize(UI[0], UI[1]);
//mg.ui.moveTo(mg.viewport.positionOnDom.x + mg.viewport.positionOnDom.width  - UI[0],48 + rulerH);
mg.ui.moveTo(mg.viewport.positionOnDom.x + rulerH,48 + rulerH);
//插件自动吸附
mg.on('layoutchange',function(){
    if (mg.viewport.rulerVisible == true){
        rulerH = 17;
    }else{
        rulerH = 0;
    }
    mg.ui.resize(UI[0], UI[1]);
    //mg.ui.moveTo(mg.viewport.positionOnDom.x + mg.viewport.positionOnDom.width  - UI[0],48 + rulerH);
    mg.ui.moveTo(mg.viewport.positionOnDom.x + rulerH,48 + rulerH);
})



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
mg.ui.onmessage = (message) => { 
    const info = message[0]
    const type = message[1]

    //插件自动休眠
    if ( type == "sleep"){
        if (info == true){
            //console.log(type + ":" + info)
            mg.ui.resize(160, 100);
            //mg.ui.moveTo(mg.viewport.positionOnDom.x + mg.viewport.positionOnDom.width - 100,48 + rulerH)
            
        }else{
            mg.ui.resize(UI[0], UI[1]);
        }
        mg.ui.moveTo(mg.viewport.positionOnDom.x + rulerH,48 + rulerH);
    }
    //插件最大化
    if ( type == "big"){
        if (info){
            UI = [UI[0] * 2,UI[1] * 1.3]
            mg.ui.resize(UI[0], UI[1]);   
        } else {
            UI = [300,660]
            mg.ui.resize(UI[0], UI[1]);
        }
        if(tabInfo == 'tab-4'){
            var loading =  mg.notify("生成中，请稍后",{
            position:"bottom",
            isLoading: true,
            timeout: 6000,
            });
            setTimeout(() => {
                createrMap()
                loading.cancel()
            }, 100);
        }
    }
    //双击底部获取当前节点信息(开发用)
    if ( type == "getnode"){
        if (mg.document.currentPage.selection.length > 0){
            console.log("当前节点信息：")
            console.log(mg.document.currentPage.selection[0])
        } else {
            //console.log(mg.document.currentPage.parent)
            console.log("未选中对象")
        }
    }
    //批量创建画板
    if (type == "createrframe") {
        console.log("创建画板：",info.length,"个");
        var a = mg.document.currentPage;
        var b = a.selection;

        //反传对象尺寸信息
        if ( info == 0 && b.length > 0){
            var frameInfo = [];
            b.forEach(item => {
                frameInfo.push(item.name.split(item.width)[0].trim() + '\t' + item.width + '\t' + item.height + '\n')
            })
            mg.ui.postMessage([frameInfo,'getFrame'])
        }


        var gap = 30;
        var maxW ,maxH ;
        var viewX = Math.floor( mg.viewport.center.x - ((mg.viewport.bound.width/2  - 300)* mg.viewport.zoom))/// mg.viewport.bound.width/2 + 300;
        var viewY = Math.floor(mg.viewport.center.y);
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
                var node = mg.createFrame()
                node.x = framedata.x;
                node.y = framedata.y;
                node.width = framedata.w;
                node.height = framedata.h;
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
        var a = mg.document.currentPage;
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
                /*
                newXY = [...HH,...LL,...FF]
                //console.log(newXY)
                for ( var ii = 0; ii < b.length; ii++){
                    b[i].x = newXY[i].x;
                    b[i].y = newXY[i].y;
                }
                */
            }
        }
    }
    //监听tab切换
    if ( type == 'tabSet'){
        tabInfo = "tab-" + info 
        //console.log("tab-" + info)
    }
    //记录导出尺寸设置
    if ( type == 'exportSizeSet'){
        console.log(info)
        var a = mg.document.currentPage;
        var b = mg.getNodeById(info[1]);
        b.setPluginData('s',info[0])
    }
    //记录导出格式设置
    if ( type == 'exportTypeSet'){
        console.log(info)
        var a = mg.document.currentPage;
        var b = mg.getNodeById(info[1]);
        b.setPluginData('type',info[0])
    }
    //处理要导出的图片
    if (type == 'exportImg'){  
        var a = mg.document.currentPage;
        var b = a.selection;     
        var frameData = [];
        var imgtype = "jpg";
        var typeAllow = ["jpg","jpeg","png","webp"];
        for (var i = 0; i < b.length; i++){
            if ( b[i].isVisible == true && b[i].width * b[i].height < 4096*4096){
                var name = b[i].name;
                if(name.split('=').length > 1 && b[i].type == 'COMPONENT'){
                    name = name.split('=')[1]
                }
                
                if( b[i].getPluginData('type') && b[i].getPluginData('type') !== '' && typeAllow.includes(b[i].getPluginData('type')) ){
                    imgtype = b[i].getPluginData('type')
                    console.log(name.split(' ')[0] + " 格式已预设为：" + b[i].getPluginData('type'))
                } else {
                    if (b[i].fills == '' || b[i].bottomLeftRadius * b[i].bottomRightRadius * b[i].topLeftRadius * b[i].topRightRadius !== 0 || b[i].name.split("png").length > 1) {
                        imgtype = "png"
                        console.log(name.split(' ')[0] + " 格式识别为：png")
                    }else{
                        imgtype = "jpg"
                        console.log(name.split(' ')[0] + " 格式识别为：jpg")
                    }
                }
                if (b[i].getPluginData('s') !== ''){
                    frameData.push({name:name,s:b[i].getPluginData('s'),type:imgtype,id:b[i].id});
                    console.log(name.split(' ')[0] + " 大小已预设为：" + b[i].getPluginData('s') + 'k');
                } else {
                    var nameS = name.match(/(\d+)(?=[kK])/);
                    if(nameS){
                        console.log(name.split(' ')[0] + " 大小识别为：" + nameS[1] + 'k(首次识别成功将进行预设)');
                        b[i].setPluginData('s',nameS[1])
                        frameData.push({name:name,s:nameS[1],type:imgtype,id:b[i].id});
                    } else {
                        console.log(name.split(' ')[0] + " 未识别到大小设置");
                        frameData.push({name:name,s:'',type:imgtype,id:b[i].id});
                    } 
                }  
                if ( i == b.length - 1){
                    var loading = mg.notify("加载中，请耐心等待~",{
                        position: "top",
                        timeout: 30000,
                        isLoading: true,
                    });
                    mg.ui.postMessage([[frameData,info],"frameExport"]) 
                    //console.log([frameData,info])
                    setTimeout(function(){
                        var imgData = [];
                        for (var i = 0; i < b.length; i++){
                            if ( b[i].isVisible == true && b[i].width * b[i].height < 4096*4096){
                                imgData.push( b[i].export({ format: 'PNG',constraint:{type:'SCALE',value:1} }) );
                            }  
                        };
                        mg.ui.postMessage([[imgData,info],"imgExport"]);
                        loading.cancel()
                    },100)
                }
            }  
        }    
    }
    //将组件填充到画板
    if ( info =='autoAddComponent'){
        var a = mg.document.currentPage;
        var b = a.selection;
      
        var id = b.find(item => item.type == 'COMPONENT' || item.type == 'INSTANCE').id
        console.log(id)
        var key = mg.getNodeById(id)
        console.log(key)
        if (key){
            for ( var i = 0; i < b.length; i++){
                if(b[i].type == 'FRAME'){
                    
                    if ( b[i].height > b[i].width){
                        var scale = b[i].height/key.height;  
                    } else {
                        var scale = b[i].width/key.width;  
                    }
                    
                    b[i].appendChild(key.clone())
                    b[i].children[b[i].children.length - 1].rescale(scale,{scaleCenter:'CENTER'});
                    b[i].children[b[i].children.length - 1].constrainProportions = false;//关闭等比例
                    b[i].children[b[i].children.length - 1].width = b[i].width;
                    b[i].children[b[i].children.length - 1].height = b[i].height;
                    b[i].children[b[i].children.length - 1].x = 0;
                    b[i].children[b[i].children.length - 1].y = 0;  
                }
            }
        }
    }
    //设置裁切最大尺寸
    if ( type == "cutMax"){
        cutMax = info * 1
        console.log("最大裁切尺寸：" + info + "px")
    }
    //导入图片
    if (type == 'createrImage'){
        
        var a = mg.document.currentPage;
        var b = a.selection;
        var viewX = mg.viewport.center.x - ((mg.viewport.bound.width/2  - 300)* mg.viewport.zoom)/// mg.viewport.bound.width/2 + 300;
        var viewY = mg.viewport.center.y;
        var x;
        var y;

        x = viewX;
        y = viewY;
        for ( i = 0; i < info.length; i++){
            //console.log(info[i])
            
            for (var ii = 0; ii < info[i][2][0].cuts.length; ii++){
                var img = new Uint8Array(info[i][2][0].cuts[0]);
                var pixels = mg.createRectangle()
                
                pixels.width = info[i][1][0].cutW
                pixels.height = info[i][1][0].cutH
                pixels.x = x
                pixels.y = y;
                fillTheSelection(pixels,img)
                y = y + pixels.height;
            }
            
        }

        
    }
    //生成栅格化
    if (type == 'pixel') {
        
        var a = mg.document.currentPage;
        var b = a.selection;
        console.log("原地栅格化：",info,"倍")
        
        if (b.some(item => item.type === 'SECTION' )){
            mg.notify("请将区域转为画板再重试",{
                position:"bottom",
                type:"error",
                isLoading: false,
                timeout: 3000,
                });
        } else {
        var loading =  mg.notify("生成中，请稍后",{
            position:"bottom",
            isLoading: true,
            timeout: 6000,
        });
        setTimeout(() =>{
            for (var i = 0; i < b.length; i++){
                intXY(b[i]);
                cutNode(a,b[i],info);
            }
            loading.cancel();
            pickBefore(a.selection);
        },100)
    }
        
    }
    //覆盖栅格化
    if (type == 'pixelRe') {
        
        var a = mg.document.currentPage;
        var b = a.selection;
        console.log("原地栅格化：",info,"倍")

        var loading =  mg.notify("生成中，请稍后",{
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
        
    }
    //导入大图
    if (type == "importNum"){
        importNum = info;
        xx = 0;
        yy = 0;
        time = 0;
        ww = 0;
        hh = 0;  
    }
    if (type == 'pixelIm'){
        var loading =  mg.notify("文件较大时会卡顿，请耐心等待",{
            position:"bottom",
            //isLoading: true,
            timeout: 2000,
        });
        //console.log(info[0])
        var a = mg.document.currentPage;
        var viewX = mg.viewport.center.x - ((mg.viewport.bound.width/2  - 300)* mg.viewport.zoom);/// mg.viewport.bound.width/2 + 300;
        var viewY = mg.viewport.center.y;
        var x = viewX + xx;
        var y = viewY + yy;
        for (var i = 0; i < info.length; i++){
            var pixels = mg.createRectangle()
            pixels.x = (x + info[i].x);
            pixels.y = (y + info[i].y);
            pixels.width = info[i].w;
            pixels.height = info[i].h;
            pixels.name = info[i].name;  
            fillTheSelection(pixels,info[i].img);
            if ( i == (info.length - 1 )){
                var index = a.children.length - info.length;
                var group = mg.group([a.children[index]]);
                group.name = info[i].name.split("-")[0];
                for ( var ii = 1; ii < info.length; ii ++){
                    a.children[index].appendChild( a.children[index + 1])
                    a.selection = [a.children[index]]
                }
                
            }
            
        }

        xx += info[0].w + 20
        time++
        if ( hh < info[0].h){
            hh = info[0].h
        }

        if ( time%4 == 0){
            xx = 0;
            yy += hh;
            hh = 0;
        }
            
    }

    //发送要恢复尺寸的图片的数据
    if (info == 'reSize'){
        console.log('reSize send')
        var a = mg.document.currentPage;
        var b = a.selection;
        var c = []
        for (var i = 0; i < b.length; i++){
            //console.log(b[i].fills[0].imageRef)
            //https://image-resource-nc.mastergo.com/
            //https://mastergo.netease.com/mastergo-default/
            var imgURL = 'https://image-resource-nc.mastergo.com/' + b[i].fills[0].imageRef;
            console.log("图片链接：" + imgURL)
            mg.ui.postMessage([{imgURL:imgURL,index:i},'imgURLtoWH'],'*')
            //console.log(c)
        }
    }
         
    //克隆并重置图片宽高
    if( type == 'imgWH'){
        //console.log(info)
        var a = mg.document.currentPage;
        var b = a.selection;
        var i = info.index
        b[i].constrainProportions = false;
        b[i].width = info.w;
        b[i].height = info.h;
        //console.log(b[i])
        b[i].fills = [{
        type: "IMAGE",
        imageRef: b[i].fills[0].imageRef,
        ratio: b[i].fills[0].ratio,
        rotation: b[i].fills[0].rotation,
        scaleMode: "FILL",
        filters:b[i].fills[0].filters,
        isVisible: b[i].fills[0].isVisible,
        alpha: b[i].fills[0].alpha,
        blendMode: b[i].fills[0].blendMode,
        id: b[i].fills[0].id,
        name:b[i].fills[0].name
    }]

    }
    //复用图片调整
    if ( info == 'fliters'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 1; i < b.length; i++){
            b[i].fills = [
                {
                type: "IMAGE",
                scaleMode: b[i].fills[0].scaleMode,
                imageRef:b[i].fills[0].imageRef,
                filters:b[0].fills[0].filters
                },
            ];
        }
    }
    //复用填充模式
    if ( info == 'fillsType'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 1; i < b.length; i++){
            b[i].fills = [
                {
                type: "IMAGE",
                scaleMode: b[0].fills[0].scaleMode,
                imageRef:b[i].fills[0].imageRef,
                filters:b[i].fills[0].filters
                },
            ];
        }
    }
    //准备添加杂色
    if ( info == 'addNoise'){
        console.log('addnoise')
        mg.ui.postMessage(['noise','noiseWH']);
    }
    //接收杂色图片
    if ( type == 'noiseURL'){
        
        var a = mg.document.currentPage;
        var b = a.selection;
        //console.log(info)
        var img = new Uint8Array(info);
        //console.log(img);
        var pixels = mg.createRectangle()
        fillTheSelection2(pixels,img)
        pixels.width = b[0].width
        pixels.height = b[0].height
        pixels.x = b[0].absoluteRenderBounds.x;
        pixels.y = b[0].absoluteRenderBounds.y;
        pixels.name = '杂色';
        pixels.blendMode = 'OVERLAY';
        //pixels.fills[0].ratio = 0.1;
        //pixels.effects = [{type: 'LAYER_BLUR', isVisible: true, radius: 0.25, blendMode: 'PASS_THROUGH'}];
        b[0].insertChild(b[0].children.length,pixels)
    }
    //按行拆分文案
    if ( info == 'textByLine'){
        console.log('按行拆分')
        var a = mg.document.currentPage;
        var b = a.selection;
        var lines = [];
        //var texts = mg.createText()
        for (var i = 0; i < b.length; i++){
            if (b[i].type == 'TEXT'){
                var parentnode = b[i].parent;
                var x = 0;
                var y = 0;
                var lineheight = b[i].textStyles[0].textStyle.lineHeightByPx;
                var X = [],Y = [];
                var nameCut = b[i].name.substring(0,10) +  '...' ;
                var index = parentnode.children.findIndex(item => item === b[i]);

                lines = b[i].characters.split('\n');
                var addframe = mg.createFrame();
                cloneMain(addframe,b[i])
                
                
                addframe.fills = [];
                addframe.name = nameCut;

                lines.forEach(item => {
                    var texts = b[i].clone()//mg.createText()
                    texts.characters = item
                    X.push(x)
                    Y.push(y)
                    y += lineheight
                    addframe.appendChild(texts)
                    if (item.trim() == ''){
                        texts.remove()
                    }
                })
                    
                //console.log(X,Y)

                parentnode.insertChild(index + 1,addframe)
                for ( var e = 0; e < addframe.children.length; e++){
                    addframe.children[e].x = X[e];
                    addframe.children[e].y = Y[e];
                }

                b[i].remove()
            } else {
                mg.notify('所选对象非文本', {
                    type: "error",
                    position: "bottom",
                    timeout: 3000,
                    isLoading: false,
                  });
            }
        }   
    }
    //按自动布局合并文案
    if ( info == 'textByLayout'){
        var a = mg.document.currentPage;
        var b = a.selection;
        b.forEach(item => {
            if ( item.layoutPositioning && item.layoutPositioning == 'AUTO'){
                var characters = '';
                var c = item.findAll((node) => node.type == 'TEXT');
                if ( item.flexMode == 'VERTICAL'){
                    c.forEach( node => {
                        characters += node.characters + '\n';
                    })
                } else {
                    c.forEach( node => {
                        characters += node.characters;
                    })
                }
                
                var newText = c[0].clone();
                var index = item.parent.children.findIndex( node => node == item);
                item.parent.insertChild( (index + 1),newText);
                if ( item.flexMode == 'VERTICAL'){
                    newText.y = item.y;
                    newText.x += item.absoluteBoundingBox.width + 20;
                } else {
                    newText.x = item.x;
                    newText.y += item.absoluteBoundingBox.height + 20;
                }
                newText.characters = characters.trim()
                
                
                
            }
        })
    }
    //按x、X、颜色拆分文案
    if ( info == 'textEaseCut'){
        var a = mg.document.currentPage;
        var b = a.selection;
        b.forEach(node => {
            if ( node.type == 'TEXT'){
                if ( node.textStyles.length == 1){
                    var text = node.characters.replace(/\s*([xX]+)\s*/gi,'$1').split(/([xX]+)/gi).filter( item => item.trim() !== '').map(item => item.trim())
                    //console.log(text)
                    var cuts = mg.createFrame();
                    cuts.name = "span";
                    cuts.clipsContent = false;
                    cuts.layoutPositioning = "AUTO";
                    cuts.flexGrow = 0;
                    cuts.flexMode = "HORIZONTAL";
                    cuts.flexWrap = "NO_WRAP";
                    cuts.itemSpacing = 8;
                    cuts.mainAxisAlignItems = "FLEX_START";
                    cuts.mainAxisSizingMode = "AUTO";
                    cuts.crossAxisAlignItems = "FLEX_START"; 
                    cuts.crossAxisSizingMode = "AUTO";
                    cuts.crossAxisSpacing = 0;
                    cuts.paddingTop = 0;
                    cuts.paddingBottom = 0;
                    cuts.paddingLeft = 0;
                    cuts.paddingRight= 0;
                    cuts.fills = [];
                    text.forEach( item => {
                        var textnode = node.clone();
                        textnode.characters = item;
                        cuts.appendChild(textnode);
                    })
                    
                    var index = node.parent.children.findIndex( item => item == node);
                    node.parent.insertChild(index,cuts);
                    cuts.x = node.x;
                    cuts.y = node.y;
                    node.remove();
                } else {
                    var oldText = node.characters;
                    var cuts = mg.createFrame();
                    cuts.name = "span";
                    cuts.clipsContent = false;
                    cuts.layoutPositioning = "AUTO";
                    cuts.flexGrow = 0;
                    cuts.flexMode = "HORIZONTAL";
                    cuts.flexWrap = "NO_WRAP";
                    cuts.itemSpacing = 8;
                    cuts.mainAxisAlignItems = "FLEX_START";
                    cuts.mainAxisSizingMode = "AUTO";
                    cuts.crossAxisAlignItems = "FLEX_START"; 
                    cuts.crossAxisSizingMode = "AUTO";
                    cuts.crossAxisSpacing = 0;
                    cuts.paddingTop = 0;
                    cuts.paddingBottom = 0;
                    cuts.paddingLeft = 0;
                    cuts.paddingRight= 0;
                    cuts.fills = [];
                    node.textStyles.forEach( text => {
                        var textnode = node.clone()
                        textnode.characters = oldText.substring(text.start,text.end);
                        textnode.fills = text.fills;
                        textnode.fillStyleId = text.fillStyleId;
                        cuts.appendChild(textnode);
                    })
                    var index = node.parent.children.findIndex( item => item == node);
                    node.parent.insertChild(index,cuts);
                    cuts.x = node.x;
                    cuts.y = node.y;
                    node.remove();
                }
            }
            
        })
    }
    //建立线性流程
    if ( info == 'buildFlow'){
        var a = mg.document.currentPage;
        var b = a.selection;
        var x,y;
        var x = b[0].absoluteRenderBounds.x
        if (b[0].type == 'TEXT'){
            var y = b[0].absoluteRenderBounds.y - b[0].listStyles[0].end;
        } else {
            var y = b[0].absoluteRenderBounds.y;
        }
        if (b.length > 1){
            var node1st = mg.createFrame();
            node1st.x = x;
            node1st.y = y;
            node1st.name = "总流程";
            node1st.fills =[];
            if ((b[1].x - b[0].x) >= (b[1].y - b[0].y)){
                //console.log(111)
                node1st.flexMode = 'HORIZONTAL';
                node1st.flexWrap = "NO_WRAP";
                node1st.crossAxisAlignItems = 'CENTER';
                for (var i = 0; i < b.length; i++){
                    var node3rd = b[i].clone()
                    var node2nd = mg.createFrame()
                    node2nd.flexMode = 'HORIZONTAL' ;
                    node2nd.flexWrap = "NO_WRAP"
                    node2nd.name = '子流程';
                    node2nd.fills =[];
                    node2nd.appendChild(node3rd)
                    node1st.appendChild(node2nd)
                    //b[i].remove()
                }
                if (b[0].width > b[1].width){
                    node1st.itemSpacing = b[0].width/2
                }else{
                    node1st.itemSpacing = b[1].width/2
                }
            }else{
                //console.log(222)
                node1st.flexMode = 'VERTICAL';
                node1st.crossAxisAlignItems = 'CENTER';
                for (var i = 0; i < b.length; i++){
                    var node3rd = b[i].clone()
                    var node2nd = mg.createFrame()
                    node2nd.flexMode = 'HORIZONTAL' ;
                    node2nd.flexWrap = "NO_WRAP"
                    node2nd.name = '子流程';
                    node2nd.fills =[];
                    node2nd.appendChild(node3rd)
                    node1st.appendChild(node2nd)
                    //b[i].remove()
                }
                if (b[0].width > b[1].width){
                    node1st.itemSpacing = b[1].height*2
                }else{
                    node1st.itemSpacing = b[0].height*2
                }
            }
            //console.log(node1st.itemSpacing,node1st.flexMode)
            var nodeline = mg.createConnector()
        }
    }
    //斜切工具
    if ( type == 'skewSet'){
        var a = mg.document.currentPage;
        var b = a.selection;
        
        
        for (var i = 0; i < b.length; i++){
            
            /*
            if( info[1] == 'skewW'){
                b[i].setPluginData('skewW',info[0]);
                var skewW = info[0];
                var skewH = b[i].getPluginData('skewH');
            }
            if( info[1] == 'skewH'){
                b[i].setPluginData('skewH',info[0]);
                var skewH = info[0];
                var skewW = b[i].getPluginData('skewW');
                
            }
            */

            b[i].setPluginData('skewInfo',JSON.stringify({x:info.x,y:info.y,w:info.w,h:info.h}))
            //console.log(b[i].getPluginData('skewInfo'))
            b[i].relativeTransform = [[info.w/100,Math.tan(info.x*(Math.PI/180)),b[i].x],[Math.tan(info.y*(Math.PI/180)),info.h/100,b[i].y],]
            
            //console.log(b[i].getPluginData('skewW'),b[i].getPluginData('skewH'))
        }
        
    }
    //等比缩放工具
    if ( type == 'scaleSelf'){
        var a = mg.document.currentPage;
        var b = a.selection;
        var center = {"TL":"TOPLEFT","TC":"TOP","TR":"TOPRIGHT","CL":"LEFT","CC":"CENTER","CR":"RIGHT","BL":"BOTTOMLEFT","BC":"BOTTOM","BR":"BOTTOMRIGHT",}
        var value;
        for (var i = 0; i < b.length; i++){
            if( info.type == "WH"){
                //console.log(value,center[info.center])
                value = info.value / 100
                b[i].rescale(value,{scaleCenter:center[info.center]})
            }
            if( info.type == "W"){
                value = info.value / b[i].width
                b[i].rescale(value,{scaleCenter:center[info.center]})
            }
            if( info.type == "H"){
                value = info.value / b[i].height
                b[i].rescale(value,{scaleCenter:center[info.center]})
            }
        }
    }
    //恢复默认命名
    if ( info == 'reName'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            if (b[i].type == 'GROUP'){
                b[i].name = '组'
            }else if (b[i].type == 'FRAME') {
                b[i].name = '容器'
            }else if (b[i].type == 'TEXT') {
                b[i].name = ''
            }else{
                b[i].name = '矩形'
            }
        }
    }
    
    //建立表格
    if ( type == 'creTable'){
        var a = mg.document.currentPage;
        var b = a.selection;
        var viewX = mg.viewport.center.x - ((mg.viewport.bound.width/2  - 300)* mg.viewport.zoom)/// mg.viewport.bound.width/2 + 300;
        var viewY = mg.viewport.center.y;
        var x = viewX;
        var y = viewY;
        var H = Number(info[0]);
        var L = Number(info[1]);
        if ( b.length < 2){
            if ( b.length == 1){
                var data = tableToData(b[0].characters,true)
                H = data[0].length;
                L = data.length;
                //console.log(H,L)
                x = b[0].x + b[0].width + 60;
                y = b[0].y;
            }
            var node1 = mg.createComponent();
            node1.x = x;
            node1.y = y;
            creTableSet(node1, "table-表头",true,true,"表头文案")//需添加表格属性的节点，命名，是否显示区分色，是否需要填充文案，需要填充的文案/克隆的节点
            var node2 = mg.createComponent();
            node2.x = node1.x;
            node2.y = node1.y + 60;
            creTableSet(node2, "table-数据",false,true,"数据文案")

            var list = mg.createFrame()
            list.name = "#列";
            list.layoutPositioning = "AUTO";
            list.clipsContent = false;
            list.flexGrow = 0;
            list.flexMode = "VERTICAL";
            list.flexWrap = "NO_WRAP";
            list.itemSpacing = 0;
            list.crossAxisSpacing = 0;
            list.paddingTop = 0;
            list.paddingBottom = 0;
            list.paddingLeft = 0;
            list.paddingRight= 0;
            list.fills = [];
            list.itemReverseZIndex = true;//正向堆叠，方便伪合并表格
            if ( H > 2){
                list.appendChild(node1.clone());
                for ( var e = 1; e < H; e++){
                    list.appendChild(node2.clone());
                }
            } else {
                list.appendChild(node1.clone());
                list.appendChild(node2.clone());
                list.appendChild(node2.clone());
                list.appendChild(node2.clone());
            }

            list.flexMode = "VERTICAL";
            list.mainAxisAlignItems = "FLEX_START";
            list.mainAxisSizingMode = "AUTO";
            list.crossAxisAlignContent = "AUTO";
            list.crossAxisAlignItems = "CENTER"; 
            list.crossAxisSizingMode = "AUTO";
            
            var table = mg.createFrame()
            table.x = x + 200;
            table.y = y;
            table.name = "#table";
            table.layoutPositioning = "AUTO";
            table.flexGrow = 0;
            table.flexMode = "HORIZONTAL";
            table.flexWrap = "NO_WRAP";
            table.itemSpacing = 0;
            table.mainAxisAlignItems = "FLEX_START";
            table.mainAxisSizingMode = "AUTO";
            table.crossAxisAlignItems = "FLEX_START"; 
            table.crossAxisSizingMode = "AUTO";
            table.crossAxisSpacing = 0;
            table.paddingTop = 0;
            table.paddingBottom = 0;
            table.paddingLeft = 0;
            table.paddingRight= 0;
            table.fills = [];
            table.itemReverseZIndex = true;//正向堆叠，方便伪合并表格
            if ( L > 0 ){
                table.appendChild(list);
                for ( var e = 1; e < L; e++){
                    table.appendChild(list.clone());
                }
            }else{
                table.appendChild(list);
                table.appendChild(list.clone());
                table.appendChild(list.clone());
            }
            setStroke(table,'CENTER',[1,1,1,1])
            //setRadius(table,[16,16,16,16])
            table.fills = [{type:"SOLID",color:{r:0.175,g:0.175,b:0.175,a:1,}}]

        }
        if ( b.length == 2){
            if ( b[0].name.split("表头").length !== 1 && b[1].name.split("数据").length !== 1 || b[1].name.split("表头").length !== 1 && b[0].name.split("数据").length !== 1){

                var list = mg.createFrame();
                list.name = "#列";
                list.fills = [];
                for ( var i = 0; i < b.length; i++){
                    if(b[i].type == "COMPONENT" || b[i].type == "INSTANCE"){
                        x = b[0].x;
                        y = b[0].y + 80;
                        if (b[i].name.split("表头").length !== 1){
                            list.insertChild(0,b[i].clone());
                        }
                        if (b[i].name.split("数据").length !== 1){
                            if( H > 0){
                                for ( var e = 0; e < H; e++){
                                    list.insertChild(e + 1,b[i].clone());
                                }
                            } else {
                                list.insertChild(1,b[i].clone());
                                list.insertChild(2,b[i].clone());
                                list.insertChild(3,b[i].clone());
                            }                
                        }    
                    } else{
                        x = b[0].x + 200;
                        y = b[0].y + 80;
                        if (b[i].name.split("表头").length !== 1){
                            var node1 = mg.createComponent();
                            node1.x = b[i].absoluteRenderBounds.x + 200;
                            node1.y = b[i].absoluteRenderBounds.y;
                            creTableSet(node1, "table-表头",true,false,b[i])
                            list.insertChild(0,node1.clone());
                        }
                        if (b[i].name.split("数据").length !== 1){
                            var node2 = mg.createComponent();
                            node2.x = b[i].absoluteRenderBounds.x + 200;
                            node2.y = b[i].absoluteRenderBounds.y;
                            creTableSet(node2, "table-数据",false,false,b[i])
                            //console.log(H)
                            if( H > 0){  
                                for ( var e = 0; e < H; e++){
                                    list.insertChild(e + 1,node2.clone());
                                }
                            } else {
                                list.insertChild(1,node2.clone());
                                list.insertChild(2,node2.clone());
                                list.insertChild(3,node2.clone());
                            }   
                        }
                    }
                }
                list.layoutPositioning = "AUTO";
                list.flexGrow = 0;
                list.flexMode = "VERTICAL";
                list.flexWrap = "NO_WRAP";
                list.itemSpacing = 0;
                list.crossAxisSpacing = 0;
                list.paddingTop = 0;
                list.paddingBottom = 0;
                list.paddingLeft = 0;
                list.paddingRight= 0;
                var table = mg.createFrame()
                table.x = x;
                table.y = y;
                table.name = "#table";
                table.layoutPositioning = "AUTO";
                table.flexGrow = 0;
                table.flexMode = "HORIZONTAL";
                table.flexWrap = "NO_WRAP";
                table.itemSpacing = 0;
                table.mainAxisAlignItems = "FLEX_START";
                table.mainAxisSizingMode = "AUTO";
                table.crossAxisAlignItems = "FLEX_START"; 
                table.crossAxisSizingMode = "AUTO";
                table.crossAxisSpacing = 0;
                table.paddingTop = 0;
                table.paddingBottom = 0;
                table.paddingLeft = 0;
                table.paddingRight= 0;
                table.fills = [];
                if ( L > 0){
                    table.appendChild(list);
                    for ( var e = 1; e < L; e++){
                        table.appendChild(list.clone());
                    }
                }else{
                    table.appendChild(list);
                    table.appendChild(list.clone());
                    table.appendChild(list.clone());
                }
                setStroke(table,'CENTER',[1,1,1,1])
                //setRadius(table,[16,16,16,16])
                table.fills = [{type:"SOLID",color:{r:0.175,g:0.175,b:0.175,a:1,}}]
            }
            /*
            if( b[0].name.split("#table").length !== 1 && b[1].type == "TEXT" || b[1].name.split("#table").length !== 1 && b[0].type == "TEXT" ){
                for ( var i = 0; i < b.length; i++){
                    if (b[i].type == "TEXT"){
                        var data = tableToData(b[i].characters)
                        console.log(data)
                    }
                }
            }
            */
            
        }
        if ( b.length == 3){
            var keyType = ['INSTANCE', 'INSTANCE', 'TEXT']
            var keyType2 = ['COMPONENT', 'COMPONENT', 'TEXT']
            var keyType3 = ['INSTANCE', 'COMPONENT', 'TEXT']
            var T = b.map(obj => obj.type);
            if ( T.every(element => keyType.includes(element)) || T.every(element => keyType2.includes(element)) || T.every(element => keyType3.includes(element)) ){
                //console.log(T)
            }
            
        }
    }
    //表格填充数据
    if ( type == 'reTable'){
        var a = mg.document.currentPage;
        var b = a.selection;
        if (b.length == 1 && b[0].name.split("#table").length !== 1 && b[0].children[0].name.split('数据流').length == 1){
            
            if ( b[0].name.split("-横").length > 1){
                var datas = tableToData(info.trim(),true);
                var data = datas[0].map((col, i) => datas.map(row => row[i]))
            } else {
                var data = tableToData(info.trim(),true) 
            }
            var H = data[0].length - b[0].children[0].children.length;
            var L = data.length - b[0].children.length;

            addTable(b,H,L)
            for(var i = 0; i < b[0].children.length; i++){
                
                if (b[0].children[i].name.split('#列').length !== 1){
                    var c = b[0].children[i].children;
                    for (var ii = 0; ii < c.length; ii++){
                        //console.log(c[ii].name + ':' + data[i][ii])
                        var id = []
                        if ( c[ii].componentProperties.length >= 6){
                            for (var e = 5; e < c[ii].componentProperties.length; e++){//默认前五个是固定的组件属性：区分色、上右下左描边
                                if ( c[ii].componentProperties[e].name.split('字').length !== 1){
                                    //console.log("含字段" + ii)
                                    id.push( c[ii].componentProperties[e].id)//收集字段/文字属性ii
                                }
                            } 
                            //console.log(111)
                            var maxText = data[i][ii].split("|")

                            
                            if (id.length == maxText.length){
                                //console.log(id.length + ":" + maxText)
                                for (var iii = 0; iii < id.length; iii++){
                                    c[ii].setProperties({[id[iii]]:maxText[iii]})//按顺序修改字段属性
                                }  
                            } else {
                                c[ii].setProperties({[id[0]]:data[i][ii]})
                            }
                            
                        }
                    }  
                }  
            } 
        }
        if (b.length == 1 && b[0].findAll((node) => node.name.split("#table").length > 1).length == 1){
            var table = b[0].findAll((node) => node.name.split("#table").length > 1)[0]
            a.selection = [table]

            if ( table.name.split("-横").length > 1){
                var datas = tableToData(info.trim(),true);
                var data = datas[0].map((col, i) => datas.map(row => row[i]))         
            } else {
                var data = tableToData(info.trim(),true) 
            }
            var H = data[0].length -table.children[0].children.length;
                var L = data.length - table.children.length;

            addTable([table],H,L)
            for(var i = 0; i < table.children.length; i++){
                
                if (table.children[i].name.split('#列').length !== 1){
                    var c = table.children[i].children;
                    for (var ii = 0; ii < c.length; ii++){
                        //console.log(c[ii].name + ':' + data[i][ii])
                        var id = []
                        if ( c[ii].componentProperties.length >= 6){
                            for (var e = 5; e < c[ii].componentProperties.length; e++){//默认前五个是固定的组件属性：区分色、上右下左描边
                                if ( c[ii].componentProperties[e].name.split('字').length !== 1){
                                    //console.log("含字段" + ii)
                                    id.push( c[ii].componentProperties[e].id)//收集字段/文字属性ii
                                }
                            } 
                            var maxText = data[i][ii].split("|")
                            if (id.length == maxText.length){
                                //console.log(id.length + ":" + maxText)
                                for (var iii = 0; iii < id.length; iii++){
                                    c[ii].setProperties({[id[iii]]:maxText[iii]})//按顺序修改字段属性
                                }  
                            } else {
                                c[ii].setProperties({[id[0]]:data[i][ii]})
                            }
                            
                        }
                    }  
                }  
            } 
        }
        if (b.length == 1 && b[0].name.split("数据流").length !== 1 || b[0].children[0].name.split('数据流').length !== 1){
            var data = tableToData(info.trim(),false)
            var H = 0;
            var L = data.length - b[0].children.length;
            //console.log(data)
            addTable(b,H,L)
            for(var i = 0; i < b[0].children.length; i++){
                for (var e = 0; e < b[0].children[i].componentProperties.length; e++){      
                    if ( b[0].children[i].componentProperties[e].type == "TEXT"){
                        //console.log(data[i],e)
                        b[0].children[i].setProperties({[b[0].children[i].componentProperties[e].id]:data[i][0]})
                    }
                }
            }
                   
        }

    }
    //从表格文本命名
    if ( type == 'reTableName'){
        var a = mg.document.currentPage;
        var b = a.selection;

        if (b.length == 1 && b[0].name.split("#table").length !== 1 ){
            var data = tableToData(info.trim(),true)
                var H = data[0].length - b[0].children[0].children.length;
                var L = data.length - b[0].children.length;
                console.log(data)
                addTable(b,H,L)
                for(var i = 0; i < b[0].children.length; i++){
                    for(var ii = 0; ii < b[0].children[i].children.length; ii++){
                        b[0].children[i].children[ii].name = data[i][ii]
                    }   
                }         
        }
        if (b.length == 1 &&  b[0].name.split('数据流').length !== 1){
            var data = tableToData(info.trim(),false)
                var H = 0;
                var L = data.length - b[0].children.length;
                addTable(b,H,L)
                for(var i = 0; i < b[0].children.length; i++){
                    b[0].children[i].name = data[i][0]
                }         
        }
    }
    //添加表格属性
    if ( type == 'asTable'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            //var text = []

            if ( b[i].type == "COMPONENT"){
                if (  b[i].componentPropertyValues.length !== 6){
                    if (b[i].children.length == 1){
                        b[i].itemReverseZIndex = true;
                        var colorLayer = mg.createRectangle();
                        cloneMain(colorLayer,b[i]);
                        if (b[i].children[0].characters == "表头文案" || b[i].characters == "表头"){
                            colorLayer.fills = [{type:"SOLID",color:{r:0.4,g:0.4,b:0.4,a:1,}}];
                        } else {
                            colorLayer.fills = [{type:"SOLID",color:{r:0.4,g:0.4,b:0.4,a:0.5,}}];
                        }

                        var strokeTop = mg.createRectangle();
                        cloneMain(strokeTop,b[i]);
                        setStroke(strokeTop,"CENTER",[1,0,0,0]);
                        var strokeRight = mg.createRectangle();
                        cloneMain(strokeRight,b[i]);
                        setStroke(strokeRight,"CENTER",[0,1,0,0]);
                        var strokeBottom = mg.createRectangle();
                        cloneMain(strokeBottom,b[i]);
                        setStroke(strokeBottom,"CENTER",[0,0,1,0]);
                        var strokeLeft = mg.createRectangle();
                        cloneMain(strokeLeft,b[i]);
                        setStroke(strokeLeft,"CENTER",[0,0,0,1]);

                        var diffC = mg.group([colorLayer]);
                        var strokeT = mg.group([strokeTop]);
                        var strokeR = mg.group([strokeRight]);
                        var strokeB = mg.group([strokeBottom]);
                        var strokeL = mg.group([strokeLeft]);

                        if (b[i].children[0].characters == "表头文案" || b[i].characters == "表头"){
                            addAbsolute(b[i],diffC,"区分色",true)
                        } else {
                            addAbsolute(b[i],diffC,"区分色",false)
                        }
                        
                        addAbsolute(b[i],strokeT,"上描边",false)
                        addAbsolute(b[i],strokeR,"右描边",false)
                        addAbsolute(b[i],strokeB,"下描边",false)
                        addAbsolute(b[i],strokeL,"左描边",false)
                        b[i].itemReverseZIndex = false;
                    }
                }
                
                for ( var ii = b[i].children.length - 1; ii >= 0 ; ii--){  
                    if ( b[i].children[ii].layoutPositioning == "ABSOLUTE"){
                        b[i].children[ii].children[0].constraints = {
                            horizontal: "STARTANDEND",
                            vertical: "STARTANDEND"
                        }
                        //console.log(Object.keys(b[i].children[ii].componentPropertyReferences).length )
                        if (Object.keys(b[i].children[ii].componentPropertyReferences).length === 0){
                            var addLayerSet = b[i].addComponentProperty(b[i].children[ii].name,"BOOLEAN",false);
                            //console.log(addLayerSet)
                            b[i].children[ii].componentPropertyReferences = {isVisible:addLayerSet};
                        }
                    }
                }
                for ( var ii = b[i].children.length - 1; ii >= 0 ; ii--){          
                    if ( b[i].children[ii].type == "TEXT"){
                        b[i].children[ii].flexGrow = 1;
                        b[i].children[ii].textAutoResize = "HEIGHT"
                        //console.log(Object.keys(b[i].children[ii].componentPropertyReferences).length )
                        if (Object.keys(b[i].children[ii].componentPropertyReferences).length === 0){
                            //text.push([b[i].children[ii].characters,])
                            var addTextSet = b[i].addComponentProperty("字段1", "TEXT", b[i].children[ii].characters);
                            //console.log(addTextSet)
                            b[i].children[ii].componentPropertyReferences = {characters:addTextSet};
                            
                        }
                    }
                }
            }
            if ( b[i].type == "TEXT"){
                var data = tableToData(b[i].characters,true)
                if ( data.length == 1 ){
                    //console.log(data[0])
                    var node = mg.createComponent();//b[i].clone()
                    node.x = b[i].absoluteRenderBounds.x + b[i].width * 1.5;
                    node.y = b[i].absoluteRenderBounds.y;
                    
                    node.layoutPositioning = "AUTO";
                    node.flexGrow = 0;
                    node.flexMode = "HORIZONTAL";
                    node.flexWrap = "NO_WRAP";
                    node.itemSpacing = 0;
                    node.mainAxisAlignItems = "CENTER";
                    node.mainAxisSizingMode = "FIXED";
                    node.crossAxisAlignItems = "CENTER"; 
                    node.crossAxisSizingMode = "FIXED";
                    node.crossAxisSpacing = 0;
                    node.paddingTop = 10;
                    node.paddingBottom = 10;
                    node.width = b[i].width * 2;
                    node.height = b[i].height + 20;
                    node.fills = [];
                    var colorLayer = mg.createRectangle();
                    cloneMain(colorLayer,node)
                    if (b[i].children[0].characters == "表头文案" || b[i].characters == "表头"){
                        colorLayer.fills = [{type:"SOLID",color:{r:0.4,g:0.4,b:0.4,a:1,}}];
                    } else {
                        colorLayer.fills = [{type:"SOLID",color:{r:0.4,g:0.4,b:0.4,a:0.5,}}];
                    }
                    var strokeTop = mg.createRectangle();
                    cloneMain(strokeTop,node);
                    setStroke(strokeTop,"CENTER",[1,0,0,0]);
                    var strokeRight = mg.createRectangle();
                    cloneMain(strokeRight,node);
                    setStroke(strokeRight,"CENTER",[0,1,0,0]);
                    var strokeBottom = mg.createRectangle();
                    cloneMain(strokeBottom,node);
                    setStroke(strokeBottom,"CENTER",[0,0,1,0]);
                    var strokeLeft = mg.createRectangle();
                    cloneMain(strokeLeft,node);
                    setStroke(strokeLeft,"CENTER",[0,0,0,1]);

                    var diffC = mg.group([colorLayer]);
                    var strokeT = mg.group([strokeTop]);
                    var strokeR = mg.group([strokeRight]);
                    var strokeB = mg.group([strokeBottom]);
                    var strokeL = mg.group([strokeLeft]);

                    if (b[i].characters == "表头文案" | b[i].characters == "表头"){
                        node.name = "table-表头";
                        addAbsolute(node,diffC,"区分色",true)
                    } else {
                        node.name = "table-数据";
                        addAbsolute(node,diffC,"区分色",false)
                    }
                    
                    addAbsolute(node,strokeT,"上描边",false)
                    addAbsolute(node,strokeR,"右描边",false)
                    addAbsolute(node,strokeB,"下描边",false)
                    addAbsolute(node,strokeL,"左描边",false)

                    var text = node.appendChild(b[i].clone())

                    for ( var ii = 0; ii < node.children.length; ii++){
                        if ( node.children[ii].type == "TEXT"){
                            node.children[ii].flexGrow = 1;
                            node.children[ii].textAutoResize = "HEIGHT";
                            if (Object.keys(node.children[ii].componentPropertyReferences).length === 0){
                                var addTextSet = node.addComponentProperty("字段1", "TEXT", node.children[ii].characters);
                                node.children[ii].componentPropertyReferences = {characters:addTextSet};
                            }
                        }
                        if (node.children[ii].layoutPositioning == "ABSOLUTE"){
                            node.children[ii].children[0].constraints = {
                                horizontal: "STARTANDEND",
                                vertical: "STARTANDEND"
                            }
                        }
                    }
                    
                }
            }
            if ( b[i].children && b[i].children[b[i].children.length - 1].type == 'TEXT'){

            }
            
            
        }
    }
    //表格增减行列数
    if ( type == 'addTable'){
        //console.log(info)
        var a = mg.document.currentPage;
        var b = a.selection;
        var H = Number(info[0]);
        var L = Number(info[1]);
        addTable(b,H,L) 
    }
    //表格区分色
    if ( type == "diffColorTable"){      
        var a = mg.document.currentPage;
        var b = a.selection;
        if ( info == 'diffLine'){
            for (var i = 0; i < b.length; i++){
                if ( b[i].name.split("#table").length !== 1){
                    var c = b[i].children;
                    if ( b[i].name.split("-横").length !== 1){
                        console.log('横向表格')
                        for ( var ii = 0; ii < c.length; ii++){
                            if (c[ii].name.split('#列').length !== 1){
                                var d = c[ii].children;
                                if ( (ii + 1) % 2 == 0){
                                    for ( var iii = 0; iii < d.length; iii++){
                                        if ( d[iii].componentProperties[0].name !== "区分色"){
                                            mg.notify("请检查组件属性中“区分色”是否是第一个",{
                                                type: "error",
                                                position: "bottom",
                                                timeout: 6000,
                                                isLoading: false,
                                            });
                                        } else {
                                            d[iii].setProperties({[d[iii].componentProperties[0].id]:false})
                                        }
                                    }
                                } else {
                                    for ( var iii = 0; iii < d.length; iii++){
                                        if ( d[iii].componentProperties[0].name !== "区分色"){
                                            mg.notify("请检查组件属性中“区分色”是否是第一个",{
                                                type: "error",
                                                position: "bottom",
                                                timeout: 6000,
                                                isLoading: false,
                                            });
                                        } else {
                                            d[iii].setProperties({[d[iii].componentProperties[0].id]:true})
                                        }
                                    }
                                }
                                
                            
                            }
                        }

                    }else{
                        console.log('竖向表格')
                        for ( var ii = 0; ii < c.length; ii++){
                            if (c[ii].name.split('#列').length !== 1){
                                var d = c[ii].children;
                                for ( var iii = 1; iii < d.length; iii++){
                                    if ( (iii + 1) % 2 !== 0 && d[iii].componentProperties[0].name !== "区分色"){
                                        mg.notify("请检查组件属性中“区分色”是否是第一个",{
                                            type: "error",
                                            position: "bottom",
                                            timeout: 6000,
                                            isLoading: false,
                                        });
                                    }
                                    if ( (iii + 1) % 2 !== 0 && d[iii].componentProperties[0].name == "区分色"){
                                        d[iii].setProperties({[d[iii].componentProperties[0].id]:true})
                                    } else {
                                        d[iii].setProperties({[d[iii].componentProperties[0].id]:false})
                                    }
                                }
                            
                            }
                        }
                    }
                }
                
            }
        }
        if ( info == 'all'){
 
            if ( diffColorTime%2 == 0){
                b.forEach(node =>{
                    if ( node.componentProperties[0].name !== "区分色"){
                        mg.notify("请检查组件属性中“区分色”是否是第一个",{
                            type: "error",
                            position: "bottom",
                            timeout: 6000,
                            isLoading: false,
                        });
                    } else {
                        node.setProperties({[node.componentProperties[0].id]:false})
                    }
                })
                diffColorTime++
            } else {
                b.forEach(node =>{
                    if ( node.componentProperties[0].name !== "区分色"){
                        mg.notify("请检查组件属性中“区分色”是否是第一个",{
                            type: "error",
                            position: "bottom",
                            timeout: 6000,
                            isLoading: false,
                        });
                    } else {
                        node.setProperties({[node.componentProperties[0].id]:true})
                    }
                })
                diffColorTime++
            }
            
        }
    }
    //连选中间格
    if ( type == "easePickTable"){
        var a = mg.document.currentPage;
        var b = a.selection;
        easePickTable(info,a,b)  
    }
    //反转表格行列
    if ( type == "translateTable"){
        var a = mg.document.currentPage;
        var b = a.selection;
        var loading =  mg.notify("生成中，请稍后",{
            position:"bottom",
            isLoading: true,
            timeout: 6000,
            });

        setTimeout(() => {   
        for ( var i = 0; i < b.length; i++){
            
            if ( b[i].name.split("#table").length !== 1){
                var H = 0,L = 0;

                for ( var ii = 0; ii < b[i].children.length; ii++){

                    if ( b[i].children[ii].name.split("#列").length !== 1){
                        H++
                    }
                }

                if ( b[i].children[0].name.split("#列").length !== 1){
                    

                    for ( var ii = 0; ii < b[i].children[0].children.length; ii++){
                        L++
                    }
                }
                
                var table = b[i].parent.insertChild(0,b[i].clone());
                
                var c =  b[i].parent.children[0];
                if ( b[i].children[0].children[1].name.split("表头").length == 1){
                    c.name += "-横";
                } else {
                    c.name = b[i].name.split("-横")[0];
                }
                addTable([c],H - L,L - H);
                for ( var ii = 0; ii < L; ii++){
                    for ( var iii = 0; iii < H; iii++){
                        c.children[ii].children[0].remove();//删一个少一个
                    }
                }
                for ( var ii = 0; ii < H; ii++){
                    for ( var iii = 0; iii < L; iii++){
                        c.children[iii].appendChild(b[i].children[ii].children[iii].clone());
                    }
                    
                }
                reTableStroke(c,H,L)
                b[i].remove();
                loading.cancel();
                a.selection = [c];
                
                

            }
        }
        },100);
        
    }
    //表格描边
    if ( type == "strokeTable"){
        var a = mg.document.currentPage;
        var b = a.selection;
        if ( info == 'diff'){
            var X = b.map(item => item.absoluteBoundingBox.x)
            var W = b.map(item => item.absoluteBoundingBox.width)
            var XX = [...new Set(X)]
            var WW = [...new Set(W)]
            var Y = b.map(item => item.absoluteBoundingBox.y)
            var H = b.map(item => item.absoluteBoundingBox.height)
            var YY = [...new Set(Y)]
            var HH = [...new Set(H)]
            if ( b.some( node => node.componentProperties[1].value == false || node.componentProperties[2].value == false || node.componentProperties[3].value == false || node.componentProperties[4].value == false)){
                mg.notify("含已合并的表格 / 非全描边表格",{
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
                    
                    //console.log(b.map( node => node.componentProperties[5]))
                    
                } else {
                    console.log('无法合并表格')
                }
            }
        }
        if ( info == 'all'){
            var stroke;
            
            for ( var i = 0; i < b.length; i++){
                if ( b[i].mainComponent.componentPropertyValues[1].defaultValue == true ){
                    stroke = true;
                } else {
                    stroke = false;
                }
                for ( var ii = 1; ii < 5; ii++){
                    console.log(stroke)
                    b[i].setProperties({[b[i].componentProperties[ii].id]:stroke})
                }
            }
        }
       
        

    }
    //刷新小地图
    if ( type == "reMap"){
        var loading =  mg.notify("生成中，请稍后",{
            position:"bottom",
            isLoading: true,
            timeout: 6000,
            });
        setTimeout(() => {
            createrMap()
            loading.cancel()
        }, 100);
        
    }
    //接收是否已创建小地图
    if (type == "hasMap"){
        var a = mg.document.currentPage;
        var b = a.children;
        if(b[b.length - 1].name == "创建快照"){
            b[b.length - 1].remove()
        } else {
            a.findChild((node) => node.name == "创建快照")[0].remove()
        }
        
    }
    //接收是否已自动选中非画板对象，删除为非画板对象创建的临时画板
    if (type == "hasView"){
        console.log("backHasView")
        var a = mg.document.currentPage;
        var b = a.children;
        if(b[0].name == "临时选区"){
            b[0].remove()
        } else {
            for ( var i = 0; i < b.length; i++){
                if(b[i].name == "临时选区"){
                    b[i].remove()
                }
            }
        }
        
    }
    //移动视图
    if ( type == "reCenter"){
        //console.log(info.x,info.y)
        mg.viewport.center = {x:info.x + mg.viewport.positionOnDom.width/4,y:info.y + mg.viewport.positionOnDom.height/4 }
        //mg.viewport.zoom = 1
    }
    //移动视图+自动最大化
    if ( type == "reCenterAuto"){
        var a = mg.document.currentPage;
        var b = a.findChild((item)=> item.absoluteBoundingBox.x <= info.x && item.absoluteBoundingBox.y <= info.y && item.absoluteBoundingBox.x + item.absoluteBoundingBox.width >= info.x && item.absoluteBoundingBox.y + item.absoluteBoundingBox.height >= info.y);
        //var b = mg.getNodeByPosition({x:info.x,y:info.y})
        //console.log(b)
        if (b){
            a.selection = [b];
            //mg.viewport.scrollAndZoomIntoView([b])
            ///*
            mg.viewport.scrollAndZoomIntoView(a.selection);
            if ( b.type !== "FRAME" || b.type !== "GROUP" || b.type !== "COMPONENT_SET" || b.type !== "COMPONENT" || b.type !== "INSTANCE"  ){
                var textArea = mg.createFrame();
                textArea.name = "临时选区"
                textArea.fills = [];
                cloneMain(textArea,b);
                a.insertChild(0,textArea);  
                mg.viewport.scrollAndZoomIntoView([a.children[0]]);
                mg.ui.postMessage(["","hasView"]);
                console.log('sendHasView')
            }
            if (b.children){
                var pick = b.findAll((item)=> item.absoluteBoundingBox.x <= info.x && item.absoluteBoundingBox.y <= info.y && item.absoluteBoundingBox.x + item.absoluteBoundingBox.width >= info.x && item.absoluteBoundingBox.y + item.absoluteBoundingBox.height >= info.y );
                if (pick.length > 0){
                    //a.selection = [pick[Math.floor(pick.length/2)]];
                    mg.viewport.scrollAndZoomIntoView([pick[Math.floor(pick.length/2)]]);
                    console.log("目标区域有子图层");  
                }                  
            }
            //*/
            
        } else {
            a.selection = []
            mg.viewport.center = {x:info.x,y:info.y}
            mg.viewport.zoom = 0.6
        }

        
    }
    //拆分路径
    if ( info == "reSVG"){
        var a = mg.document.currentPage;
        var b = a.selection;
        if ( b[0].type == "PEN"){
            //var cutSVG = b[0].clone()//mg.createPen();
            //cutSVG.penPaths = [b[1].penPaths];
            //b[0].fills = b[1].fills;
            //cloneMain(cutSVG,b[0]);
            var paths = cutPath( b[0].penPaths.data)
            console.log("含闭合路径：" + cutPath( b[0].penPaths.data).length)
            for (var i = 0; i < paths.length; i++){
                var cutSVG = b[0].clone()
                cutSVG.penPaths = [{data:paths[i],windingRule:"Nonzero",}]
            }
        }
    }
    //提取色号
    if ( type == "getColor"){    
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            var color = fillsToRGBA(b[i].fills[0].color);
            var node = mg.createText();
            cloneMain(node,b[i]);
            node.characters = color;
            b[i].parent.appendChild(node)
            if (b[i].width > 2560 || b[i].height > 2560){
                setTextMain(node,0,color.length,36);
                node.y -= node.height + 10
            } else if ( b[i].width < 500 || b[i].height < 500 ) {
                setTextMain(node,0,color.length,12);
                node.y -= node.height + 2
            } else {
                setTextMain(node,0,color.length,22);
                node.y -= node.height + 4
            }  
        }
    }
    //提取命名
    if ( info == 'nameToText'){
        var a = mg.document.currentPage;
        var b = a.selection.filter(item => item.name.split('#no').length == 1);
        //console.log(b)
        var nodes = []
        for (var i = 0; i < b.length; i++){
            var node = mg.createText();   
            node.characters = b[i].name; 
            setTextMain(node,0,b[i].name.length,18);
            /*
            if (b[i].width > 2560 || b[i].height > 1920){
                setTextMain(node,0,b[i].name.length,36);
                node.y -= 50
            } else if ( b[i].width < 500 || b[i].height < 500 ) {
                setTextMain(node,0,b[i].name.length,14);
                node.y -= 20
            } else {
                setTextMain(node,0,b[i].name.length,28);
                node.y -= 38
            }  
                */
            b[i].parent.appendChild(node);
            node.x = b[i].x;
            node.y = b[i].y - 24;
            nodes.push(node);
            /*
            if(i == b.length - 1){
                mg.group(nodes)
            }
                */
        }
        setTimeout(() => {
            mg.group(nodes)
        }, 500);
        
    }
    //建立伪描边{color:,size:,num:}
    if ( type == "setStyle-wmb"){
        var a = mg.document.currentPage;
        var b = a.selection;
        
        for (var i = 0; i < b.length; i++){
                creStyleWmb(info,b[i])
        }
    }
    if ( type == "reStyle-wmb"){
        var a = mg.document.currentPage;
        var b = a.selection;
        
        for (var i = 0; i < b.length; i++){
            if ( b[i].effects.length == 0){
                creStyleWmb(info,b[i])
            }else{
                var hex = mg.RGBAToHex((b[i].effects[0].color))
                var size = Math.max(b[i].effects[0].offset.x,b[i].effects[0].offset.y)
                var num = b[i].effects.length
                
                if(info[1] == "color"){
                    hex = info[0];
                }
                if(info[1] == "num"){
                    num = info[0];
                }
                if(info[1] == "size"){
                    size = info[0];
                }
                
                var newInfo = {color:hex,num:num,size:size}
                creStyleWmb(newInfo,b[i])
            }

        }
    }
    //双数像素
    if ( info == 'pixelToEven'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            intXY(b[i])
            evenWH(b[i])
        }
    }
    //整数像素
    if ( info == 'pixelToInt'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            intXY(b[i])
            intWH(b[i])
        }
    }
    //羽化边缘
    if ( info == 'yuhua'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            var group = mg.group([b[i]]);
            group.name = b[i].name;
            var min = Math.min(b[i].absoluteRenderBounds.width,b[i].absoluteRenderBounds.height);
            var yuhua = Math.ceil(0.044 * min + 6);//蒙版向内缩进值，模糊值则为yuhua*0.8
            //console.log(min,yuhua);
            var mask = mg.createRectangle();
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
            var maskG = mg.group([b[i].parent.children[0]]);
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
    }
    //拆分图层到画板
    if ( info == 'toFrameMore'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            var index = b[i].parent.children.findIndex(item => item === b[i]);
            
            if(b[i].children.length !== undefined){
                var n = b[i].children.length
                if(b[i].children.length !== 1){                  
                    for(var e = 1; e < n; e++){
                        var newframe = mg.createFrame();
                        cloneMain(newframe,b[i]);
                        newframe.name = b[i].children[1].name;
                        newframe.appendChild(b[i].children[1]);
                        newframe.fills = [];
                        b[i].parent.insertChild((index + e),newframe)
                        if( e == n - 1){
                            var group = mg.group([b[i]]);
                            group.name = b[i].name;
                            for( var ee = 0; ee < n - 1; ee++){
                                group.appendChild(a.children[index + 1])
                            }
                            b[i].name = b[i].children[0].name;
                        }
                    }
                }
            }
        }
    }
    //添加到画板
    if ( info == 'toFrame'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            var index = b[i].parent.children.findIndex(item => item === b[i]);
            var newframe = mg.createFrame();
            cloneMain(newframe,b[i]);
            b[i].parent.insertChild(index,newframe)
            newframe.name = b[i].name;
            newframe.appendChild(b[i]);
            newframe.fills = [];  
        }
    }
    //简单设置约束
    if ( info == 'easePosition'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            if ( (b[i].type == 'FRAME' || b[i].type == 'COMPONENT') && b[i].children ){
                
                //var c = b[i].findAll( (node) => node.type == 'RECTANGLE')
                var c = b[i].children.filter(node => node.name.split('#no').length == 1)
                var x1 = b[i].absoluteBoundingBox.x,y1 = b[i].absoluteBoundingBox.y,w1 = b[i].absoluteBoundingBox.width,h1 = b[i].absoluteBoundingBox.height;
                var axisX,axisY;
                
                for ( var e = 0; e < c.length; e++){
                    var x2 = c[e].absoluteBoundingBox.x ,y2 = c[e].absoluteBoundingBox.y ,w2 = c[e].absoluteBoundingBox.width ,h2 = c[e].absoluteBoundingBox.height;
                    var xc2 = x2 + w2/2,yc2 = y2 + h2/2;
                    console.log(c[e].name)
                    if ( h2 <= h1 * 6/8){
                        if ( yc2 < y1 + h1/2){
                            axisY = 'START'
                        } else if (yc2 > y1 + h1/2) {
                            axisY = 'END'
                        } else {
                            axisY = 'CENTER'
                        }
                    } else {
                        //console.log('超高')
                        if (y2 <= y1 && y2 + h2 >= y1 + h1){
                            //console.log('高超出')
                            axisY = 'STARTANDEND'
                        } else {
                            if ( yc2 <= y1 + h1 * 3/8){
                                axisY = 'START'
                            } else if (yc2 >= y1 + h1 * 5/8) {
                                axisY = 'END'
                            } else {
                                axisY = 'CENTER'
                            }
                        }
                       
                    }

                    if ( w2 <= w1 * 4/8){
                        if ( xc2 < x1 + w1/2){
                            axisX = 'START'
                        } else if (xc2 > x1 + w1/2) {
                            axisX = 'END'
                        } else {
                            axisX = 'CENTER'
                        }
                    } else {
                        //console.log('超宽')
                        if (x2 <= x1 && x2 + w2 >= x1 + w1){
                            //console.log('宽超出')
                            axisX = 'STARTANDEND'
                        } else {
                            if ( xc2 <= x1 + w1 * 3/8){
                                axisX = 'START'
                            } else if (xc2 >= x1 + w1 * 5/8) {
                                axisX = 'END'
                            } else {
                                axisX = 'CENTER'
                            }
                        }
                    }
                    console.log(axisX,axisY)
                    if ( c[e].children ){
                        c[e].findAll((node) => node.name.split('#no').length == 1).forEach(item => {
                            item.constraints = {
                                horizontal:axisX,
                                vertical:axisY,
                            }
                        })
                    } else {
                        c[e].constraints = {
                            horizontal:axisX,
                            vertical:axisY,
                        }
                    }
                    
                }
            }
        }
    }
    //批量转为组件
    if ( info == 'toComponent'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            if ( b[i].type !== 'COMPONENT'){
                var component = mg.createComponent();
                component.name = b[i].name;
                cloneMain(component,b[i]);
                component.fills = []
                b[i].parent.appendChild(component);
                if ( b[i].fills.length !== 0 || b[i].flexMode !== 'NONE' || b[i].strokes.length !== 0 || b[i].effects.length !== 0){
                    component.appendChild(b[i]);
                } else {
                    var l = b[i].children.length;
                    for ( var ii = 0; ii < l; ii++){
                        component.appendChild(b[i].children[0]);
                    } 
                    b[i].remove() 
                } 
            }
        }
    }
    //复制母组件
    if ( info == 'newComponent'){
        var a = mg.document.currentPage;
        var b = a.selection;
        var keytype = [
            'clipsContent',
            'strokes',
            'strokeStyleId',
            'strokeStyle',
            'strokeWeight',
            'fills',
            'fillsStyle',
            'cornerRadius',
            'effects',
            'layoutPositioning',
            'flexMode',
            'itemReverseZIndex',
            'itemSpacing',
            'crossAxisSpacing',
            'mainAxisAlignItems',
            'crossAxisAlignItems',
            'mainAxisSizingMode',
            'crossAxisSizingMode',
            'crossAxisAlignContent',
            'strokesIncludedInLayout',
            'paddingTop',
            'paddingRight',
            'paddingBottom',
            'paddingLeft',
            'componentPropertyValues'

        ]
        for (var i = 0; i < b.length; i++){
            if ( b[i].type == 'COMPONENT'){
                var component = mg.createComponent();
                component.name = b[i].name + "拷贝";
                cloneMain(component,b[i],true)
                keytype.forEach( item => {
                    if ( component[item] ){
                        component[item] =  b[i][item]
                    }
                    
                })
                for ( var ii = 0; ii < b[i].children.length; ii++){
                    component.appendChild(b[i].children[ii].clone());
                } 
                for ( var ii = 0; ii < b[i].children.length; ii++){
                    component.children[ii].x = b[i].children[ii].x
                    component.children[ii].y = b[i].children[ii].y
                }
                component.y += b[i].absoluteBoundingBox.height + 20
            }
        }
    }
    //调换位置
    if ( info == 'reXY'){
        
        var a = mg.document.currentPage;
        var b = a.selection;
        if ( b.length == 2){
            console.log("调换位置")
            var X1 = b[0].x,
            Y1 = b[0].y,
            X2 = b[1].x,
            Y2 = b[1].y,
            I1 = b[0].parent.children.findIndex(item => item === b[0]),
            I2 = b[1].parent.children.findIndex(item => item === b[1]),
            P1 = b[0].parent,
            P2 = b[1].parent;
            console.log(X1,Y1,X2,Y2)
            P1.insertChild(I1,b[1]);
            P2.insertChild(I2,b[0]); 
            b[0].x = X2;
            b[0].y = Y2;
            b[1].x = X1;
            b[1].y = Y1;
            //P1.insertChild(I1,b[1]);
            //P2.insertChild(I2,b[0]);     
            console.log(b[1].absoluteBoundingBox.x,b[1].absoluteBoundingBox.y,b[0].absoluteBoundingBox.x,b[0].absoluteBoundingBox.y)   
        }
    }
    //查找替换
    if ( type == "searchToRe"){
        find = [];
        //console.log(info)
        if(info.info !== ''){
            var a = mg.document.currentPage;
            var b = a.selection;
            var d = a.findAll((node) => isVall(node))
            if ( info.area == 'Page'){
                if ( info.type == 'Text'){
                    for ( var ii = 0; ii < d.length; ii++){
                        find.push(...d[ii].findAll((node) => node.type === 'TEXT' && node.characters.split(info.info).length > 1)) 
                    }

                    mg.ui.postMessage([find.length,'getFind'])
                    a.selection = [find[0]]
                    mg.viewport.scrollAndZoomIntoView(find); 
                }
                if ( info.type == 'Name' ){
                    var c = a.findAll((node) => node.isVisible == true)
                    c.forEach( item => {
                        if ( item.name == info.info){
                            find.push(item)
                        }
                    })
                    mg.ui.postMessage([find.length,'getFind'])
                    a.selection = [find[0]]
                    mg.viewport.scrollAndZoomIntoView(find); 
                }    
            }
            if ( info.area == 'Select' && b.length > 0 && b.map(nodes => nodes.isVisible == true )){
                if (searchTime == 0){
                    ///console.log(111)
                    seaechOldNodes = b

                    if ( info.type == 'Text'){
                        for ( var i = 0; i < b.length; i++){
                            if ( b[i].children ){
                                seaechOldNodes = b;
                                find.push(...b[i].findAll((node) => node.type === 'TEXT' && node.isVisible == true && node.characters.split(info.info).length > 1));
                            } else {
                                if ( b[i].type == 'TEXT' && b[i].characters.split(info.info).length > 1){
                                    find.push(b[i]);
                                } else {
                                    mg.notify("部分选中对象无效~",{
                                        type: "error",
                                        position: "bottom",
                                        timeout: 3000,
                                        isLoading: false,
                                    });
                                }
                            }
                        }
                        
                        mg.ui.postMessage([find.length,'getFind'])
                        a.selection = [find[0]]
                        
                    }
                    if ( info.type == 'Name' ){
                        var c  = [];
                        b.forEach( item => {
                            c.push(...item.findAll((node) => node.isVisible == true))
                        })
                         
                        c.forEach( item => {
                            if ( item.name == info.info){
                                find.push(item)
                            }
                        })
                        mg.ui.postMessage([find.length,'getFind'])
                        a.selection = [find[0]]
                        //mg.viewport.scrollAndZoomIntoView(find); 
                    } 
                } else {
                    if (seaechOldNodes.some(nodes => nodes.findAll((node) => node == b[0]).length > 0)){
                        //console.log(333,seaechOldNodes[0].name,b[0].name)
                        a.selection = seaechOldNodes;
                        var c = seaechOldNodes;
                        if ( info.type == 'Text'){
                            for ( var i = 0; i < c.length; i++){
                                find.push(...c[i].findAll((node) => node.type === 'TEXT' && node.isVisible == true && node.characters.split(info.info).length > 1))
                            }                          
                            mg.ui.postMessage([find.length,'getFind'])
                            a.selection = [find[0]]                            
                        }

                    } else {

                        if ( info.type == 'Text'){
                            for ( var i = 0; i < b.length; i++){
                                
                                if ( b[i].children ){
                                    seaechOldNodes = b;
                                    find.push(...b[i].findAll((node) => node.type === 'TEXT' && node.isVisible == true && node.characters.split(info.info).length > 1));
                                } else {
                                    if ( b[i].type == 'TEXT' && b[i].characters.split(info.info).length > 1){
                                        find.push(b[i]);
                                    } else {
                                        mg.notify("没有符合要求的选中对象~",{
                                            type: "error",
                                            position: "bottom",
                                            timeout: 3000,
                                            isLoading: false,
                                        });
                                    }
                                }              
                            }                          
                            mg.ui.postMessage([find.length,'getFind'])
                            a.selection = [find[0]]                           
                        }
                    }                                 
                }
                
                searchTime++
                
            }
            if ( info.type == 'Same' && b.length > 0 ){
                //console.log(666)
                
                if ( info.info == 'Font' && b[0].type === 'TEXT'){
                    var fontName = b[0].textStyles[0].textStyle.fontName.family
                    console.log(fontName)
                    for ( var ii = 0; ii < d.length; ii++){
                        find.push(...a.findAll((node) => node.type === 'TEXT' && node.textStyles[0].textStyle.fontName.family == fontName))
                    }
                    console.log(find)
                    mg.ui.postMessage([find.length,'getFind'])
                    a.selection = [find[0]]
                    mg.viewport.scrollAndZoomIntoView(find); 
                }
            }
            
        }
        
        function isVall(node){
            if (node.parent !== mg.document.currentPage){
                if (node.isVisible == true){
                    isVall(node.parent)
                } else {
                    return false
                }
            } else {
                if (node.isVisible == true){
                    return true
                } else {
                    return false
                }
            }
        }
    }
    //将定位的对象替换成指定内容
    if ( type == "rePick"){
        
        if(info[0] !== '' && info[1] !== ''){//[re,seaech]
            var a = mg.document.currentPage;
            var b = a.selection;
            for (var i = 0; i < b.length; i++){
                //console.log(info)
                if (b[i].type == 'TEXT'){
                    var style = b[i].textStyles;
                    var text = b[i].characters
                    b[i].characters = text.replace(new RegExp(info[1],'g') ,info[0]);

                    if(b[i].fills.length > 0 && b[i].fillStyleId == ''){
                        for (var e = 0; e < style.length; e++){
                            //console.log(style[e].start,style[e].end,style[e].fills[0])
                            b[i].setRangeFills(style[e].start,style[e].end,[style[e].fills[0]])
                        }
                    }

                }
            }
        }
    }
    //定位到查找对象
    if ( type == "searchPick"){
        var a = mg.document.currentPage;
        var b = a.selection;
        if ( find.length > 0){
            if ( info == 'all'){
                //console.log(find.length)
                a.selection = find.slice()
                mg.viewport.scrollAndZoomIntoView(a.selection);            
            } else {
                a.selection = [find[info - 1]]
                mg.viewport.center = {x:a.selection[0].absoluteBoundingBox.x,y:a.selection[0].absoluteBoundingBox.y}
            }
        }
    }
    //更新查找类型
    if ( type == "reSearchType"){
        searchType = info;
        var a = mg.document.currentPage;
        var b = a.selection;
        if (b[0] !== undefined){
            if (info == 'Same') {
                if ( b.length == 1){
                    mg.ui.postMessage([b[0].name,'searchInfo']);
                } else {
                    mg.ui.postMessage(['noOnly','searchInfo']);
                }
            }
        }
        
    }
    //更改查找范围
    if ( type == "reSearchArea"){
        searchArea = info;
    }

    //创建..附录/变量&样式表
    if ( type == "creStyleTable"){
        var styles = mg.getLocalPaintStyles().sort((a,b) => Number(a.id.replace(':','')) - Number(b.id.replace(':','')))
        console.log(styles)
        if ( styles.length !== 0 ){
            if ( styles.some(item => item.name.split('#样式组').length > 1)){
                if (!mg.document.children.some(items => items.name == stylePage) ){
                    //addStyleTable(stylePage,styles,'old') 
                } else {
                    if ( mg.document.children.filter(item => item.name == '附录/变量&样式表').length == 1){
                        var c = mg.document.children.filter(item => item.name == '附录/变量&样式表')[0]
                        var eg = c.findAll( (node) => node.name.split('本地样式集').length > 1)[0]
                        if ( eg ){
                            addStyleTable(stylePage,styles,'re',eg) 
                        } else {
                            mg.notify("未识别到本地样式表",{
                                type: "error",
                                position: "bottom",
                                timeout: 3000,
                                isLoading: false,
                            });
                        }
                        
                    } else {
                        mg.notify("变量&样式表只能生效一个",{
                            type: "error",
                            position: "bottom",
                            timeout: 3000,
                            isLoading: false,
                        });
                    }
                    
                }
            } else {
                if (!mg.document.children.some(items => items.name == stylePage) ){
                    addStyleTable(stylePage,styles,'new')  
                } else {
                    var c = mg.document.children.filter(item => item.name == '附录/变量&样式表')[0]
                    var eg = c.findAll( (node) => node.name.split('本地样式集').length > 1)[0]
                        if ( eg ){
                            addStyleTable(stylePage,styles,'re',eg) 
                        } else {
                            mg.notify("未识别到本地样式表",{
                                type: "error",
                                position: "bottom",
                                timeout: 3000,
                                isLoading: false,
                            });
                        }
                }
                
            }
                

        } else {
            mg.notify("请先创建本地样式~",{
                type: "error",
                position: "bottom",
                timeout: 3000,
                isLoading: false,
            });
        }
    }
    //将样式表移动到新页
    if ( type == "moveStyleTable"){
        //console.log(mg.document.children)
        var styles = mg.getLocalPaintStyles()
        //console.log(styles)
        var a = mg.document.currentPage;
        var c = mg.document.children.filter(item => item.name == '附录/变量&样式表')[0];
        
        if ( info == 'new' || info == 'old'){
            var table = a.findChild((node) => node.name == '变量表' && node.type == 'GROUP');
            //console.log(c)
            var num = table.children.length
            for ( var i = 0; i < num; i++){
                c.appendChild(table.children[0])
            }
            if ( info == 'new'){
                
                var style = styles.filter( item => item.name.split('/')[0] == '#样式组 示例2')
                //console.log(style)
                var eg = c.findAll( (node) => node.name.split('本地样式集').length > 1)[0]
                if ( eg.children[2] ){
                    for ( var i = 1; i < eg.children[2].children.length; i++){
                        eg.children[2].children[i].children[5].fillStyleId = style[i - 1].id
                    }
            
                }
            } else {
                console.log('设置样式表')
                var eg = c.findAll( (node) => node.name.split('本地样式集').length > 1)[0]
                for ( var i = 1; i < eg.children.length; i++){
                    for ( var e = 1; e < eg.children[i].children.length; e++){
                        //eg.children[i].children[e].children[5].fillStyleId = styles.filter(item => item.name.split(eg.children[0]) )
                        if ( eg.children[i].children[e].children[5].fillStyleId == ''){
                            //console.log( eg.children[0].children[e].componentProperties)
                            var key1 = eg.children[i].children[0].componentProperties[5].value
                            var key2 = eg.children[0].children[e].componentProperties[5].value
                            eg.children[i].children[e].children[5].fillStyleId = styles.filter(item => item.name.split('/').includes('#样式组 ' + key1) && item.name.split('/')[item.name.split('/').length - 1] == key2)[0].id
                        }
                    }
                }
            }
        }

        if ( info == 're'){
            console.log('更新样式表')
            var eg = c.findAll( (node) => node.name.split('本地样式集').length > 1)[0]
                for ( var i = 1; i < eg.children.length; i++){
                    for ( var e = 1; e < eg.children[i].children.length; e++){
                        //eg.children[i].children[e].children[5].fillStyleId = styles.filter(item => item.name.split(eg.children[0]) )
                        if ( eg.children[i].children[e].children[5].fillStyleId == ''){
                            //console.log( eg.children[0].children[e].componentProperties)
                            var key1 = eg.children[i].children[0].componentProperties[5].value
                            var key2 = eg.children[0].children[e].componentProperties[5].value
                            eg.children[i].children[e].children[5].fillStyleId = styles.filter(item => item.name.split('/').includes('#样式组 ' + key1) && item.name.split('/')[item.name.split('/').length - 1] == key2)[0].id
                        }
                    }
                }
        }
        
        
        
    }
     //从样式表更新
     if ( type == "reStyleFromTable"){
        var styles = mg.getLocalPaintStyles()
        var a = mg.document.currentPage;
        var b = a.selection;

       if (a.name == stylePage){
        var eg = a.findAll( (node) => node.name.split('本地样式集').length > 1)[0];
        for ( var i = 1; i < eg.children.length; i++){
            for ( var e = 1; e < eg.children[i].children.length; e++){
                if ( eg.children[i].children[e].children[5].fillStyleId == ''){
                    var key1 = eg.children[i].children[0].componentProperties[5].value
                    var key2 = eg.children[0].children[e].componentProperties[5].value
                    
                    if ( styles.filter(item => item.name.split('/').includes('#样式组 ' + key1) && item.name.split('/')[item.name.split('/').length - 1] == key2).length > 0){
                        styles.filter(item => item.name.split('/').includes('#样式组 ' + key1) && item.name.split('/')[item.name.split('/').length - 1] == key2)[0].paints = eg.children[i].children[e].children[5].fills;
                    } else {
                        mg.createFillStyle({id:eg.children[i].children[e].children[5].id,name:styles.filter(item => item.name.split('/')[item.name.split('/').length - 1] == key2)[0].name.replace(/^[^\/]+/,'#样式组 ' + key1)})
                    }
                }
                if ( i == eg.children.length - 1 && e == eg.children[i].children.length - 1){
                    console.log('从表更新样式')
                    mg.ui.postMessage(['re','hasStyleTable'])
                }
            }
        }
       }
        
     }
    //切换样式组
    if ( type == "reStyleGroup"){
        //console.log(info)
        var a = mg.document.currentPage;
        var b = a.selection;
        var styles = mg.getLocalPaintStyles()
        var c = []
        for (var i = 0; i < b.length; i++){
                
            if (b[i].children){
                if ( b[i].fillStyleId !== ''){
                    var name2 = mg.getStyleById(b[i].fillStyleId).name
                    //console.log(name2.replace(/^[^\/]+/,info))
                    b[i].fillStyleId = styles.filter(item => item.name == name2.replace(/^[^\/]+/,'#样式组 ' + info))[0].id
                }
                var allnode = b[i].findAll((node) => node.fillStyleId !== '');
                allnode.forEach( item => {
                    var name2 = mg.getStyleById(item.fillStyleId).name
                    if ( styles.filter(item => item.name == name2.replace(/^[^\/]+/,'#样式组 ' + info))[0]) {
                        item.fillStyleId = styles.filter(item => item.name == name2.replace(/^[^\/]+/,'#样式组 ' + info))[0].id
                    } else {
                        mg.notify("存在未同步样式，可更新本地样式表后重试",{
                            type: "error",
                            position: "top",
                            timeout: 3000,
                            isLoading: false,
                        });
                    }
                    
                })
            } else {
                if ( b[i].fillStyleId !== ''){
                    var name2 = mg.getStyleById(b[i].fillStyleId).name
                    console.log(name2.replace(/^[^\/]+/,info))
                    b[i].fillStyleId = styles.filter(item => item.name == name2.replace(/^[^\/]+/,'#样式组 ' + info))[0].id
                }
            }
        }
    }
    //清空示例样式
    if ( info == 'noStyle'){
        var styles = mg.getLocalPaintStyles()
        var id = styles.filter(item => item.name.split('test').length > 1).map(item => item.id)
        for(var i = 0; i < id.length; i++){
            mg.getStyleById(id[i]).remove()
        }
        var styles2 = mg.getLocalPaintStyles()
        if ( styles2.length !== 0){
            mg.ui.postMessage([true,'hasStyle'])
        } else {
            mg.ui.postMessage([false,'hasStyle'])
        }
        send()
    }
    //示例样式
    if ( info == 'egStyle'){
        addColorStyle('test1','21CDEF');
        addColorStyle('test2','E18C31');
        addColorStyle('test3','D23535');
        mg.ui.postMessage([true,'hasStyle']);
        send()
    }
    //重链样式
    if ( type == "linkStyle"){
        var style = mg.getLocalPaintStyles()
        if ( info == 'all'){
            var loading =  mg.notify("重链中，请耐心等待",{
                position:"bottom",
                isLoading: true,
                timeout: 6000,
            });
            setTimeout(() => {
            diffStyleNode.forEach( item => {
                if (item.fillStyleId !== ''){
                    var name2 = mg.getStyleById(item.fillStyleId).name;
                    if ( style.filter( item => item.name == name2).length > 0){
                        item.fillStyleId = style.filter( item => item.name == name2)[0].id;
                    }
                }
                if (item.strokeStyleId !== ''){
                    var name2 = mg.getStyleById(item.strokeStyleId).name;
                    if ( style.filter( item => item.name == name2).length > 0){
                        item.strokeStyleId = style.filter( item => item.name == name2)[0].id;
                    }
                }
             })
             mg.ui.postMessage(['hasLinkStyle','hasLinkStyle'])
             loading.cancel()
            },100)
        } else {
         diffStyleNode.forEach( item => {
            if (item.fillStyleId !== '' && item.fillStyleId == info){
                var name2 = mg.getStyleById(info).name;
                //console.log(style.filter( item => item.name == name2)[0].id)
                item.fillStyleId = style.filter( item => item.name == name2)[0].id;
            }
            if ( item.strokeStyleId !== '' && item.strokeStyleId == info){
                var name2 = mg.getStyleById(info).name;
                item.strokeStyleId = style.filter( item => item.name == name2)[0].id;
            }
         })
         mg.ui.postMessage(['hasLinkStyle','hasLinkStyle']);
        }
    }
    //覆盖样式
    if ( type == "setDiffStyle"){
        var style = mg.getLocalPaintStyles()
        if ( info == 'all'){
            var loading =  mg.notify("覆盖中，请耐心等待",{
                position:"bottom",
                isLoading: true,
                timeout: 6000,
            });
            setTimeout(() => {
                diffStyleNode.forEach( item => {
                    if (item.fillStyleId !== ''){
                        var name2 = mg.getStyleById(item.fillStyleId).name;
                        if ( style.filter( item => item.name == name2).length > 0){
                            if ( style.filter( item => item.name == name2)[0].paints !== item.fills){
                                style.filter( item => item.name == name2)[0].paints = item.fills;
                            }  
                        }
                    }
                    if (item.strokeStyleId !== ''){
                        var name2 = mg.getStyleById(item.strokeStyleId).name;
                        if ( style.filter( item => item.name == name2).length > 0){
                            if ( style.filter( item => item.name == name2)[0].paints !== item.strokes){
                                style.filter( item => item.name == name2)[0].paints = item.strokes;
                            }  
                        }
                    }
                 })
                 mg.ui.postMessage(['all','hasSetLinkStyle'])
                 loading.cancel()
            },100)
            
        } else {
            diffStyleNode.forEach( item => {
                if ( item.fillStyleId !== '' && item.fillStyleId == info){
                    var name2 = mg.getStyleById(info).name;
                    if ( style.filter( item => item.name == name2)[0].paints !== item.fills){
                        style.filter( item => item.name == name2)[0].paints = item.fills;
                    } 
                }
                if ( item.strokeStyleId !== '' && item.strokeStyleId == info){
                    var name2 = mg.getStyleById(info).name;
                    if ( style.filter( item => item.name == name2)[0].paints !== item.strokes){
                        style.filter( item => item.name == name2)[0].paints = item.strokes;
                    }  
                }
            })
            mg.ui.postMessage([info,'hasSetLinkStyle']);
        }
    }
    //选中要重链的图层
    if ( type == "diffStylePick"){
        //console.log(info)
        //console.log(diffStyleNode.filter( item => item.fillStyleId == info))
        var a = mg.document.currentPage;
        a.selection = diffStyleNode.filter( item => item.fillStyleId == info || item.strokeStyleId == info)
    }
    //新建样式
    if ( type == "newStyle"){
        //console.log(info)
        var style = mg.getLocalPaintStyles()
        if ( info == 'all'){
            var loading =  mg.notify("新建中，请耐心等待",{
                position:"bottom",
                isLoading: true,
                timeout: 6000,
            });
            setTimeout(() => {
                var ids = []
                diffStyleNode.forEach( item => {
                    if (item.fillStyleId !== ''){
                        ids.push(mg.getStyleById(item.fillStyleId).id)
                    }
                    if (item.strokeStyleId !== ''){
                        ids.push(mg.getStyleById(item.strokeStyleId).id)
                    }
                }) 
                var news = [...new Set(ids)] 
                news.forEach( ID => {
                    var name2 = mg.getStyleById(ID).name;
                    var node = mg.createRectangle();
                    node.fills = mg.getStyleById(ID).paints.reverse();//样式层有颠倒bug
                    
                    var id2 = node.id;
                    mg.createFillStyle({id:id2,name:name2});
                    node.remove();
                })
                mg.ui.postMessage([info,'hasNewStyle'])
                loading.cancel()
            },100)
        } else {

            var name2 = mg.getStyleById(info).name;
            var node = mg.createRectangle();
            node.fills = mg.getStyleById(info).paints.reverse();
            var id2 = node.id;
            mg.createFillStyle({id:id2,name:name2});
            node.remove();
            mg.ui.postMessage([name2,'hasNewStyle'])
             
        }
    }
    //更新离线样式为新建样式
    if ( type == "reNewStyle"){
        //console.log(info)
        var style = mg.getLocalPaintStyles()
        //console.log(style)
        if ( info == 'all'){
            diffStyleNode.forEach( item => {
                if ( item.fillStyleId !== ''){
                    //console.log(style.filter( item => item.name == info))
                    var name2 = mg.getStyleById(item.fillStyleId).name
                    item.fillStyleId = style.filter( items => items.name == name2)[0].id
                }
                if (item.strokeStyleId !== ''){
                    var name2 = mg.getStyleById(item.strokeStyleId).name
                    item.strokeStyleId = style.filter( items => items.name == name2)[0].id
                }
            })
            send()
        } else {
            diffStyleNode.forEach( item => {
                if ( item.fillStyleId !== '' && mg.getStyleById(item.fillStyleId).name == info){
                    //console.log(style.filter( item => item.name == info))
                    item.fillStyleId = style.filter( items => items.name == info)[0].id
                }
                if (item.strokeStyleId !== '' && mg.getStyleById(item.strokeStyleId).name == info){
                    item.strokeStyleId = style.filter( items => items.name == info)[0].id
                }
            })
            send()
        }
        
    }
    //选中对象进行梯度变化
    if ( type == "mixNode"){
        var a = mg.document.currentPage;
        var b = a.selection;
        
        if ( b.length > 2){
            //if ( b[0].name.split('#mix').length > 1 && b[b.length - 1].name.split('#mix').length > 1){
            if ( b[0].children && b[0].findAll((nodes) => nodes.name.split('#mix').length > 1).length > 0){
                var starMix = b[0].findAll((items) => items.name.split('#mix').length > 1);
                var endMix = b[b.length - 1].findAll((items) => items.name.split('#mix').length > 1);
                var reMix
                if ( starMix.length = endMix.length){
                    for ( i = 1; i < b.length - 1; i++){
                        reMix = b[i].findAll((items) => items.name.split('#mix').length > 1);
                        info.forEach( mix => {
                            if ( mixType[mix]){
                                var func = mixType[mix];
                                func(starMix,reMix,endMix,b.length,i);
                            }
                        })
                        //mixPd(starMix,reMix,endMix,b.length)
                    }
                }
                
            } else {
                for ( i = 1; i < b.length - 1; i++){
                    info.forEach( mix => {
                        if ( mixType[mix]){
                            var func = mixType[mix];
                            func([b[0]],[b[i]],[b[b.length - 1]],b.length - 1,i);
                        }
                    })
                }
            }
            
        } else {
            mg.notify("请选中2个以上对象",{
                type: "error",
                position: "bottom",
                timeout: 3000,
                isLoading: false,
            });
        }
    
    }
    //增量梯度变化
    if ( type == "mixNodeClone"){
        var a = mg.document.currentPage;
        var b = a.selection;
        if ( b.length == 2){
            //if ( b[0].name.split('#mix').length > 1 && b[1].name.split('#mix').length > 1){
            if ( b[0].children && b[0].findAll((nodes) => nodes.name.split('#mix').length > 1).length > 0){
                var starMix = b[0].findAll((items) => items.name.split('#mix').length > 1);
                var endMix = b[1].findAll((items) => items.name.split('#mix').length > 1);
                var reMix
                if ( starMix.length = endMix.length){
                    for ( i = 1; i < (info[1]*1 + 1 ); i++){
                        if ( info[0].length > 0){
                            if ( info[0].some( item => mixType[item])){
                                var node = b[1].clone();
                                reMix = node.findAll((items) => items.name.split('#mix').length > 1);
                                info[0].forEach( mix => {
                                    if ( mixType[mix]){   
                                        var func = mixType[mix];
                                        func(starMix,reMix,endMix,1,i + 1);
                                    }
                                })
                            } 
                        }
                        
                    }
                }
                
            } else {
                for ( i = 1; i < (info[1]*1 + 1 ); i++){
                    //console.log(b[0].rotation,b[1].rotation)
                    if ( info[0].length > 0){
                        if ( info[0].some( item => mixType[item])){
                            var node = b[1].clone();
                            info[0].forEach( mix => {
                                if ( mixType[mix]){   
                                    var func = mixType[mix];
                                    func([b[0]],[node],[b[1]],1,i + 1);
                                }
                            })
                        } 
                    }
                    
                }
            }
        } else {
            mg.notify("请选中2个对象",{
                type: "error",
                position: "bottom",
                timeout: 3000,
                isLoading: false,
            });
        }
    }
    //复用组件
    if ( type == "componentSet"){
        var a = mg.document.currentPage;
        var b = a.selection;
        if ( info == 'copy'){
            for ( var i = 1; i < b.length; i++){
                if ( b[i].componentProperties && b[0].componentProperties){
                    console.log("含文字属性")
                    var text = []
                    b[i].componentProperties.forEach(item => {
                        if(item.type == 'TEXT')
                        text.push(item.value)
                    })
                    b[i].mainComponent =  JSON.parse( JSON.stringify(b[0].mainComponent) )
                    mg.ui.postMessage([[text,b[i].id],'hasreComponent'])
                    
                        
                } else {
                    b[i].mainComponent =  JSON.parse( JSON.stringify(b[0].mainComponent) )
                }
            
            }
        }
        if ( info == 'copyByGoup'){
            for ( var i = 0; i < b.length; i++){
                if ( b[i].type == 'INSTANCE')
                var componentKey = b[i].findAll((node) => node.mainComponent && node.mainComponent.parent.componentPropertyDefinitions )[0];
                if ( componentKey ){
                    //console.log(componentKey.variantProperties)
                    var componentGroup = componentKey.mainComponent.parent.children.map(node => node.variantProperties[0].value)//componentPropertyDefinitions[0].values;
                    componentGroup.forEach(item => {
                        var news = b[i].clone();
                        var keys = news.findAll((node) => node.mainComponent && node.mainComponent.parent.componentPropertyDefinitions )[0];
                        keys.setVariantPropertyValues({[keys.variantProperties[0].property]:item})
                    })
                    b[i].remove()
                } else {
                    mg.notify("所选对象不含嵌套变体",{
                        type: "error",
                        position: "bottom",
                        timeout: 3000,
                        isLoading: false,
                    });
                }
            }
                
        }
    }
    //修改组件属性
    if ( type == "reComponentText"){
        var a = mg.document.currentPage;
        var b = mg.getNodeById(info[1]).findAll((node) => node.componentPropertyReferences.characters);
        b.forEach(item => {
            item.characters = info[0][0]
        })
       
    }
    //重新拉取
    if ( type == "reSend"){
        send()
        console.log('刷新')
    }
    //提取色板
    if ( type == "creColor"){
        var a = mg.document.currentPage;
        var b = a.selection;
        var colorBox = mg.createFrame();
        cloneMain(colorBox,b[0]);
        colorBox.x += b[0].width + 20;
        colorBox.layoutPositioning = "AUTO";
        colorBox.flexGrow = 0;
        colorBox.flexMode = "HORIZONTAL";
        colorBox.flexWrap = "NO_WRAP";
        colorBox.fills = []
        console.log(info)
        info.forEach(item => {
            var box = mg.createRectangle()
            box.width = 20
            box.height = 20
            box.fills = [{
                type:"SOLID",
                color:{
                    r:item[0]/255,
                    g:item[1]/255,
                    b:item[2]/255,
                    a:1,
                }
            }]
            colorBox.appendChild(box)
        })
    }
    //提取原始路径
    if ( info == 'getPath'){
        var a = mg.document.currentPage;
        var b = a.selection;
        var svgText = '';
        if ( b.length == 1){
            svgText += '<svg width="' + b[0].width + '" height="' + b[0].height + '" viewBox="0 0 '+ b[0].width + ' ' + b[0].height + '">\n';
            var starX = b[0].x,starY = b[0].y;
            b[0].children.forEach( item => {
                if ( item.type == 'PEN' ){
                    svgText += '<g>\n<path d="' + item.penPaths.data + '"></path>\n</g>'
                }else{      
                    if ( item.children ){
                        svgText += '<g>\n'
                        item.children.forEach(items => {
                            if ( items.type == 'PEN' ){
                                svgText += '<g>\n<path d="' + items.penPaths.data + '"></path>\n</g>'
                            }
                        })
                        svgText += '</g>\n'
                    }
                    
                }
            })
            svgText += '</svg>'
            
        }
        //console.log(svgText)
        var node = mg.createText();
        node.x = b[0].x + b[0].width;
        node.y = b[0].y;
        node.characters = svgText;
        b[i].parent.appendChild(node)
         setTextMain(node,0,svgText.length,4);
        b[0].parent.appendChild(node)
    }
}
  
//初始化
send()

mg.on('currentpagechange',function(){
    if ( tabInfo == "tab-4"){
        createrMap()
    }
})



mg.on('selectionchange', function(){
    //console.log('所选对象发生变化')
    send()
    pickTableArea = false;
})

function send(){
    var a = mg.document.currentPage;
    var b = a.selection;
    if( a.name == stylePage || a.name == '附录/变量表格'){
        mg.ui.postMessage([5,'toTab'])
    }
    var parents = b.map(item => item.parent.name)
    if ( [...new Set(parents)].length == 1){
        mg.ui.postMessage([[a.parent.name,a.name,b[0].parent.name,b.length],'docInfo'])
    } else {
        mg.ui.postMessage([[a.parent.name,a.name,b.length],'docInfo'])
    }
    //var sidePage = true;
    if (b[0] !== undefined){
        
        if ( b.some(node => (node.type == "FRAME" ||  node.type == "GROUP" ) && (node.name.split("#table").length !== 1 || node.name.split("#列").length !== 1 || node.name.split("数据流").length !== 1) && searchType !== 'Same' && searchArea !== 'Select' ) ){

                mg.ui.postMessage(['sidePage','changeUI']);
                mg.ui.postMessage(["table","toTool"])

        } else if ( b[0].type == "RECTANGLE"  ) {
            if ( b[0].fills[0] !== undefined){
                if ( b.length == 1 && b[0].fills[0].type == "IMAGE"){
                    mg.ui.postMessage(["image","toTool"])
                } 
            }
                
        } else if ( b[0].type == "TEXT" && tabInfo !== 'tab-2' && tabInfo !== 'tab-3' && searchType !== 'Same' && searchArea !== 'Select' ){
            
            if ( b[1] == undefined){
                //mg.ui.postMessage(['sidePage','changeUI']);
                //mg.ui.postMessage(["text","toTool"])
            } else {
                if ( b[1].name.split("table").length !== 1){
                    mg.ui.postMessage(['sidePage','changeUI']);
                    mg.ui.postMessage(["table","toTool"])
                }
            }

        } else {
            //mg.ui.postMessage([b[0].type,"toTool"])
        }
         
        var effects = []
        for ( var i = 0; i < b.length; i++){
            
            if (b[0].effects && b[i].effects.length !== 0 ){
                if ( b[i].effects[0].type == "DROP_SHADOW") {
                    effects.push([mg.RGBAToHex(b[i].effects[0].color).substring(0,7),b[i].effects.length,Math.max(b[i].effects[0].offset.x,b[i].effects[0].offset.y )] )  
                }
                if ( i == b.length - 1){
                    mg.ui.postMessage([effects,'wmbEffects'])
            }
            }
            
        }

        if (b[0].getPluginData('skewInfo')){
            //console.log(JSON.parse(b[0].getPluginData('skewInfo')))
            mg.ui.postMessage([JSON.parse(b[0].getPluginData('skewInfo')),'skewData']);
            //mg.ui.postMessage(["skew","toTool"])
        } else {
            mg.ui.postMessage([{x:0,y:0,w:100,h:100},'skewData']);
        }

        
            
        if (searchType == 'Same') {
            if ( b.length == 1){
                mg.ui.postMessage([b[0].name,'searchInfo']);
            } else {
                mg.ui.postMessage(['noOnly','searchInfo']);
            }
            
        }

        if ( tabInfo == 'tab-5'){
            diffStyleNode = []
            var styles = mg.getLocalPaintStyles().sort((a,b) => Number(a.id.replace(':','')) - Number(b.id.replace(':','')));
            //console.log(styles[0])
            if ( styles.length !== 0){
                mg.ui.postMessage([true,'hasStyle'])
                mg.ui.postMessage([false,'hasStyleTable'])
            } else {
                mg.ui.postMessage([false,'hasStyle'])  
                mg.ui.postMessage([true,'hasStyleTable'])
            }
            var name1 = styles.map(item => item.name);
            var nameGroup = []
            name1.forEach( item => {
                nameGroup.push(item.split('/')[0].split('#样式组 ')[1])
            })
            var styleGroup =  [...new Set(nameGroup)]
            if ( styleGroup.some(item => item !== undefined)){
                console.log(styleGroup)
                if ( styleGroup.some(item => item == undefined)){
                    mg.notify("部分样式不在样式组内，可能无法正常切换样式组！",{
                        position: "top",
                        timeout: 3000,
                        isLoading: false,
                    });
                    var last = []
                    styleGroup.forEach( item => {
                        if ( item !== undefined){
                            last.push(item)
                        }
                    })
                    mg.ui.postMessage([last,'getStyleGroup'])
                } else if ( !styleGroup.some(item => item == undefined) ) {
                    mg.ui.postMessage([styleGroup,'getStyleGroup'])
                }
            }
            
            
            var id1 = styles.map(item => item.id)
            var name2 = [];
            var type;
            for (var i = 0; i < b.length; i++){
                if ( b[i].fillStyleId !== ''){
                    var NAME = mg.getStyleById(b[i].fillStyleId).name;
                    var ID = mg.getStyleById(b[i].fillStyleId).id;
                    if ( name1.includes(NAME) && id1.includes(ID)){
                        type = 'OLD'
                    }
                    if ( name1.includes(NAME) && !id1.includes(ID)){
                        type = 'DIFF'
                        if ( !diffStyleNode.includes(b[i])){
                            diffStyleNode.push(b[i])
                        }  
                    }
                    if ( !name1.includes(NAME) && !id1.includes(ID)){
                        type = 'NEW'
                        if ( !diffStyleNode.includes(b[i])){
                            diffStyleNode.push(b[i])
                        }  
                    }
                    name2.push([NAME.split('/')[NAME.split('/').length - 1],mg.getStyleById(b[i].fillStyleId).id,type])
                }
                if (  b[i].strokeStyleId !== ''){
                    var NAME2 = mg.getStyleById(b[i].strokeStyleId).name;
                    var ID2 = mg.getStyleById(b[i].strokeStyleId).id;
                    if ( name1.includes(NAME2) && id1.includes(ID2)){
                        type = 'OLD'
                    }
                    if ( name1.includes(NAME2) && !id1.includes(ID2)){
                        type = 'DIFF'
                        if ( !diffStyleNode.includes(b[i])){
                            diffStyleNode.push(b[i])
                        }  
                    }
                    if ( !name1.includes(NAME2) && !id1.includes(ID2)){
                        type = 'NEW'
                        if ( !diffStyleNode.includes(b[i])){
                            diffStyleNode.push(b[i])
                        }  
                    }
                    name2.push([NAME2.split('/')[NAME2.split('/').length - 1],mg.getStyleById(b[i].strokeStyleId).id,type])
                }
                if (b[i].children && b[i].name.split('样式集').length == 1){
                    
                    var allnode = b[i].findAll((node) => node.fillStyleId !== '' || node.strokeStyleId !== '')
                    allnode.forEach( item => {
                        
                        if ( item.fillStyleId !== ''){
                            
                            var NAME = mg.getStyleById(item.fillStyleId).name;
                            var ID = mg.getStyleById(item.fillStyleId).id;
                            if ( name1.includes(NAME) && id1.includes(ID)){
                                type = 'OLD'
                            }
                            if ( name1.includes(NAME) && !id1.includes(ID)){
                                type = 'DIFF'
                                if ( !diffStyleNode.includes(item)){
                                    diffStyleNode.push(item)
                                }  
                            }
                            if ( !name1.includes(NAME) && !id1.includes(ID)){
                                //console.log(mg.getStyleById(item.fillStyleId).name,item.fillStyleId)
                                type = 'NEW'
                                if ( !diffStyleNode.includes(item)){
                                    diffStyleNode.push(item)
                                } 
                            }
                            name2.push([NAME.split('/')[NAME.split('/').length - 1],mg.getStyleById(item.fillStyleId).id,type])
                        }
                        if ( item.strokeStyleId !== ''){
                            var NAME2 = mg.getStyleById(item.strokeStyleId).name;
                            var ID2 = mg.getStyleById(item.strokeStyleId).id;
                            if ( name1.includes(NAME2) && id1.includes(ID2)){
                                type = 'OLD'
                            }
                            if ( name1.includes(NAME2) && !id1.includes(ID2)){
                                type = 'DIFF'
                                if ( !diffStyleNode.includes(item)){
                                    diffStyleNode.push(item)
                                }  
                            }
                            if ( !name1.includes(NAME2) && !id1.includes(ID2)){
                                type = 'NEW'
                                if ( !diffStyleNode.includes(item)){
                                    diffStyleNode.push(item)
                                } 
                            }
                            name2.push([NAME2.split('/')[NAME2.split('/').length - 1],mg.getStyleById(item.strokeStyleId).id,type])
                        }
                    })
                } 

                if ( i == b.length - 1){
                    //console.log([...new Set( name2.map(JSON.stringify))].map(JSON.parse))
                    var nameLast = [...new Set( name2.map(JSON.stringify))].map(JSON.parse)
                    mg.ui.postMessage([nameLast,'getNodeStyle'])
                    if (nameLast.some(item => item[2] == 'DIFF' || item[2] == 'NEW')){
                        mg.ui.postMessage([true,'styleLinkAndNew'])
                    } else {
                        mg.ui.postMessage([false,'styleLinkAndNew'])
                    }
                }
            }
            
        }
        
        
    } else {
        mg.ui.postMessage([{x:0,y:0,w:100,h:100},'skewData']);
        mg.ui.postMessage(['noSidePage','changeUI']);
        mg.ui.postMessage([[["#000000",4,1]],'wmbEffects'])
        mg.ui.postMessage([false,'searchInfo']);
        mg.ui.postMessage([[],'getNodeStyle'])
        mg.ui.postMessage([false,'styleLinkAndNew'])

            var styles = mg.getLocalPaintStyles();
            if ( styles.length !== 0){
                mg.ui.postMessage([true,'hasStyle'])
                mg.ui.postMessage([false,'hasStyleTable'])
            } else {
                mg.ui.postMessage([false,'hasStyle'])  
                mg.ui.postMessage([true,'hasStyleTable'])
            }


    }

    
}

async function fillTheSelection(node,img) {
    const imageHandle = await mg.createImage(img);
    // 设置图片填充
    node.fills = [
        {
        type: "IMAGE",
        scaleMode: "FILL",
        imageRef: imageHandle.href, // 将 href 作为图片填充的 imageRef
        },
    ];
}

async function fillTheSelection2(node,img) {
    const imageHandle = await mg.createImage(img);
    // 设置图片填充
    node.fills = [
        {
        type: "IMAGE",
        imageRef: imageHandle.href, // 将 href 作为图片填充的 imageRef
        filters:{contrast: 0,exposure: 0,highlights: 0,hue: 0,saturation: -1,shadows: 0,temperature: 0,tint: 0},
        scaleMode:'TILE',
        //ratio:0.1,
        alpha:0.5,
        },
    ];
}

function tableToData(text,dataToList){
    if ( dataToList ){
        var h = text.split("\n");//[[文案\t文案\t文案],[文案\t文案\t文案]]
        var hs = [];//[[文案,文案,文案],[文案,文案,文案,]]
        var e = 0;
        for (var i = 0; i < h.length; i++){
            hs[e] = h[i].split("\t");
            e++
        }
        return hs[0].map((col, i) => hs.map(row => row[i]))
    } else {
        var h = text.split("\n");//[[文案\t文案\t文案],[文案\t文案\t文案]]
        var hs = [];//[[文案,文案,文案],[文案,文案,文案,]]
        var e = 0;
        for (var i = 0; i < h.length; i++){
            hs[e] = h[i].split("\t");
            e++
        }
        return hs
    }
    
}

function cloneMain(newnode,oldnode,boundingBox){
    newnode.width = oldnode.width;
    newnode.height = oldnode.height;
    if ( boundingBox ){
        newnode.x = oldnode.absoluteBoundingBox.x;
        newnode.y = oldnode.absoluteBoundingBox.y;
    } else {
        newnode.x = oldnode.absoluteRenderBounds.x;
        newnode.y = oldnode.absoluteRenderBounds.y;
    }
    
}

function cloneKey(key,newnode,oldnode){
    for ( var i = 0; i < key.length; i++){
        newnode.key[i] = JSON.parse(JSON.stringify(oldnode.key[i]));
    }
}

function setStroke(node,align,trbl){
    node.fills = [];
    node.strokes = [{type:"SOLID",color:{r:0.5,g:0.5,b:0.5,a:1,}}];
    node.strokeTopWeight = trbl[0];
    node.strokeRightWeight = trbl[1];
    node.strokeBottomWeight = trbl[2];
    node.strokeLeftWeight = trbl[3];
    node.strokeAlign = align
}

function setRadius(node,trbl){
    node.topLeftRadius = trbl[0];
    node.topRightRadius = trbl[1];
    node.bottomRightRadius= trbl[2];
    node.bottomLeftRadius = trbl[3];
}

function addAbsolute(parent,absoluteNode,names,view){
    parent.appendChild(absoluteNode);
    absoluteNode.name = names;
    absoluteNode.layoutPositioning = "ABSOLUTE";
    absoluteNode.x = 0;
    absoluteNode.y = 0;
    var addLayerSet = parent.addComponentProperty(names,"BOOLEAN",view);
    absoluteNode.componentPropertyReferences = {isVisible:addLayerSet};
}

function reTableStroke(table,H,L){
    for ( var i = 0; i < L; i++){
        for ( var ii = 0; ii < H; ii++){
            var c = table.children[i].children[ii]
            if ( c.componentProperties[1].name == '上描边' && c.componentProperties[4].name == '左描边'){
                var l = c.componentProperties[4].value;
                var r = c.componentProperties[2].value;
                var t = c.componentProperties[1].value;
                var b = c.componentProperties[3].value;
                c.setProperties({[c.componentProperties[4].id]:t});
                c.setProperties({[c.componentProperties[2].id]:b});
                c.setProperties({[c.componentProperties[1].id]:l});
                c.setProperties({[c.componentProperties[3].id]:r});
            }
        }
    }
}

function creTableSet(node,name,view,needText,textOrClone,){
    node.name = name;
    node.layoutPositioning = "AUTO";
    node.clipsContent = false;
    node.flexGrow = 0;
    node.flexMode = "HORIZONTAL";
    node.flexWrap = "NO_WRAP";
    node.itemSpacing = 0;
    node.mainAxisAlignItems = "CENTER";
    node.mainAxisSizingMode = "FIXED";
    node.crossAxisAlignItems = "CENTER"; 
    node.crossAxisSizingMode = "FIXED";
    node.crossAxisSpacing = 0;
    node.paddingTop = 10;
    node.paddingBottom = 10;
    node.width = 176;
    node.height = 52;
    node.fills = [];
    var colorLayer = mg.createRectangle();
    cloneMain(colorLayer,node)
    if (view){
        colorLayer.fills = [{type:"SOLID",color:{r:0.4,g:0.4,b:0.4,a:1,}}];
    } else {
        colorLayer.fills = [{type:"SOLID",color:{r:0.4,g:0.4,b:0.4,a:0.5,}}];
    }

    var strokeTop = mg.createRectangle();
    cloneMain(strokeTop,node);
    setStroke(strokeTop,"CENTER",[1,0,0,0]);
    var strokeRight = mg.createRectangle();
    cloneMain(strokeRight,node);
    setStroke(strokeRight,"CENTER",[0,1,0,0]);
    var strokeBottom = mg.createRectangle();
    cloneMain(strokeBottom,node);
    setStroke(strokeBottom,"CENTER",[0,0,1,0]);
    var strokeLeft = mg.createRectangle();
    cloneMain(strokeLeft,node);
    setStroke(strokeLeft,"CENTER",[0,0,0,1]);

    var diffC = mg.group([colorLayer]);
    var strokeT = mg.group([strokeTop]);
    var strokeR = mg.group([strokeRight]);
    var strokeB = mg.group([strokeBottom]);
    var strokeL = mg.group([strokeLeft]);


    addAbsolute(node,diffC,"区分色",view)
    addAbsolute(node,strokeT,"上描边",false)
    addAbsolute(node,strokeR,"右描边",false)
    addAbsolute(node,strokeB,"下描边",false)
    addAbsolute(node,strokeL,"左描边",false)

    if (needText == true){
        node.appendChild(mg.createText())

        for ( var ii = 0; ii < node.children.length; ii++){
            if ( node.children[ii].type == "TEXT"){
                //node.children[ii].flexGrow = 1; 
                node.children[ii].textAutoResize = "HEIGHT";
                if (Object.keys(node.children[ii].componentPropertyReferences).length === 0){
                    var addTextSet = node.addComponentProperty("字段1", "TEXT", node.children[ii].characters);
                    node.children[ii].componentPropertyReferences = {characters:addTextSet};
                    node.children[ii].characters = textOrClone;
                    node.children[ii].textAlignHorizontal = "CENTER";
                    node.children[ii].textAutoResize = "WIDTH_AND_HEIGHT";//适应宽度，方便伪合并表格
                    setTextMain(node.children[ii],0,textOrClone.length,22);
                }
            }
            if (node.children[ii].layoutPositioning == "ABSOLUTE"){
                node.children[ii].children[0].constraints = {
                    horizontal: "STARTANDEND",
                    vertical: "STARTANDEND"
                }
            }
        }
        node.crossAxisAlignItems = "FLEX_START"; 
        setTimeout(() => {
            node.crossAxisAlignItems = "CENTER"; 
        },50)
    }else{
        node.appendChild(textOrClone.clone())
    }

    node.width = 176;
    node.height = 52;
    
            
}

function creStyleTableSet(node,name,view,needText,textOrClone,){
    node.name = name;
    node.layoutPositioning = "AUTO";
    node.flexGrow = 0;
    node.flexMode = "HORIZONTAL";
    node.flexWrap = "NO_WRAP";
    node.itemSpacing = 0;
    node.mainAxisAlignItems = "CENTER";
    node.mainAxisSizingMode = "FIXED";
    node.crossAxisAlignItems = "CENTER"; 
    node.crossAxisSizingMode = "FIXED";
    node.crossAxisSpacing = 0;
    node.paddingTop = 10;
    node.paddingBottom = 10;
    node.width = 176;
    node.height = 52;
    node.fills = [];
    var colorLayer = mg.createRectangle();
    cloneMain(colorLayer,node)
    colorLayer.fills = [{type:"SOLID",color:{r:0.12,g:0.12,b:0.12,a:1,}}];   
    var strokeTop = mg.createRectangle();
    cloneMain(strokeTop,node);
    setStroke(strokeTop,"CENTER",[1,0,0,0]);
    var strokeRight = mg.createRectangle();
    cloneMain(strokeRight,node);
    setStroke(strokeRight,"CENTER",[0,1,0,0]);
    var strokeBottom = mg.createRectangle();
    cloneMain(strokeBottom,node);
    setStroke(strokeBottom,"CENTER",[0,0,1,0]);
    var strokeLeft = mg.createRectangle();
    cloneMain(strokeLeft,node);
    setStroke(strokeLeft,"CENTER",[0,0,0,1]);

    var diffC = mg.group([colorLayer]);
    var strokeT = mg.group([strokeTop]);
    var strokeR = mg.group([strokeRight]);
    var strokeB = mg.group([strokeBottom]);
    var strokeL = mg.group([strokeLeft]);


    addAbsolute(node,diffC,"区分色",view)
    addAbsolute(node,strokeT,"上描边",true)
    addAbsolute(node,strokeR,"右描边",true)
    addAbsolute(node,strokeB,"下描边",true)
    addAbsolute(node,strokeL,"左描边",true)

    if (needText == true){
        node.appendChild(mg.createText())

        for ( var ii = 0; ii < node.children.length; ii++){
            if ( node.children[ii].type == "TEXT"){
                node.children[ii].flexGrow = 1;
                node.children[ii].textAutoResize = "HEIGHT";
                if (Object.keys(node.children[ii].componentPropertyReferences).length === 0){
                    var addTextSet = node.addComponentProperty("字段1", "TEXT", node.children[ii].characters);
                    node.children[ii].componentPropertyReferences = {characters:addTextSet};
                    node.children[ii].characters = textOrClone;
                    node.children[ii].textAlignHorizontal = "CENTER";
                    setTextMain(node.children[ii],0,textOrClone.length,22);
                }
            }
            if (node.children[ii].layoutPositioning == "ABSOLUTE"){
                node.children[ii].children[0].constraints = {
                    horizontal: "STARTANDEND",
                    vertical: "STARTANDEND"
                }
            }
        }
        node.crossAxisAlignItems = "FLEX_START"; 
        setTimeout(() => {
            node.crossAxisAlignItems = "CENTER"; 
        },50)
    }else{
        node.appendChild(textOrClone.clone())
    }

    
            
}

function addStyleTable(name,styles,type,eg){

    if ( type == 're'){
        mg.ui.postMessage(['re','hasStyleTable'])
    }

    if ( type == 'new' || type == 'old'){
        var page = mg.createPage()
        page.name = name
        page.bgColor = mg.hexToRGBA('272727')

        var name1 = styles.map(item => item.name);
        var allGroup = []
        var allStyle = []
        name1.forEach( item => {
            allGroup.push(item.split('/')[0].split('#样式组 ')[1])
            allStyle .push(item.split('/')[item.split('/').length - 1])
        })
        var allStyleName = [...new Set(allStyle)]
        var nameGroup = []
        var styleGroup =  [...new Set(allGroup)]
        styleGroup.forEach( item => {
            if ( item !== undefined){
                nameGroup.push(item)
            }
        })

        var styleToArr = Object.values(styles.reduce((acc,item) => {
            var key = item.name.split('/')[0];
            (acc[key] || (acc[key] = [])).push(item);
            return acc;
        },{}));

        var x = 0;
        var y = 0;
        var H = 2;
        if (type == 'new'){
            H = styles.length + 1;
        } else {
            H = allStyleName.length + 1;
        }
        

        var node1 = mg.createComponent();
        node1.x = x;
        node1.y = y;
        creStyleTableSet(node1, "style-key",true,true,"表头文案")//需添加表格属性的节点，命名，是否显示区分色，是否需要填充文案，需要填充的文案/克隆的节点
        var node2 = mg.createComponent();
        node2.x = node1.x;
        node2.y = node1.y + 60;
        creStyleTableSet(node2, "style-string",false,true,"数据文案")
        var node3 = mg.createComponent();
        node3.x = node2.x;
        node3.y = node2.y + 60;
        creStyleTableSet(node3, "style-var",false,true,"--")
        var box = mg.createRectangle()
        box.width = 32;
        box.height = 32;
        node3.insertChild(5,box)

        var list = mg.createFrame()
        list.name = "#列";
        list.layoutPositioning = "AUTO";
        list.flexGrow = 0;
        list.flexMode = "VERTICAL";
        list.flexWrap = "NO_WRAP";
        list.itemSpacing = 0;
        list.crossAxisSpacing = 0;
        list.paddingTop = 0;
        list.paddingBottom = 0;
        list.paddingLeft = 0;
        list.paddingRight= 0;
        list.fills = [];

        list.appendChild(node1.clone());
        for ( var e = 1; e < H; e++){
            list.appendChild(node2.clone());
        }
        
        list.flexMode = "VERTICAL";
        list.mainAxisAlignItems = "FLEX_START";
        list.mainAxisSizingMode = "AUTO";
        list.crossAxisAlignContent = "AUTO";
        list.crossAxisAlignItems = "CENTER"; 
        list.crossAxisSizingMode = "AUTO";

        var list2 = mg.createFrame()
        list2.name = "#列";
        list2.layoutPositioning = "AUTO";
        list2.flexGrow = 0;
        list2.flexMode = "VERTICAL";
        list2.flexWrap = "NO_WRAP";
        list2.itemSpacing = 0;
        list2.crossAxisSpacing = 0;
        list2.paddingTop = 0;
        list2.paddingBottom = 0;
        list2.paddingLeft = 0;
        list2.paddingRight= 0;
        list2.fills = [];

        list2.appendChild(node1.clone());
        for ( var e = 1; e < H; e++){
            list2.appendChild(node3.clone());
        }

        list2.flexMode = "VERTICAL";
        list2.mainAxisAlignItems = "FLEX_START";
        list2.mainAxisSizingMode = "AUTO";
        list2.crossAxisAlignContent = "AUTO";
        list2.crossAxisAlignItems = "CENTER"; 
        list2.crossAxisSizingMode = "AUTO";

        var table = mg.createFrame()
        table.x = x + 200;
        table.y = y;
        table.name = "本地样式集 #table";
        table.layoutPositioning = "AUTO";
        table.flexGrow = 0;
        table.flexMode = "HORIZONTAL";
        table.flexWrap = "NO_WRAP";
        table.itemSpacing = 0;
        table.mainAxisAlignItems = "FLEX_START";
        table.mainAxisSizingMode = "AUTO";
        table.crossAxisAlignItems = "FLEX_START"; 
        table.crossAxisSizingMode = "AUTO";
        table.crossAxisSpacing = 0;
        table.paddingTop = 0;
        table.paddingBottom = 0;
        table.paddingLeft = 0;
        table.paddingRight= 0;
        table.fills = [];

        table.appendChild(list);
        table.appendChild(list2);

        if ( type == 'old'){
            
            
            for ( var i = 1; i < nameGroup.length; i++){
                table.appendChild(list2.clone());
            }
            for ( var e = 0; e < table.children[0].children.length; e++){
                if ( e == 0){
                    table.children[0].children[e].setProperties({[table.children[0].children[e].componentProperties[5].id]:'样式名'})
                } else {
                    var NAME = allStyleName[e - 1]
                    table.children[0].children[e].setProperties({[table.children[0].children[e].componentProperties[5].id]:NAME.split('/')[NAME.split('/').length - 1]})
                }
            }
            for ( var i = 1; i < table.children.length; i++){
                
                table.children[i].children[0].setProperties({[table.children[i].children[0].componentProperties[5].id]:nameGroup[i - 1]})
                for ( var e = 1; e < table.children[i].children.length; e++){
                    //console.log(allStyleName[e - 1],nameGroup[i - 1])
                    if ( styles.filter(item => item.name.split(allStyleName[e - 1]).length > 1 && item.name.split(nameGroup[i - 1]).length > 1).length > 0){
                        //table.children[i].children[e].children[5].fillStyleId = styles.filter(item => item.name.split(allStyleName[e - 1]).length > 1 && item.name.split(nameGroup[i - 1]).length > 1)[0].id
                    } else {
                        mg.createFillStyle({id:table.children[i].children[e].children[5].id,name:'#样式组 ' + nameGroup[i - 1] + '/' + allStyleName[e - 1]})
                    }
                    
                }
            }
        }
    
        if ( type == 'new'){        
            table.appendChild(list2.clone());
            for ( var e = 0; e < table.children[0].children.length; e++){
                if ( e == 0){
                    table.children[0].children[e].setProperties({[table.children[0].children[e].componentProperties[5].id]:'样式名'})
                } else {
                    var NAME = styles[e - 1].name
                    table.children[0].children[e].setProperties({[table.children[0].children[e].componentProperties[5].id]:NAME.split('/')[NAME.split('/').length - 1]})
                }
            }
            for ( var e = 0; e < table.children[1].children.length; e++){
                if ( e == 0){
                    table.children[1].children[e].setProperties({[table.children[0].children[e].componentProperties[5].id]:'示例1'})
                } else {
                    table.children[1].children[e].children[5].fillStyleId = styles[e - 1].id
                }
            }
            for ( var e = 0; e < table.children[2].children.length; e++){
                if ( e == 0){
                    table.children[2].children[e].setProperties({[table.children[0].children[e].componentProperties[5].id]:'示例2'})
                } else {
                    mg.createFillStyle({id:table.children[2].children[e].children[5].id,name:'#样式组 示例2/' + styles[e - 1].name})
                }
            }
            styles.forEach(item => {
                item.name = '#样式组 示例1/' + item.name 
            })          
        }
        
        for ( var i = 0; i < table.children.length; i++){
            table.children[i].children.forEach(node => {
                node.alignSelf = "STRETCH";
            })
        }
        for ( var i = 1; i < table.children.length; i++){
            table.children.forEach(node => {
                node.flexGrow = 1;
            })
        }

        setStroke(table,'CENTER',[1,1,1,1])
        setRadius(table,[16,16,16,16])
        table.fills = [{type:"SOLID",color:{r:0.175,g:0.175,b:0.175,a:1,}}]

        
        var group = mg.group([node1,node2,node3,table])
        group.name = '变量表'
        group.isVisible = false

        mg.ui.postMessage([type,'hasStyleTable'])

    }


    
    
}

async function setTextMain(node,star,end,fontSize){
    await mg.listAvailableFontsAsync()

    await mg.loadFontAsync({
        "family": "Source Han Sans CN",
        "style": "Regular"
    })
    node.setRangeFontName(star,end,{"family": "Source Han Sans CN","style": "Regular"});
    node.setRangeFontSize(star,end,fontSize);
}

function addTable(b,H,L){
    for (var i = 0; i < b.length; i++){
            
        if (b[i].name.split('#table').length !== 1 || b[i].name.split('数据流').length !== 1){
            if (b[i].children.length >= 1 ){
                if ( L > 0){
                    for( var e = 0; e < L; e++){
                        //console.log()
                        if (b[i].name.split('数据流').length !== 1){
                            var lists = b[i].children[0] 
                        } else {
                            var lists = b[i].children[Math.floor(b[i].children.length/2)]
                        }
                        
                        b[i].appendChild(lists.clone());
                    }
                } else if ( L < 0 ){
                    if (b[i].children.length > 1 ){
                        for( var e = 0; e < L * -1; e++){
                            //console.log()
                            var length = b[i].children.length - 1 ;
                            b[i].children[length].remove()
                        }
                    }
                }
            }
            for(var ii = 0; ii < b[i].children.length; ii++){ 
                if (b[i].children[ii].name.split('#列').length !== 1){
                    if (b[i].children[ii].children.length >= 2 ){
                        var data = b[i].children[ii].children[b[i].children[ii].children.length - 1]
                        if ( H > 0){
                            for( var e = 0; e < H; e++){
                                //console.log()
                                var list = b[i].children[ii];
                                var length = list.children.length - 1 ;
                                list.appendChild(data.clone());
                            }  
                        } else if ( H < 0 ){
                            if( b[i].children[ii].children.length > 2 ){
                                for( var e = 0; e < H * -1; e++){
                                    //console.log()
                                    var list = b[i].children[ii];
                                    var length = list.children.length - 1 ;
                                    list.children[length].remove()
                                }
                            }
                            
                        }   
                    }                        
                }
                
            }
        }
        
    }
}

function easePickTable(info,a,b){
    if(b.length == 2 && b[0].parent.name.split('#列').length > 1 && b[1].parent.name.split('#列').length > 1){
        var H1,L1,H2,L2,HH,LL;//记录对象所在行列和总行列
        H1 = b[0].parent.children.findIndex(item => item == b[0]);
        L1 = b[0].parent.parent.children.findIndex(item => item == b[0].parent);
        H2 = b[1].parent.children.findIndex(item => item == b[1]);
        L2 = b[1].parent.parent.children.findIndex(item => item == b[1].parent);
        HH = b[0].parent.children.length;
        LL = b[0].parent.parent.children.filter( item => item.name.split('#列').length > 1).length;
        //console.log(H1,L1,H2,L2,HH,LL)

        var picks = []
        
        if ( info == 'area'){
            var starH = Math.min(H1,H2), endH = Math.max(H1,H2),starL = Math.min(L1,L2), endL = Math.max(L1,L2)
            for ( var i = starL; i <= endL ; i++ ){
                for ( var ii = starH; ii <= endH; ii++){
                    picks.push(b[0].parent.parent.children[i].children[ii])
                    if ( i == endL && ii == endH){
                        a.selection = picks
                    }
                } 
            }
            pickTableArea = true; 
        }
        if ( info == 'line'){
            var starH = Math.min(H1,H2), endH = Math.max(H1,H2);
            if ( starH == H2 ){
                var starL = L2,endL = L1
            } else {
                var starL = L1,endL = L2
            }

            for ( var i = starL; i < LL; i++){
                picks.push(b[0].parent.parent.children[i].children[starH])
            }
            for ( var i = 0; i < LL; i++){
                for ( var ii = starH + 1; ii < endH; ii++){
                    picks.push(b[0].parent.parent.children[i].children[ii])
                }
            }
            for ( var i = 0; i <= endL; i++){
                picks.push(b[0].parent.parent.children[i].children[endH])
            }

            a.selection = picks
        }
    }
}

function setTableStroke(node,trbl){
    for(var i = 0; i < 4; i++){
        if ( trbl[i] == 0){
            node.setProperties({[node.componentProperties[i + 1].id]:false});
        } else {
            node.setProperties({[node.componentProperties[i + 1].id]:true});
        }

    }
}

function tableToArea(nodes,type,hl){
    if ( type == 'l'){ 
        setTableStroke(nodes[0],[1,1,0,1])
        setTableStroke(nodes[nodes.length - 1],[0,1,1,1])
        for ( var i = 1; i < nodes.length - 1; i++){
            setTableStroke(nodes[i],[0,1,0,1])
        }
    } else if ( type == 'h'){ 
        setTableStroke(nodes[0],[1,0,1,1])
        setTableStroke(nodes[nodes.length - 1],[1,1,1,0])
        for ( var i = 1; i < nodes.length - 1; i++){
            setTableStroke(nodes[i],[1,0,1,0])
        }
    } else if ( type == 'hl'){
        setTableStroke(nodes[0],[1,0,0,1])
        setTableStroke(nodes[hl[0] - 1],[0,0,1,1])
        setTableStroke(nodes[nodes.length - 1],[0,1,1,0])
        setTableStroke(nodes[nodes.length - hl[0]],[1,1,0,0])
        console.log(nodes[0].componentProperties[5],nodes[hl[0] - 1].componentProperties[5],nodes[nodes.length - hl[0]].componentProperties[5],nodes[nodes.length - 1].componentProperties[5])
        for ( var i = 1; i < hl[0] - 1; i++){
            setTableStroke(nodes[i],[0,0,0,1])
        }
        for ( var i = nodes.length - hl[0] + 1; i < nodes.length - 1; i++){
            setTableStroke(nodes[i],[0,1,0,0])
        }
        for ( var i = hl[0]; i < nodes.length - hl[0]; i++){
            console.log(666)
            if ( i%(hl[0] + 1 ) == 0){
                setTableStroke(nodes[i],[1,0,0,0])
            } else if ( i%(hl[0]*2 ) == 0){
                setTableStroke(nodes[i],[0,0,1,0])
            } else {
                setTableStroke(nodes[i],[0,0,0,0])
            }
        }
    }
}

 async function createrMap(){

    var a = mg.document.currentPage;
    var b = a.children;
    var inView = getInView(b)

    /*
    var pageInView = mg.createFrame()
    a.insertChild(0,pageInView)
    pageInView.x = inView.x;
    pageInView.y = inView.y;
    pageInView.name = "创建快照";
    pageInView.fills = [];
    for ( i = 0; i < b.length; i++){
        if ( b[i].isVisible == true && b[i].type !== "SECTION"){
            pageInView.appendChild(b[i].clone())
        } else {
            if ( b[i].type == "SECTION" && b[i].isVisible == true){
                var c = b[i].children;
                var sect = mg.createFrame()
                    sect.fills = b[i].fills;
                    cloneMain(sect,b[i])
                    pageInView.appendChild(sect);
                for ( ii = 0; ii < c.length; ii++){
                    if (c[ii].isVisible == true){
                        pageInView.appendChild(c[ii].clone());
                    }
                }
            }
        }
    }
    pageInView.clipsContent = false;
    */
    //console.log(inView)
    var pageInView = mg.createSlice()
    pageInView.x = inView.x;
    pageInView.y = inView.y;
    pageInView.width = inView.w;
    pageInView.height = inView.h;
    pageInView.name = "创建快照";


    if(inView.w > inView.h){
        var pageView = new Uint8Array(pageInView.export({ format: 'PNG',constraint:{type:'WIDTH',value:"2048"}}))
    } else {
        var pageView = new Uint8Array(pageInView.export({ format: 'PNG',constraint:{type:'HEIGHT',value:"2048"}}))
    }  
    //console.log(pageView)
    await mg.ui.postMessage([{w:inView.w,h:inView.h,x:inView.x,y:inView.y,view:pageView,bg:mg.RGBAToHex(a.bgColor)},"createrMap"])
    pageInView.isVisible = false;
    //console.log(mg.document.currentPage.selection[0])//.selection[0]

}

function getInView(b){
    var X = b.map(obj => obj.absoluteRenderBounds.x);
    var Y = b.map(obj => obj.absoluteRenderBounds.y);
    var W = b.map(obj => obj.absoluteRenderBounds.width);
    var H = b.map(obj => obj.absoluteRenderBounds.height);
    var V = b.map(obj => obj.isVisible)
    //console.log(X,Y,W,H,V)
    var minX = Infinity;
    for ( var i = 0; i < X.length; i++){
        if ( minX > X[i] && V[i] == true){
            minX = X[i];
        }
    }
    var minY = Infinity;
    for ( var i = 0; i < Y.length; i++){
        if ( minY > Y[i] && V[i] == true){
            minY = Y[i];
        }
    }
    var maxX = -Infinity;
    for ( var i = 0; i < X.length; i++){
        if ( maxX < X[i] + W[i] && V[i] == true){
            maxX = X[i] + W[i];
        }
    }
    var maxY = -Infinity;
    for ( var i = 0; i < Y.length; i++){
        if ( maxY < Y[i] + H[i] && V[i] == true){
            maxY = Y[i] + H[i];
        }
    }
    var w = maxX - minX;
    var h = maxY - minY;
    var x = minX;
    var y = minY;
    //console.log(w,h,x,y,)
    return {w:w,h:h,x:x,y:y}

}

function cutPath(d) {
    var paths = d.split("Z").filter(segment => segment.trim())
    for (var i = 0; i < paths.length; i++){
        paths[i] += "Z"
        if ( i == paths.length - 1){
            var pathData = paths;
            return pathData;
        }
    }    
}

function fillsToRGBA(obj){
    if ( obj.a !== 1){
        var r = Math.ceil(obj.r.toFixed(2) * 255)
        var g = Math.ceil(obj.g.toFixed(2) * 255)
        var b = Math.ceil(obj.b.toFixed(2) * 255)
        var a = obj.a.toFixed(1)
        return "rgba(" + r + "," + g + "," + b + "," + a + ")"
    } else {
        return mg.RGBAToHex(obj).substring(0,6)
    }

}

function creCutArea(info){//{w:,h:,x:,y:,s:}
    var W = info.w,H = info.h;//图片宽高
    var Ws = info.w,Hs = info.h;//非尾部部分的裁剪宽高
    var lastWs = info.w,lastHs = info.h;//尾部的裁剪宽高
    var X = info.x,Y = info.y;//裁切区坐标
    var cutW = 1,cutH = 1;//纵横裁剪数量
    var cuts = [];//从左到右，从上到小的裁切区域集
    var tips;
    //切割方案
    if (W  * info.s <= cutMax && H  * info.s <= cutMax){//4K以内，正常生成
        cuts = [{w:W,h:H,x:info.x,y:info.y,s:1}]
        return cuts;
    } else {//多行列宫格
        cutW = Math.ceil((W  * info.s)/cutMax)
        cutH = Math.ceil((H  * info.s)/cutMax)
        if ( W%cutW == 0){ //宽度刚好等分
            Ws = W/cutW
            lastWs = Ws
            
        } else { //有小数点
            Ws = Math.ceil(W/cutW) //向上取整，最后一截短一些
            lastWs = W - (Ws*(cutW - 1))           
        }
        if ( H%cutH == 0){ //长度刚好等分
            Hs = H/cutH
            lastHs = Hs
            tips = "高被整除"
        } else { //有小数点
            Hs = Math.ceil(H/cutH) //向上取整，最后一截短一些
            lastHs = H - (Hs*(cutH - 1))
            tips = "高不能整除，剩余：" + lastHs
        }

        // 拆分图像数据
        for (var i = 0; i < (cutW * cutH); i++) {

            if ((i + 1)%cutW == 0 && i !== (cutW * cutH) - 1 && i !== 0){
                cuts.push({w:lastWs,h:Hs,x:X,y:Y,});
                Y = Y + Hs;
                X = info.x;
            } else if (i == (cutW * cutH) - 1){
                cuts.push({w:lastWs,h:lastHs,x:X,y:Y,t:tips});
            } else {
                if ( i > (cutW * (cutH - 1)) - 1){
                    cuts.push({w:Ws,h:lastHs,x:X,y:Y});
                } else {
                    cuts.push({w:Ws,h:Hs,x:X,y:Y});
                }
                
                if ( cutW == 1 ){
                    X = info.x;
                    Y = Y + Hs;
                } else {
                    X = X + Ws;
                }
                
            }
            
        }
        return cuts;
    }
    
}

function cutNode(a,node,scale){
    
    var c = creCutArea({w:node.absoluteRenderBounds.width,h:node.absoluteRenderBounds.height,x:node.absoluteRenderBounds.x,y:node.absoluteRenderBounds.y,s:scale,});
    var index = node.parent.children.findIndex(item => item === node);
    //console.log(c[c.length - 1].t)
    
    for ( var ii = 0; ii < c.length; ii++){
        
        /*
        if ( node.type == 'SECTION'){
            var frame = mg.createFrame();
            cloneMain(frame,node);
            //var key = ['fills','cornerRadius','strokes',]//'strokeAlign','strokeStyle','strokeWeight',
            //cloneKey(key,frame,node);
            frame.fills = []
            frame.name = node.name + '转换';
            var group = mg.group([frame]);
            group.appendChild(cutArea);
        } else {
            var group = mg.group([node]);
            group.appendChild(cutArea);
        }
        */
        
        var cutArea = mg.createSlice()
        cutArea.width = c[ii].w;
        cutArea.height = c[ii].h;
        cutArea.x = c[ii].x;
        cutArea.y = c[ii].y;
        var group = mg.group([node]);
            group.appendChild(cutArea);
        var cutImg = mg.createRectangle()
        var img = new Uint8Array(cutArea.export({ format: 'PNG',constraint:{type:'SCALE',value:scale}}))
        if ( c.length > 1 ){
            cutImg.name = node.name + "-" + (ii + 1);
        } else {
            cutImg.name = node.name + " @" + scale + "x";
        }
        cloneMain(cutImg,cutArea);
        fillTheSelection(cutImg,img);
        group.appendChild(cutImg);
        cutArea.remove();
        if (group.parent !== a){
            a.selection = [group.parent]
            a.selection[0].insertChild((index + 1),a.selection[0].children[index].children[0])
            a.selection[0].insertChild((index + 2),a.selection[0].children[index].children[0])  
            if ( c.length > 1 && ii == (c.length - 1)){
                var imgGroup = mg.group([a.selection[0].children[index + 1]]);
                imgGroup.name = node.name + " @" + scale + "x"
                for (var e = 1; e < c.length; e++){
                    imgGroup.appendChild(a.selection[0].children[index + 2])
                }
            }
        } else {
            console.log("无容器包裹")
            a.insertChild((index + 1),a.children[index].children[0])
            a.insertChild((index + 2),a.children[index].children[0])
            if ( c.length > 1 && ii == (c.length - 1)){
                var imgGroup = mg.group([a.children[index + 1]]);
                imgGroup.name = node.name + " @" + scale + "x"
                for (var e = 1; e < c.length; e++){
                    imgGroup.appendChild(a.children[index + 2])
                }
            }
            
        }
    }
        
}

function pickBefore(nodes){
    var a = mg.document.currentPage;
    var newNode = [];
    nodes.forEach(item => {
        //console.log(item.name)
        var parentnode = item.parent;
        var index = parentnode.children.findIndex(node => node === item);
        newNode.push(parentnode.children[index + 1]);
    })
    a.selection = newNode;
}

function intXY(node){
    node.x = Math.ceil(node.x)
    node.y = Math.ceil(node.y)
}

function intWH(node){
    if (node.type !== 'GROUP'){
        node.width = Math.ceil(node.width)
        node.height = Math.ceil(node.height)
    }
    
}


function evenWH(node){
    if (node.type !== 'GROUP'){
        var w = Math.ceil(node.width)
        var h = Math.ceil(node.height)
        if (w%2 !== 0){
            w = w - 1
        }
        if (h%2 !== 0){
            h = h - 1
        }
        node.width = w
        node.height = h
    }
}

function creStyleWmb(info,node) {
    
            if( info.num == 4 || info.num !== 8 || info.num !== 12){
                
                node.effects =[
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size,
                            "y": 0
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": 0,
                            "y": info.size
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1,
                            "y": 0
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": 0,
                            "y": info.size * -1
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                ]
            }
            if( info.num == 8){
                node.effects =[
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size,
                            "y": 0
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": 0,
                            "y": info.size
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1,
                            "y": 0
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": 0,
                            "y": info.size * -1
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1,
                            "y": info.size * -1
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size,
                            "y": info.size
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1,
                            "y": info.size
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size,
                            "y": info.size * -1
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                ]
            }
            if( info.num == 12){
                node.effects =[
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size,
                            "y": 0
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": 0,
                            "y": info.size
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1,
                            "y": 0
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": 0,
                            "y": info.size * -1
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1 * 0.5,
                            "y": info.size * -1 * 0.75
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * 0.5,
                            "y": info.size * 0.75
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1 * 0.5,
                            "y": info.size * 0.75
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * 0.5,
                            "y": info.size * -1 * 0.75
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1 * 0.75,
                            "y": info.size * -1 * 0.5
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * 0.75,
                            "y": info.size * 0.5
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1 * 0.75,
                            "y": info.size * 0.5
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * 0.75,
                            "y": info.size * -1 * 0.5
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                ]
            }
            
}

function addColorStyle(name,hex){
    var node = mg.createRectangle()
    node.fills = [
        {
            type: "SOLID",
            color: mg.hexToRGBA(hex),
            isVisible: true,
            alpha: 1,
            blendMode: "PASS_THROUGH",
        }
    ]
    mg.createFillStyle({id:node.id,name:name})
    node.remove()
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