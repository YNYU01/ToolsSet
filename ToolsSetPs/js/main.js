var cs = new CSInterface();//调用官方接口实例:cs.evalScript('要执行的jsx代码:app.activeDocument'，处理返回:function(result){})


function addframe(){
    //如果是新建的文件，打开会存在“背景”或“画板 1”两种情况，如果是背景，需要先建个画板，不然第一个画板会错位
    cs.evalScript(`var node = app.activeDocument.layers[0]
        if( node.typename == "ArtLayer"){
        //基于官方动作记录脚本生成的代码
        // 将工具替换为画板工具
        var idslct = charIDToTypeID( "slct" );
            var desc235 = new ActionDescriptor();
            var idnull = charIDToTypeID( "null" );
                var ref46 = new ActionReference();
                var idartboardTool = stringIDToTypeID( "artboardTool" );
                ref46.putClass( idartboardTool );
            desc235.putReference( idnull, ref46 );
            var iddontRecord = stringIDToTypeID( "dontRecord" );
            desc235.putBoolean( iddontRecord, true );
            var idforceNotify = stringIDToTypeID( "forceNotify" );
            desc235.putBoolean( idforceNotify, true );
        executeAction( idslct, desc235, DialogModes.NO );
        
        // =======================================================
        var idMk = charIDToTypeID( "Mk  " );
            var desc236 = new ActionDescriptor();
            var idnull = charIDToTypeID( "null" );
                var ref47 = new ActionReference();
                var idartboardSection = stringIDToTypeID( "artboardSection" );
                ref47.putClass( idartboardSection );
            desc236.putReference( idnull, ref47 );
            var idlayerSectionStart = stringIDToTypeID( "layerSectionStart" );
            desc236.putInteger( idlayerSectionStart, 22 );
            var idlayerSectionEnd = stringIDToTypeID( "layerSectionEnd" );
            desc236.putInteger( idlayerSectionEnd, 23 );
            var idNm = charIDToTypeID( "Nm  " );
            desc236.putString( idNm, """背景""" );
            var idartboardRect = stringIDToTypeID( "artboardRect" );
                var desc237 = new ActionDescriptor();
                var idTop = charIDToTypeID( "Top " );
                desc237.putDouble( idTop, 0 );
                var idLeft = charIDToTypeID( "Left" );
                desc237.putDouble( idLeft, 0);
                var idBtom = charIDToTypeID( "Btom" );
                desc237.putDouble( idBtom, 1080 );
                var idRght = charIDToTypeID( "Rght" );
                desc237.putDouble( idRght, 1920 );
            var idclassFloatRect = stringIDToTypeID( "classFloatRect" );
            desc236.putObject( idartboardRect, idclassFloatRect, desc237 );
        executeAction( idMk, desc236, DialogModes.NO );
        // =======================================================
        var idsetd = charIDToTypeID( "setd" );
            var desc12 = new ActionDescriptor();
            var idnull = charIDToTypeID( "null" );
                var ref2 = new ActionReference();
                var idLyr = charIDToTypeID( "Lyr " );
                var idOrdn = charIDToTypeID( "Ordn" );
                var idTrgt = charIDToTypeID( "Trgt" );
                ref2.putEnumerated( idLyr, idOrdn, idTrgt );
            desc12.putReference( idnull, ref2 );
            var idT = charIDToTypeID( "T   " );
                var desc13 = new ActionDescriptor();
                var idNm = charIDToTypeID( "Nm  " );
                desc13.putString( idNm, """背景""" );
            var idLyr = charIDToTypeID( "Lyr " );
            desc12.putObject( idT, idLyr, desc13 );
        executeAction( idsetd, desc12, DialogModes.NO );
        }
    `)

    //获取最终的画板参数
    for (var i=0 ; i < allFrame.length; i++) {
        if ( document.getElementById('tag-' + i).style.display !== 'none' ){
          finalFrame.push (allFrame[i])
        }
      }

    //*/开始批量建画板
    //==========================================
    //初始化
    var info = finalFrame
    var gap = 30;
    var maxW ,maxH ;
    var x = 0;
    var y = 0;
    var allH = [];
    var allW = [];
    var ws = [0];
    var hs = [0];
    var frames = []
    //==========================================
    //先找出最宽最高的图，作为换行标准，然后挑出KV单独排布
    for(var i = 0; i < info.length; i++){
        ws.push(info[i].w);
        hs.push(info[i].h);
    };
    var maxW = Math.max(...ws);
    var maxH = Math.max(...hs);
    for(var i = 0; i < info.length; i++){
        if (info[i].name == "KV" | info[i].name == "kv") {
            frames.unshift([info[i].name + " " + info[i].w + "×" + info[i].h,info[i].w,info[i].h,x,y])
            y += info[i].h + gap
        }
    };

    //==========================================
    //按宽度将画板参数重新排序
    info.sort((a, b) => b.w - a.w);
    //移除KV，其余按纵横比排布
    for(var i = 0; i < info.length; i++){
        if(info[i].name !== "KV" && info[i].name !== "kv"){
            if ( info[i].w / info[i].h > 1){
                allH.push(info[i].h);
                frames.push([info[i].name + " " + info[i].w + "×" + info[i].h,info[i].w,info[i].h,x,y])
                //按换行标准换行
                x = x + Number(info[i].w) + gap;
                if (info[i + 1] !== undefined){
                    if (x + Number(info[i + 1].w) > maxW){
                        var maxHs = Number(Math.max(...allH));
                        x = 0;
                        y +=  maxHs + gap;
                        var allH = []
                    };
                }
            };
        };
        
    };
    //==========================================
    //设置竖版画板的起点
    x = maxW + gap ;
    y = 0;
    //按高度将画板参数重新排序
    info.sort((a, b) => b.h - a.h);
    for(var i = 0; i < info.length; i++){  
        if(info[i].name !== "KV"){
            if ( info[i].w / info[i].h < 1){
                allW.push(info[i].w);
                frames.push([info[i].name + " " + info[i].w + "×" + info[i].h,info[i].w,info[i].h,x,y])
                //按换行标准换行
                y = y + Number(info[i].h) + gap;
                if (info[i + 1] !== undefined){
                    if (y + Number(info[i + 1].h)> maxH){
                        var maxWs = Number(Math.max(...allW));
                        x += maxWs + gap;
                        y =  0;
                        var allW = []
                    };
                }
            };
        };
        
    };
    //==========================================
    //设置方形画板的起点
    x = maxW + gap;
    y = maxH + gap;

    for(var i = 0; i < info.length; i++){
        if(info[i].name !== "KV"){
            if ( info[i].w / info[i].h == 1){
                allW.push(info[i].w);
                frames.push([info[i].name + " " + info[i].w + "×" + info[i].h,info[i].w,info[i].h,x,y])
                //按换行标准换行
                y = y + Number(info[i].h) + gap;
                if (y > maxH){
                    var maxWs = Number(Math.max(...allW));
                    x += maxWs + gap;
                    y = maxH + gap;
                    var allW = []
                };
            };
        };
        
    };
    //==========================================
    //依次创建画板并修改画板名
    for (var i = 0; i < frames.length; i++){
        addframeAction(frames[i][0],frames[i][1],frames[i][2],frames[i][3],frames[i][4]) 
    }
    //==========================================
    //清空画板参数
    finalFrame = [];
    //删除“背景”和“画板 1 ”
    cs.evalScript(`
       if(app.activeDocument.layers[app.activeDocument.layers.length - 1].name == "背景" | app.activeDocument.layers[app.activeDocument.layers.length - 1].name == "画板 1") {
       app.activeDocument.layers[app.activeDocument.layers.length - 1].remove()
       }
    `)
    //alert(frames)
    //*/
}


