//JavaScript Document
/*{showCode:'',hallCode:'',filmCode:'',filmNo:'',showDate:'',showTime:''};*/
// JSON Document
sessionStorage.setItem("goodsInfo","");
var selTicketPara = deepCopy(commonParam);
var seats = {
    resultCode: '1',
    refreshBtn: 'hide',
    filmName: '',
    num: '',
    date: '',
    type: '',
    seat: [],//座位图
    selectedSeat: [],
    discountPrice: '',
    originalPrice: '',
    confirm: 'javascript:createOrder()',
    schedule:[]
};
var limitTicketAmount;//限购张数
var ticketPrice;//票价，活动价或者折扣价
var eventTicketNum;//活动票数量
var eventTicketNumStatic;//活动票数量(不受选座影响)
var usedNum;//用户参加活动票数量
var seatInfo = {seat:[]};//选中的座位信息
var needPayOrderNo;//待支付订单号
var confirmFlag;//支付状态标识
var eventStopTime = "";//活动结束时间
var notEventPrice;//非活动价格
var eventPrice = "0";//活动价格
var terraceFilmPrice = "0";//策略价
var eCode = GetQueryString('eventCode'),//活动code
    reLoadingFlag = false;

//data importing Function
function importFn(sData) {
//	console.log(sData);
    var homeData = sessionStorage.getItem("homeData");
    needPayOrderNo = sData.resultData.needPayOrderNo;//待支付订单号
    confirmFlag = sData.resultData.confirmFlag;//支付标识
    if(null != homeData){
        //排期数据
        var cacheData = new Function("return" + homeData)();//转换后的JSON对象
        var swiperFilm = cacheData.swiperFilm;
        for(var i=0; i<swiperFilm.length; i++){
            if(swiperFilm[i].movieID == selTicketPara.filmNo){
                seats.filmName = swiperFilm[i].name;//电影名称
                schedule = swiperFilm[i].schedule;
                seats.schedule = schedule;
                break;
            }
        }
        //其他数据
        if(null != schedule){
            for(var i=0; i<schedule.length; i++){
                if(schedule[i].date == selTicketPara.showDate){
                    var content = schedule[i].content;
                    if(null != content){
                        for(var j=0; j<content.length; j++){
                            if(content[j].startTime == selTicketPara.startTime && content[j].roomCode == selTicketPara.hallCode){
                                seats.num = content[j].room;//影厅名称
                                if(content[j].ismorrow == 1){
                                    //判断次日播放
                                    var date = new Date(schedule[i].date);
                                    if(date.getHours() == 0 && date.getMinutes() == 0 && date.getSeconds() == 0){
                                        //0点0分0秒不算下一天
                                    }else{
                                        date.setDate(date.getDate()+1);
                                    }
                                    var dateCode = FormatDate(date);
                                    seats.date = dateCode + " " + content[j].startTime;//放映时间
                                    //判断次日播放end
                                }else{
                                    seats.date = schedule[i].date + " " + content[j].startTime;//放映时间
                                }
                                seats.type = content[j].movieType;//影片类型
                                seats.discountPrice = content[j].price;//折扣价
                                notEventPrice = content[j].price;//非活动价
                                ticketPrice = content[j].price;//票价等于折扣价
                                if(typeof(content[j].terraceFilmPrice)=='undefined') {
                                    terraceFilmPrice="0"
                                } else {
                                    terraceFilmPrice = content[j].terraceFilmPrice;//策略价
                                }
                                seats.originalPrice = content[j].endPrice;//原价
                                limitTicketAmount = sData.resultData.limitTicketAmount
                                if(content[j].eventIsSatart == true){//活动相关
                                    // var eventStartTime = new Date(content[j].t1.replace(/-/g, "/"));
                                    eventEndTime = new Date(content[j].t2.replace(/-/g, "/"));
                                    eventStopTime = content[j].t2;
                                    var now = new Date();
                                    // if(eventEndTime.getTime() > now.getTime() && now.getTime() > eventStartTime.getTime()){
                                    eventPrice = content[j].eventPrice;
                                    $("#eventPrice").text("￥" + content[j].eventPrice);
                                    showCountDown(eventEndTime);
                                    window.setInterval("showCountDown(eventEndTime)", 1000);
                                    $(".sitT").show();
                                    $(".sit_box").addClass("sit_box1");
                                    ticketPrice = content[j].eventPrice;//票价等于活动价
                                    usedNum = sData.resultData.usedNum;
                                    eventTicketNum = sData.resultData.eventLimitTicketAmount;
                                    eventTicketNumStatic = sData.resultData.eventLimitTicketAmount;
                                    var discountNum = sData.resultData.discountNum;
                                    if(typeof(discountNum) == 'undefined'){
                                        discountNum = '';
                                    }
                                    if(discountNum != '' && discountNum != '0'){
                                        if(eventTicketNum <= 0){
                                            yh.oAlert("活动票已抢光，将按"+ content[j].price + "元支付");

                                        }else{
                                            if(null != sessionStorage.memberCode && sessionStorage.memberCode != ''){
                                                // yh.oAlert("本次优惠活动每人限购" +discountNum+"张，您还可购"+eventTicketNum+"张，超出将按非活动价收费");
                                                yh.oAlert("本次特惠活动限购" +discountNum+"张/人。您还可享"+eventTicketNum+"张特惠票，超出张数将按非活动价收费");
                                            }
                                        }
                                    }else{
                                        usedNum = 0;
                                    }
                                    // }else if(now.getTime() < eventStartTime.getTime()){
                                    // 	eCode = "";
                                    // 	yh.oAlert("活动还未开始，购票价格为"+content[j].price+"元，活动开始时间"+content[j].t1.substring(11,16)+",可享"+content[j].eventPrice+"元特惠观影");
                                    // }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    var nos = sData.resultData.nos;
    var maxCol = sData.resultData.maxCol;
    var seatsData = sData.resultData.seats;
    var resultCode = sData.resultCode;
    //座位图
    seatMap = {};//逻辑座位号
    if(nos == undefined){
        seats.refreshBtn = 'show';
//		PopWin({
//			content: '网络堵车,请稍后重试', //弹框内容
//			btnCount: 1, //操作按钮有几个
//			btn1: '回到首页', //btn1填按钮名，且必填，
//			btn2Callback:function(){
//				window.location.href=path + "/page?pagePath=home/index&companyCode="+sessionStorage.movieCode;
//			} //此为btn1的回调函数，必填
//		});
    }else{
        seats.nos = nos;
        for(var i=1; i<nos.length+1; i++){
            var colData="";
            for(var j=1; j<=maxCol; j++){
                colData += "_";
                for(var k=0; k<seatsData.length; k++){
                    if(seatsData[k].rowNum == i && seatsData[k].colNum == j){
                        colData = colData.substring(0,colData.length-1) + "a";
                        seatMap[i+"_"+j] = seatsData[k].rowId + "_" + seatsData[k].colId + "_" + seatsData[k].seatNo + "_" + seatsData[k].sectionId;
                        break;
                    }
                }
            }
            seats.seat.push(colData);
        }
        //已选座位
        for(var i=0; i<seatsData.length; i++){
            if(seatsData[i].seatStatus == 'B' || seatsData[i].seatStatus == 'T'){
                seats.selectedSeat.push(seatsData[i].rowNum + "_" + seatsData[i].colNum);
            }
        }
    }
//	console.log(sData);
}
//倒计时
function showCountDown(endTime){
    var now = new Date();
    var endDate = new Date(endTime);
    var leftTime=endDate.getTime()-now.getTime();
    var dd = parseInt(leftTime / 1000 / 60 / 60 / 24, 10);//计算剩余的天数
    var hh = parseInt(leftTime / 1000 / 60 / 60 % 24, 10);//计算剩余的小时数
    var mm = parseInt(leftTime / 1000 / 60 % 60, 10);//计算剩余的分钟数
    var ss = parseInt(leftTime / 1000 % 60, 10);//计算剩余的秒数
    if(dd <= 0 && hh <= 0 && mm <= 0 && ss <= 0){
        $(".sitT").hide();
        $(".sit_box").removeClass("sit_box1");
    }
    dd = checkTime(dd);
    hh = checkTime(hh);
    mm = checkTime(mm);
    ss = checkTime(ss);//小于10的话加0
    if(dd == "00"){
        $("#eventDay").hide();
        $("#eventDayStr").hide();
    }
    $("#eventDay").text(dd);
    $("#eventHour").text(hh);
    $("#eventMin").text(mm);
    $("#eventSec").text(ss);
}
function checkTime(i){
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}
//创建订单
function createOrder(){
    if(null == sessionStorage.memberCode || sessionStorage.memberCode == ''){
        sessionStorage.seatInfo = JSON.stringify(seatInfo.seat);
        //跳转登陆
        yh.toLoginPage();
        return false;
    } else {
        sessionStorage.removeItem("seatInfo");
    }
    var startDateTime = selTicketPara.showDate + " " +selTicketPara.startTime;
    var haltSales = selTicketPara.haltSales;
    var showStart =new Date(startDateTime.replace(/-/g, "/"));
    var minutes = Number((showStart.getTime()-new Date().getTime())/1000);
    if(1 == haltSales){
//		一个按钮的调用方法
        PopWin({
            content: '该场次已停止在线购票,请重新选择', //弹框内容
            btnCount: 1, //操作按钮有几个
            btn1: '知道了', //btn1填按钮名，且必填，
            btn2Callback:function(){
                window.location.href=path + "/page?pagePath=home/index&companyCode="+sessionStorage.movieCode;
            } //此为btn1的回调函数，必填
        });
    }else if(seatInfo.seat.length == "" || seatInfo.seat.length == 0){
        yh.oAlert("请选择座位");
    }else{
        if(needPayOrderNo != "" && needPayOrderNo != null){
            //两个按钮的调用方法
            PopWin({
                content: '有未支付的订单', //弹框内容
                btnCount: 2, //操作按钮有几个
                btn1: '去支付', //btn1填按钮名，且必填，
                btn2: '支付本单', //如果btnCount = 1，btn2可不填，但btn1必填
                btn1Callback:function(){
                    if(confirmFlag == undefined || confirmFlag == "" || confirmFlag == 0){
                        window.location.href=path + '/page?pagePath=order/orderConfirm&orderNo='+needPayOrderNo+'&companyCode='+sessionStorage.movieCode;
                    }else{
                        window.location.href=path + '/page?pagePath=order/orderWaitPay&orderNo='+needPayOrderNo+'&companyCode='+sessionStorage.movieCode;
                    }
                }, //此为btn1的回调函数，必填
                btn2Callback:function(){
                    toCreatOrder();
                }//此为btn2的回调函数，btn2存在时必填
            });
        }else{
            if(eventStopTime != '' && new Date().getTime() > eventStopTime){
                PopWin({
                    content: "活动票已售罄，将按"+notEventPrice+"元支付，是否继续", //弹框内容
                    btnCount: 2, //操作按钮有几个
                    btn1: '继续', //btn1填按钮名，且必填，
                    btn2: '取消', //如果btnCount = 1，btn2可不填，但btn1必填
                    btn1Callback:function(){
                        toCreatOrder();
                    }, //此为btn1的回调函数，必填
                    btn2Callback:function(){
                        window.location.href=path + "/page?pagePath=home/index&companyCode="+sessionStorage.movieCode
                    }//此为btn2的回调函数，btn2存在时必填
                });
            }else{
                toCreatOrder();
            }
        }
    }
}
function toCreatOrder(){
    var startDateTime = selTicketPara.showDate + " " +selTicketPara.startTime;
    var createOrderParam = {};
    createOrderParam.token = sessionStorage.token;
    createOrderParam.CVersion = sessionStorage.CVersion;
    createOrderParam.OS = sessionStorage.OS;
    createOrderParam.memberCode = sessionStorage.memberCode;
    createOrderParam.oldOrderNo = needPayOrderNo;
    createOrderParam.cinemaCode = sessionStorage.cinemaCode;
    createOrderParam.showTime = startDateTime;
    createOrderParam.eventCode = eCode;
    createOrderParam.hallCode = selTicketPara.hallCode;
    createOrderParam.showCode = selTicketPara.showCode;
    createOrderParam.filmCode = selTicketPara.filmCode;
    createOrderParam.filmNo = selTicketPara.filmNo;
    createOrderParam.payType = "0";
    createOrderParam.channel = "0";
    createOrderParam.recvpPhone = sessionStorage.memberPhone;
    if(parseInt(seatInfo.seat.length) <= parseInt(eventTicketNumStatic)){
        for(var i=0; i<seatInfo.seat.length; i++){
            seatInfo.seat[i].strategyPrice = String(0);
            seatInfo.seat[i].eventPrice = String(eventPrice);
        }
    } else if(parseInt(eventTicketNumStatic) != 0){
        for(var i=0; i<eventTicketNumStatic; i++){
            seatInfo.seat[i].strategyPrice = String(0);
            seatInfo.seat[i].eventPrice = String(eventPrice);
        }
    }
    createOrderParam.seatInfo = JSON.stringify(seatInfo.seat);

    /*yh.oAlert("选座信息"+createOrderParam.CVersion+"os"+createOrderParam.OS+"token"+createOrderParam.token);*/
    jQuery.ajax({
        type:"post",
        url: URL + "/app/order/createOrder",
        data: createOrderParam,
        dataType:"json",
        success:function(data){
            if(data.resultCode == '0'){
                window.location.href= path + "/page?pagePath=goods/goodsList&showCode="+selTicketPara.showCode+"&orderNo="+data.resultData.orderNo+"&companyCode="+sessionStorage.movieCode;
            }else if(data.resultCode == '302'){
                yh.oAlert(data.resultDesc);
                window.location.href= path + "/page?pagePath=goods/goodsList&showCode="+selTicketPara.showCode+"&orderNo="+data.resultData.orderNo+"&companyCode="+sessionStorage.movieCode;
            }else{
                if(data.resultDesc == 'TOKEN_INVALID'){
                    yh.logoutToken();
                    PopWin({
                        content: '为了您的账户安全，请重新登录', //弹框内容
                        btnCount: 1, //操作按钮有几个
                        btn1: '知道了', //btn1填按钮名，且必填，
                        btn2Callback:function(){
                            yh.toLoginPage();
                        } //此为btn1的回调函数，必填
                    });
                }else{
                    yh.oAlert(data.resultDesc);
                    window.location.reload();
                }
            }
        },
        error:function(data){
            console.log("失败"+JSON.stringify(data));
        },
        beforeSend: function(){
            $('#contentH').append('<img src="" alt="" class="loadBtn lol">');
            $(".lol").attr('src',path+"/resources/img/loading.gif");
            // $(".re_btn a").removeAttr("onclick");
        },
        complete: function () {
            $(".lol").remove();
            // $(".re_btn a").attr("onclick","payOrder()");

        }
    });
}
selTicketPara.showCode = GetQueryString('showCode');
selTicketPara.hallCode = GetQueryString('hallCode');
selTicketPara.filmCode = GetQueryString('filmCode');
selTicketPara.filmNo = GetQueryString('filmNo');
selTicketPara.showDate = GetQueryString('showDate');
selTicketPara.startTime = GetQueryString('startTime');
selTicketPara.eventCode = GetQueryString('eventCode');
selTicketPara.haltSales = GetQueryString('haltSales');
var seatData;
jQuery.ajax({
    type:"post",
    url: URL + "/app/film/getShowsSeats",
    //http://101.201.210.244:8081/yinghe-app/app/film/getShowsSeats?showCode=44109446&hallCode=8257&filmCode=051200232017&filmNo=051a00232017&showDate=2017-04-11&showTime=13:40&cinemaCode=11062001&memberCode=2aae9add1ce749af94259360f36d69ad
    data: selTicketPara,
    dataType:"json",
    //   jsonp: "jsonpCallback",//服务端用于接收callback调用的function名的参数
    success:function(data){

        data = FormatSeat(data);

        if(data.resultDesc == 'TOKEN_INVALID'){
            yh.logoutToken();
            PopWin({
                content: '为了您的账户安全，请重新登录', //弹框内容
                btnCount: 1, //操作按钮有几个
                btn1: '知道了', //btn1填按钮名，且必填，
                btn2Callback:function(){
                    yh.toLoginTokenPage();
                    return false;
                    //清空订单
                } //此为btn1的回调函数，必填
            });
        }else{

//			console.log(seats);
            importFn(data);
            //数据拿取成以后，进行vue对象的实例化
            seatData = new Vue({
                el: '#seats',
                data: {
                    msg: seats,
                    scheduleList: seats.schedule[0].content,
                    tabID: 1,
                    resultCode: data.resultCode,
                    nos: seats.nos,
                    anotherSession: false,
                    show: false,
                    hide: false
                },
                methods: {
                    changeTag: function(id){
                        cosole.log(id);
                        this.tabID = id;
                    },
                    showFlag: function(){
                        sessionStorage.removeItem("seatInfo");
                        this.anotherSession = true;
//						$('body').css({overflow: 'hidden'});
                        yh.setNoRefresh(true);
                        this.show = true;
                    },
                    closeAnotherSession: function(){
                        this.anotherSession = false;
//						$('body').css({overflow: 'auto'});
                        yh.setNoRefresh(false);
                        this.hide = true;
                    },
                    lookTom: function(){ //选择其他场次
                        if(this.scheduleList == "" || this.scheduleList == null){
                            var schedule = seats.schedule;
                            if(schedule != null  && schedule != undefined){
                                for(var i = 0; i<schedule.length; i++){
                                    if(schedule[i].content != null && schedule[i].content != undefined && schedule[i].content.length > 0){
                                        this.scheduleList = schedule[i].content;
                                        $('#selSession li').eq(i).addClass('active').siblings("li").removeClass('active');
                                        break;
                                    }
                                }
                            }
                        }
                        return false;
                    }
                },
                mounted: function(){
                    var _this = this;
                    var price = Number(ticketPrice);//票价
                    if(eventTicketNum > 0 && eventTicketNum != ''){
                        price = Number(_this.msg.discountPrice);
                    }

                    var discountp = Number(_this.msg.originalPrice);//原价
                    var map = _this.msg.seat;//座位图

                    //only one sun or moon
                    $('.sun').hide().eq(0).show();
                    $('.moon').hide().eq(0).show();

                    $('#selSession li').eq(0).addClass('active');
                    $('#selSession').on('click', 'li', function(){
                        var T = $(this),
                            liIndex = T.index();
                        T.addClass('active').siblings().removeClass('active');
                        _this.scheduleList = seats.schedule[liIndex].content;
                    });
                    //点击换一场时应显示当前场次所在日期的所有场次
                    var selSessionLi = $('#selSession li');
                    if(selSessionLi.length > 0){
                        for(var i=0; i<selSessionLi.length; i++){
                            var text = $(selSessionLi[i]).text();
                            if(text != undefined && text !=null && text != ''){
                                if(selTicketPara.showDate.substring(8,10) == text.substring(5,7)){
                                    $(selSessionLi[i]).click();
                                }
                            }
                        }
                    }

                    var $cart = $('#selected-seats'), //座位区
                        $lis = $('#selected-seats li').length,
                        $counter = $('#counter'), //票数
                        $total = $('#total'), //总计金额
                        $dis_price=$('#dis_price'),//总计折扣价
                        $face_box=$('#face_box'),//自动选座的盒子
                        $quick=$('#quick'),//快速选择
                        $mask=$('.markBg'),
                        $movie_list=$('.movie_list'),
                        $auto_sit1=$('#auto_sit1'),
                        $change=$('.change');
                    //$clo_btn=$('.clo_btn');
                    var sc = $('#seat-map').seatCharts({
                        map: map,
                        naming : {
                            top : false,
                            getLabel : function(character, row, column) {
                                return column;
                            }
                        },
                        legend : { //定义图例
                            node : $('#legend'),
                            items : [
                                [ 'a', 'available',   '可选座' ],
                                [ 'a', 'unavailable', '已售出']
                            ]
                        },

                        click: function () { //点击事件
//							var checked = sc.find('selected unavailable');
//							console.log("#"+checked.length);
                            var row = this.settings.row,
                                label = this.settings.label,
                                sel_id = this.settings.id,
                                $face_box=$('#face_box'),//自动选座的盒子
                                num = $('#selected-seats').find('li').length;

                            var flag_01 = getById(row + 1, 1).hasClass('available'),
                                flag_r = getById(row + 1, label + 1).hasClass('available'),//右一可选
                                flag_rs = getById(row + 1, label + 1).hasClass('selected'),//右一已选
                                flag_ru = getById(row + 1, label + 1).hasClass('unavailable')//右一已售

                            flag_l = getById(row + 1, label - 1).hasClass('available'),//左一可选
                                flag_ls = getById(row + 1, label - 1).hasClass('selected'),//左一已选
                                flag_lu = getById(row + 1, label - 1).hasClass('unavailable'),//左一已售

                                flag_r2 = getById(row + 1, label + 2).hasClass('unavailable') || getById(row + 1, label + 2).hasClass('selected'),//右二已选或已售
                                flag_r3 = getById(row + 1, label + 3).hasClass('unavailable') || getById(row + 1, label + 2).hasClass('selected'),//右三已选或已售

                                flag_l2 = getById(row + 1, label - 2).hasClass('unavailable') || getById(row + 1, label - 2).hasClass('selected'),//左二已选或已售
                                flag_l3 = getById(row + 1, label + 3).hasClass('unavailable') || getById(row + 1, label + 2).hasClass('selected'),//左三已选或已售
                                end_num = getById(row + 1, label).parent('.seatCharts-row').find('.seatCharts-cell').length - 1,
                                flag_end = getById(row + 1, end_num).hasClass('available'),
                                flag = false;
                            if (this.status() == 'available') { //可选座

                                var flag1 = (label == 2 && flag_01 && flag_r) ? true : false,
                                    flag2 = (label == end_num - 1 && flag_end && flag_l) ? true : false,
                                    flag4 = (flag_l && flag_l2) ? true : false,
                                    flag5 = (flag_l2 && flag_l) ? true : false

                                flag = flag1 || flag2 || flag4 || flag5;
                                if(flag_r2 && flag_r3 && (flag_ls || flag_lu) && (flag_ls || flag_lu) || (label == 1 && flag_r && flag_r2)){
                                    flag = false;
                                }
                                if((flag_rs || flag_ru) && flag_l2 || (label == end_num && flag_l && flag_l2)){
                                    flag = false;
                                }
                                if(num == limitTicketAmount) {
                                    yh.oAlert("最多只能选择"+limitTicketAmount+"张票！");
                                    return 'available';
                                } else if(flag) {
                                    yh.oAlert("旁边不能有空位！");
                                    return 'available';
                                } else {
                                    //添加一条创建订单座位信息
                                    var realPlace = seatMap[row+1 + "_" + label];
                                    var clickSeat = {};
                                    clickSeat.ticketPrice = String(_this.msg.originalPrice);//原价
                                    clickSeat.handlingFee = "0";
                                    clickSeat.eventPrice = String(eventPrice);
                                    clickSeat.strategyPrice = String(terraceFilmPrice);//实际价格
                                    clickSeat.seatRow = realPlace.split("_")[0];
                                    clickSeat.seatRowId = realPlace.split("_")[0];
                                    clickSeat.seatCol = realPlace.split("_")[1];
                                    clickSeat.seatColId = realPlace.split("_")[1];
                                    clickSeat.seatNo = realPlace.split("_")[2];
                                    clickSeat.sectionId = realPlace.split("_")[3];
                                    clickSeat.seatVisulRow = row+1
                                    clickSeat.seatVisulCol =label;
//									if(eventTicketNum != '0' && eventTicketNum != '' && usedNum >= eventTicketNum){
//										clickSeat.eventPrice = String(0);
//										price = Number(_this.msg.discountPrice);
//									}else if(eventTicketNum != '0' && eventTicketNum != '' && usedNum < eventTicketNum){
//										price = Number(ticketPrice);
//										clickSeat.strategyPrice = String(0);//实际价格
//									}
                                    if(eventTicketNum > 0 && eventTicketNum != ''){
                                        price = Number(ticketPrice);
                                        clickSeat.strategyPrice = String(0);//实际价格
                                    }else{
                                        clickSeat.eventPrice = String(0);
                                        price = Number(_this.msg.discountPrice);
                                    }
                                    eventTicketNum--;
//									console.log("##"+clickSeat.eventPrice);
                                    seatInfo.seat.push(clickSeat);
                                    $('<li>' + realPlace.split("_")[0] + '排' + realPlace.split("_")[1] + '座</li>')
                                        .attr('id', 'cart-item-' + sel_id)
                                        .data('seatId', sel_id)
                                        .appendTo($cart);

                                    $counter.text(sc.find('selected').length + 1);
                                    var recalculateTotalPrice = recalculateTotal(sc);
                                    $total.removeClass('none').html((Number((recalculateTotalPrice*100).toFixed()) + Number((price*100).toFixed()))/100 + '元');
                                    $dis_price.text(discount(sc) + discountp);
                                    $face_box.hide();
                                    $quick.hide();

                                    //return 'selected';
                                    return 'selected unavailable';
                                }
                            } else if (this.status() == 'selected' || this.status() == 'selected unavailable') { //已选中
//								var sear_l = getById()
                                console.log('row:' + row + ',label:' + label + ',end_num:' + end_num);
                                var seatL = getById(row + 1, label - 1).hasClass('selected'),//左一已选
                                    seatR = getById(row + 1, label + 1).hasClass('selected'),//右一已选
                                    seatR1u = getById(row + 1, label + 1).hasClass('unavailable'),//右一已售
                                    seatL1 = getById(row + 1, label - 1).hasClass('unavailable'),//左一已售
                                    seatL2 = getById(row + 1, label - 2).hasClass('unavailable'),//左二已售
                                    seatR1 = getById(row + 1, label + 1).hasClass('unavailable'),//右一已售
                                    seatR3 = getById(row + 1, label + 3).hasClass('unavailable'),//右三已售
                                    rowEnd = getById(row + 1, label).parent('.seatCharts-row').find('.seatCharts-cell').length - 1,
                                    t_flag_1 = false;

                                t_flag_1 = (label != 1 && label != rowEnd && ((seatL && seatR))) || (label == 1 && seatR);
                                if(seatL1 && seatL2 && seatR3){t_flag_1 = false;}
                                if(seatR1u && seatL2){t_flag_1 = false;}

                                if(t_flag_1){
                                    yh.oAlert("旁边不能有空位！");
                                    return 'selected';
                                } else {
                                    if($cart.children('li').length<=1){
                                        $face_box.show();
                                        $quick.show();
                                    }
                                    //更新数量
                                    $counter.text(sc.find('selected').length - 1);
                                    //更新总计
                                    //							var count = recalculateTotal(sc) - price;

                                    if(eventTicketNum < 0 && eventTicketNum != ''){
                                        price = Number(_this.msg.discountPrice);//非活动
                                    }else{
                                        price = Number(ticketPrice);//活动
                                    }
                                    eventTicketNum++;

                                    var count = (Number((recalculateTotal(sc)*100).toFixed())-Number((price*100).toFixed()))/100;
                                    if(count < 0){
                                        count = 0;
                                    }

                                    $total.removeClass('none').html(count+'元');

                                    $dis_price.text(discount(sc) - discountp);
                                    //删除已预订座位
                                    $('#cart-item-' + sel_id).remove();


                                    //删除一条创建订单座位信息
                                    var infoSeat = seatInfo.seat;
                                    var realPlace = seatMap[row+1 + "_" + label];
                                    for(var i=0; i< infoSeat.length; i++){
                                        if(infoSeat[i].seatNo == realPlace.split("_")[2]){
                                            seatInfo.seat.splice(i, 1);
                                        }
                                    }

                                    return 'available';
                                }

                            } else if (this.status() == 'unavailable') { //已售出
                                return 'unavailable';
                            } else {
                                return this.style();
                            }
                        }
                    });
                    $cart.on('click','li',function(){
                        var rowStr = $(this).text().split("排"),
                            row = rowStr[0],
                            label = Number(rowStr[1].split("座")[0]);
                        var seatL = getById(row, label - 1).hasClass('selected'),
                            seatR = getById(row, label + 1).hasClass('selected'),
                            seatL1 = getById(row, label - 1).hasClass('unavailable'),
                            seatR1 = getById(row, label + 1).hasClass('unavailable'),
                            rowEnd = getById(row, label).parent('.seatCharts-row').find('.seatCharts-cell').length - 1,

                            t_flag_1 = (label != 1 && label != rowEnd && ((seatL && seatR) || (seatL && seatR1) || (seatL1 && seatR))) || (label == 1 && seatR) || (label == rowEnd && seatL);

                        if(t_flag_1){
                            yh.oAlert("旁边不能有空位！");
                            return 'selected';
                        }else{
                            var data=$(this).attr('id').substr(10);
                            if(eventTicketNum < 0 && eventTicketNum != ''){
                                price = Number(_this.msg.discountPrice);//非活动
                            }else{
                                price = Number(ticketPrice);//活动
                            }
                            eventTicketNum++;

                            var count = (Number((recalculateTotal(sc)*100).toFixed())-Number((price*100).toFixed()))/100;
                            //var count = recalculateTotal(sc) - price;
                            if(count < 0){
                                count = 0;
                            }

                            $total.removeClass('none').html(count+'元');
                            sc.get(data).status('available');

                            if($(this).parent().children().length<=1){
                                $face_box.show();
                            }
                            $(this).remove();
                            //删除一条创建订单座位信息
                            var seatId = $(this).attr("id");
                            var realPlace = seatMap[seatId.split("-")[2]];
                            var infoSeat = seatInfo.seat;
                            for(var i=0; i< infoSeat.length; i++){
                                if(infoSeat[i].seatNo == realPlace.split("_")[2]){
                                    seatInfo.seat.splice(i, 1);
                                }
                            }
                        }


                    });


                    var $seatBox = $('#seat-box');
                    var $seatMap = $("#seat-map");
                    var seatCenter = $('#seat-map > div:first-child .seatCharts-cell');
                    var len = $('#seat-map > div:first-child .seatCharts-cell').length;
                    var lens = len-1;
                    var is = Math.ceil(lens/2);
                    lens%2 == 0 ? seatCenter.eq(is).addClass('centerLine') : seatCenter.eq(is).addClass('centerLine1');

                    $('.seatCharts-row').css({
                        width: (2.2 * len) + 1.6 + 'rem'
                    });
                    $seatMap.css({
                        width: (2.2 * len) + 1.6 + 'rem'
                    });

                    var seatBox = $('.seat-box').width();
                    if(seatBox < $('.seat-map').width()){
                        var mls = parseInt(($('.seat-map').width() - seatBox)/2);
                        $('.seat-map').css('marginLeft',-mls);
                    }
                    $('.seat-map').on('touchmove',function(e){
                        if(seatBox < $('.seat-map').width()){
                            $(this).css('marginLeft',0);
                        }
                    });
                    //已售出的座位
                    sc.get(_this.msg.selectedSeat).status('unavailable');
                    getSelectedSeats();
                    function recalculateTotal(sc) {
                        var total = 0;
//						sc.find('selected unavailable').each(function () {
//							total += price;
//						});
                        total = $("#total").text().substring(0,$("#total").text().length-1);;
                        return Number(total);
                    }

                    function discount(sc){
                        var disprice=0;
                        sc.find('selected unavailable').each(function () {
                            disprice += discountp;
                        });
                        return disprice;
                    }
                    function getById(a, b){
                        // console.log('#' + a + '_' + b)
                        return $('#' + a + '_' + b);
                    }

                    touch.on($seatBox, 'touchmove', function (ev) {
                        ev.preventDefault();//阻止默认事件
                    });
                    //初始化设置
                    if($(".seat-map").width()<=$(".seat-box").width()){
                        $('.seat-map').css("left", ($(".seat-box").width()-$('.seat-map').width())/2);
                    };

                    // 参数(el,fun,min,max)
                    cat.touchjs.scale($seatBox, function (scale) {
                        $seatBox.css({
                            'transform': 'scale(' + scale + ')',
                            '-webkit-transform': 'scale(' + scale + ')'
                        });
                        $('.nos').css({
                            'left':($("#seat-box").width()*(cat.touchjs.scaleVal-1)/(cat.touchjs.scaleVal*2))
                        });
                    },1,2);
                    cat.touchjs.drag($('.seat-map'), function (left, top) {
                        var l=left,
                            t=top;
                    });
                    cat.touchjs.doubletap();

                    if(reLoadingFlag){
                        yh.closeReloading();
                        reLoadingFlag = false;
                    }
                    /**
                     * 获取未登录时选择的座位信息
                     */
                    function getSelectedSeats(){
                        var seatInfos = sessionStorage.seatInfo;
                        if(seatInfos != undefined){
                            seatInfos = jQuery.parseJSON(seatInfos);
                            $.each(seatInfos, function(index, data) {
                                var row = data.seatVisulRow-1,
                                    label= data.seatVisulCol,
                                    sel_id = data.seatVisulRow + "_" + data.seatVisulCol,
                                    $face_box=$('#face_box');//自动选座的盒子
                                //添加一条创建订单座位信息
                                var realPlace = seatMap[row+1 + "_" + label];
                                var clickSeat = {};
                                clickSeat.ticketPrice = String(_this.msg.originalPrice);//原价
                                clickSeat.handlingFee = "0";
                                clickSeat.eventPrice = String(eventPrice);
                                clickSeat.strategyPrice = String(terraceFilmPrice);//实际价格
                                clickSeat.seatRow = realPlace.split("_")[0];
                                clickSeat.seatRowId = realPlace.split("_")[0];
                                clickSeat.seatCol = realPlace.split("_")[1];
                                clickSeat.seatColId = realPlace.split("_")[1];
                                clickSeat.seatNo = realPlace.split("_")[2];
                                clickSeat.sectionId = realPlace.split("_")[3];
                                clickSeat.seatVisulRow = row+1
                                clickSeat.seatVisulCol =label;
                                if(eventTicketNum > 0 && eventTicketNum != ''){
                                    price = Number(ticketPrice);
                                    clickSeat.strategyPrice = String(0);//实际价格
                                }else{
                                    clickSeat.eventPrice = String(0);
                                    price = Number(_this.msg.discountPrice);
                                }
                                eventTicketNum--;
                                seatInfo.seat.push(clickSeat);
                                $('<li>' + realPlace.split("_")[0] + '排' + realPlace.split("_")[1] + '座</li>')
                                    .attr('id', 'cart-item-' + sel_id)
                                    .data('seatId', sel_id)
                                    .appendTo($cart);
                                $counter.text(sc.find('selected').length + 1);
                                var recalculateTotalPrice = recalculateTotal(sc);
                                $total.removeClass('none').html((Number((recalculateTotalPrice*100).toFixed()) + Number((price*100).toFixed()))/100 + '元');
                                $dis_price.text(discount(sc) + discountp);
                                $face_box.hide();
                                $quick.hide();
                                getById(row + 1, label).removeClass("available").removeClass("unavailable").addClass('selected unavailable');
                                sc.get(sel_id).status('selected unavailable');
                            });
                        }
                    }
                },
                updated: function(){
                    $('.markBg').on('touchmove', function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                    });
                    if(this.show){
                        this.show = false;
                        $('body').css({overflow: 'hidden'});
                    }
                    if(this.hide){
                        this.hide = false;
                        $('body').css({overflow: 'auto'});
                    }

                    $('.sun').hide().eq(0).show();
                    $('.moon').hide().eq(0).show();
                }

            });

        }
    },
    error:function(data){
        console.log("失败"+JSON.stringify(data));
    }
});

function reloadFn(){
    reLoadingFlag = true;
    window.location.reload();
}
function FormatDate (strTime) {
    var date = new Date(strTime);
    return date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
}

//去掉没有座位的行和列
function FormatSeat(data) {
   // return data; //调试用

   // if(sessionStorage.cinemaCode!='32019211'){ //暂时先优化这1家影城
   //   return data;
   // }

   //优化行开始--------------------------------------------------------

   console.log("总行数据1---------"+data.resultData.nos);
   console.log("总行长度2---------"+data.resultData.nos.length);
   var arr = new Array() ;
   var leftBl = false;
   var rightBl = false;
   for( var i = 0; i < data.resultData.nos.length; i++ ){
     if( leftBl || data.resultData.nos[i] != '' ) {
       leftBl = true;
       // console.log('i:'+data.resultData.nos[i] + ",");
       arr.push(data.resultData.nos[i])
     }
   }

   console.log('arr-------'+arr);
   var arr2=new Array();
   for( var j = arr.length-1 ;j >= 0 ;j-- ){
     if( rightBl ||  Number(arr[j]) !=  '') {
       rightBl = true;
       // console.log('j:'+arr[j] + ",");
       arr2.push(arr[j])
     }
   }

   var rowDifference = Number(data.resultData.nos.length - Number(arr.length));
   console.log("行差："+rowDifference);

   for(var seat in data.resultData.seats){
     data.resultData.seats[seat].rowNum -=  rowDifference;
   }

   console.log('arr2-------'+arr2);
   data.resultData.nos = arr2.reverse(); //优化行
   console.log("总行数据3---------"+data.resultData.nos);
   console.log("总行长度4---------"+data.resultData.nos.length);

   //优化行结束--------------------------------------------------------

   //优化列开始--------------------------------------------------------
   var maxColIdReal=0,maxColIdLogic=0,minColIdLogic=99999;

   var arrColNum = [];
   for(var seat in data.resultData.seats){
     var tmp_colId=Number(data.resultData.seats[seat].colNum);
     //arrColNum.add(tmp_colId);
     if(arrColNum.indexOf(tmp_colId) == -1) {
       arrColNum.push(tmp_colId);
     }
     if(maxColIdLogic<tmp_colId){
       maxColIdLogic=tmp_colId;
     }
     if(minColIdLogic>tmp_colId){
       minColIdLogic=tmp_colId;
     }
   }
   maxColIdReal=arrColNum.length;
   console.log('arrColNum:'+arrColNum.length);
   console.log("来源最大列："+data.resultData.maxCol);
   console.log("实际最大列："+maxColIdReal);
   console.log("逻辑最大列："+maxColIdLogic);
   console.log("逻辑最小列："+minColIdLogic);

   var colDifference = Number(data.resultData.maxCol) - Number(maxColIdReal);
   console.log("列差：" + colDifference);
   if(colDifference<0){ // 联系POS技术修正数据，如果他们修正不了，我们在修改程序
     console.log("实际列数大于来源列数，使用实际列总数");
     data.resultData.maxCol = maxColIdReal;//优化列
   }
   if( (data.resultData.maxCol != maxColIdLogic || minColIdLogic>1) && colDifference<minColIdLogic ) {
     // console.log("优化前坐位："+JSON.stringify(data.resultData.seats));

     for (var seat in data.resultData.seats) {
       // console.log("colNum前:"+data.resultData.seats[seat].colNum );
       data.resultData.seats[seat].colNum -= colDifference;
       // console.log("colNum后:"+data.resultData.seats[seat].colNum );
     }
     // console.log("优化后坐位："+JSON.stringify(data.resultData.seats));
     data.resultData.maxCol = maxColIdReal;//优化列
   }

   //优化列结束--------------------------------------------------------

   return data;

 }