function addframeAction(N,W,H,X,Y){
   cs.evalScript(`
        //基于官方动作记录脚本生成的代码
        // 将工具替换为画板工具
        var idslct = charIDToTypeID( "slct" );
            var desc235 = new ActionDescriptor();
            var idnull = charIDToTypeID( "null" );
                var ref46 = new ActionReference();
                var idartboardTool = stringIDToTypeID( "artboardTool" );
                ref46.putClass( idartboardTool );
            desc235.putReference( idnull, ref46 );
            var iddontRecord = stringIDToTypeID( "dontRecord" );
            desc235.putBoolean( iddontRecord, true );
            var idforceNotify = stringIDToTypeID( "forceNotify" );
            desc235.putBoolean( idforceNotify, true );
        executeAction( idslct, desc235, DialogModes.NO );
        
        // =======================================================
        var idMk = charIDToTypeID( "Mk  " );
            var desc236 = new ActionDescriptor();
            var idnull = charIDToTypeID( "null" );
                var ref47 = new ActionReference();
                var idartboardSection = stringIDToTypeID( "artboardSection" );
                ref47.putClass( idartboardSection );
            desc236.putReference( idnull, ref47 );
            var idlayerSectionStart = stringIDToTypeID( "layerSectionStart" );
            desc236.putInteger( idlayerSectionStart, 22 );
            var idlayerSectionEnd = stringIDToTypeID( "layerSectionEnd" );
            desc236.putInteger( idlayerSectionEnd, 23 );
            var idNm = charIDToTypeID( "Nm  " );
            desc236.putString( idNm, """`+ N +`""" );
            var idartboardRect = stringIDToTypeID( "artboardRect" );
                var desc237 = new ActionDescriptor();
                var idTop = charIDToTypeID( "Top " );
                desc237.putDouble( idTop, `+ Y +` );
                var idLeft = charIDToTypeID( "Left" );
                desc237.putDouble( idLeft, `+ X +`);
                var idBtom = charIDToTypeID( "Btom" );
                desc237.putDouble( idBtom, `+ (Y + H) +` );
                var idRght = charIDToTypeID( "Rght" );
                desc237.putDouble( idRght, `+ (X + W) +` );
            var idclassFloatRect = stringIDToTypeID( "classFloatRect" );
            desc236.putObject( idartboardRect, idclassFloatRect, desc237 );
        executeAction( idMk, desc236, DialogModes.NO );
        // =======================================================
        var idsetd = charIDToTypeID( "setd" );
            var desc12 = new ActionDescriptor();
            var idnull = charIDToTypeID( "null" );
                var ref2 = new ActionReference();
                var idLyr = charIDToTypeID( "Lyr " );
                var idOrdn = charIDToTypeID( "Ordn" );
                var idTrgt = charIDToTypeID( "Trgt" );
                ref2.putEnumerated( idLyr, idOrdn, idTrgt );
            desc12.putReference( idnull, ref2 );
            var idT = charIDToTypeID( "T   " );
                var desc13 = new ActionDescriptor();
                var idNm = charIDToTypeID( "Nm  " );
                desc13.putString( idNm, """`+ N +`""" );
            var idLyr = charIDToTypeID( "Lyr " );
            desc12.putObject( idT, idLyr, desc13 );
        executeAction( idsetd, desc12, DialogModes.NO );

    `)
}

    /*
    cs.evalScript(`
var newLayer = app.activeDocument.artLayers.add();
newLayer.kind = LayerKind.TEXT
newLayer.textItem.position= [UnitValue("50px"), UnitValue("100px")]
newLayer.textItem.size = UnitValue("40 pt")
newLayer.textItem.contents= "Holle World!"
//创建一个色彩变量
var c = new SolidColor();
c.rgb.hexValue = "77bb11";
newLayer.textItem.color = c;
    `)
    */
    /*
    cs.evalScript(`
var doc = app.activeDocument;
var newLayers = doc.layerSets.add();
var bounds = newLayers.artLayers.add();
    `)
    */