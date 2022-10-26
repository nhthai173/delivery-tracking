const DEBUG = false

const SHEET_ID = '1TSsV-sCAXCbnb8uZoY06rOeUTQLXtNOxzaVoLx_UJ2c'

var NHT_TOKEN = JSON.parse(DriveApp.getFileById('1IL_jU6oa2O-MbquaONGBOv1wVdJ1B98d').getBlob().getDataAsString())

var ALL_LIST = {
  //'bestexpress': 'Best Express',
  'ninjavan': 'Ninjavan',
  'vnpost': 'VietNam Post',
  //'vnems': 'VietNam EMS'
  'viettelpost': 'Viettel Post',
  'spx': 'Shopee Express',
  'jt': 'J&T Express',
  'ghn': 'Giao hàng nhanh',
  'best': 'Best Express'
}

function ALL_URL(dvvc, code){
  switch(dvvc){
    case 'jt':
      return 'https://jtexpress.vn/track?billcodes=' + code
    case 'ghn':
      return 'https://donhang.ghn.vn/?order_code=' + code
    case 'vnpost':
      return 'http://www.vnpost.vn/en-us/dinh-vi/buu-pham?key=' + code
    case 'viettelpost': case 'spx': 
      return 'https://www.tracktry.com/track/' + code + '/' + TRACKTRY_LIST[dvvc][0]
    case 'ninjavan':
      return 'https://www.ninjavan.co/en-vn/tracking?id=' + code
    case 'best':
      return 'https://best-inc.vn/track?bills=' + code
  }
}

var TRACKTRY_LIST = {
  /*
  'bestexpress': [
    '800best',
    'Best Express',
    function(code){return 'https://best-inc.vn/track?bills='+code}
  ],
  'ninjavan': [
    'ninjavan-vn',
    'Ninjavan',
    function(code){return 'https://www.ninjavan.co/en-vn/tracking?id='+code}
  ],
  */
  'vnpost': [
    'vietnam-post',
    'VietNam Post',
    function(code){return 'http://www.vnpost.vn/en-us/dinh-vi/buu-pham?key='+code}
  ],
  'viettelpost': ['viettelpost', 'ViettelPost'],
  'spx': ['spx-vn', 'Shopee Express']
}


var _17TRACK_LIST = {
  ninjavan: {
    fc: 100129,
    url: function(code){return 'https://www.ninjavan.co/en-vn/tracking?id='+code},
    name: 'Ninjavan'
  },
  /*
  vnems: {
    fc: 22043,
    url: function(code){return 'http://www.vnpost.vn/en-us/dinh-vi/buu-pham?key='+code},
    name: 'VietNam EMS'
  },
  vnpost: {
    fc: 22041,
    url: function(code){return 'http://www.vnpost.vn/en-us/dinh-vi/buu-pham?key='+code},
    name: 'VietNam Post'
  }
  */
}



function logFile(content){
  if(DEBUG)
    DriveApp.getFolderById('10AeDHITThqcOowgHpEAXeWtuFwo3I4DZ').createFile(Utilities.formatDate(new Date(), 'GMT+7', 'ddMMyyyy_HHmmss')+'.txt', JSON.stringify(content))
}


function main(dvvc, mavandon){
  switch(dvvc){
    case 'jt':
      var result = {valid: false}
      var res = UrlFetchApp.fetch('https://jtexpress.vn/vi/tracking?type=track&billcode='+mavandon, {"muteHttpExceptions": true})
      if(res.getResponseCode() != 200){
        result.valid = false
      }else{
        result.valid = true
        const $ = Cheerio.load(res.getContentText())
        const main = $('.result-tracking .tab-content').first()
        if(main){
          const lastest = main.find('.result-vandon-item').first()
          if(lastest){
            let timeDate = lastest.children().first()
            let content = lastest.children().last()
            if(timeDate){
              result.time = prettifyString(timeDate.text()) || ''
            }
            if(content){
              result.content = prettifyString(content.text()) || ''
            }
          }
        }
      }
      return result
      break
    case 'ghn':
      var result = {valid: false}
      var res = UrlFetchApp.fetch('https://fe-online-gateway.ghn.vn/order-tracking/public-api/client/tracking-logs?order_code='+mavandon, {"muteHttpExceptions": true})
      if(res.getResponseCode() == 200){
        result.valid = true
        result.valid1 = true
        result.content = res.getContentText()
      }
      return result
      break
    case 'best':
      var result = {valid: false}
      var res = UrlFetchApp.fetch('https://giaohangtotnhat.vn/wp-admin/admin-ajax.php', {
        method: 'post',
        "muteHttpExceptions": true,
        headers: {
          'accept-language': 'vi',
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.109 Safari/537.36',
          'x-requested-with': 'XMLHttpRequest'
        },
        payload: {
          'madonhang': String(mavandon),
          'action': 'TraCuuDonHang'
        }
      })
      if(res.getResponseCode() == 200){
        const rawData = res.getContentText()
        if(rawData.indexOf('Mã đơn hàng không chính xác') == -1){
          result.valid = true
          result.valid1 = true
          result.content = rawData
        }
      }
      return result
      break
    case 'vnpost': case 'viettelpost': case 'spx':
      var result = {valid: false}
      var res0 = UrlFetchApp.fetch('https://api.tracktry.com/v1/trackings/realtime',{
        "muteHttpExceptions": true,
        method: 'post',
        headers:{
          'Content-Type': 'application/json',
          'Tracktry-Api-Key': NHT_TOKEN['tracktry'][0]
        },
        payload: JSON.stringify({
          "tracking_number": mavandon,
          "carrier_code": TRACKTRY_LIST[dvvc][0],
          "destination_code": "vn"
        })
      })
      if(res0.getResponseCode() == 200){
        result.valid = true
        console.log(res0.getContentText())
        var res = JSON.parse(res0.getContentText())
        result.content = res
        if(res["data"] && res["data"]["items"][0] && res["data"]["items"][0]["lastUpdateTime"] && res["data"]["items"][0]["lastEvent"]){
          result.valid1 = true
        }
      }
      return result
      break
    case 'ninjavan':
      var result = {valid: false}
      var res = UrlFetchApp.fetch('https://t.17track.net/restapi/track', {
        "muteHttpExceptions": true,
        "method": "post",
        "headers": {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
          "x-requested-with": "XMLHttpRequest",
          "Referer": "https://t.17track.net/en",
          "cookie": 'country=VN; _yq_bid=G-53DD867069B2939E; v5_Culture=en; _ga=GA1.2.1145167539.1656054154; __gads=ID=e5068fa1803a0b02:T=1656054154:S=ALNI_MbuloyOtCJ2I4Lb7wLa_HnYPaxaRA; _cc_id=84ea49cfabb13b91b81cc191817418ff; panoramaId_expiry=1656658955077; panoramaId=6a59004c7dda1208fa07d6ed9e7016d53938029cf11e59797ab867f57f0149ed; crisp-client/session/115772b1-4fc7-471c-a364-05246aac2f53=session_bedd9fab-cf57-4afd-a241-7f5c33022e71; _ati=4325710178852; _gid=GA1.2.997136919.1656403860; __gpi=UID=000006efe8d0a550:T=1656054154:RT=1656403860:S=ALNI_MaZIV5pT6QkRqstuHTrJl-QwzNrkg; uid=CCE7C3481B2A44C287BCB88F1D4B1B44; _yq_rc_=yq.11.2204.en.6.4.403898579953279841B; v5_HisExpress=100129; FCNEC=[["AKsRol_oX1SL9TNluWaxmolU1gbmoS6StqBAtEevpTm3nMUTxa4yto2Esb5-86pf3PItLcBCl4kbM91oSw0ykJ3LP7uHJNVmldOJHmEoq5dL0mKpBCa9fSI8f_7Yc_uRrmeBsUoNfCo9pzFWLF2KRVuGZgVnS_9NFg=="],null,[]]; cto_bundle=eN7ygF8lMkZQTFJRUFZwMXI2WmZDU3N5M0Fzb0VwQldLQlRlbDVtQzlGZm5EYUhVN0JsRTFiQmRxMVdzU0NldjJpZVBtVTNxS1huZkNXSmJ1YVU3aEljUjJUUHladE5wcENPVncwbnBSM2h5S1RNWGtsRzNYdGdqNG0lMkZnd3YlMkZCSUZmUDV4WFBjMHZaJTJCYXo5TmhLRFdBbVlGY0FxZyUzRCUzRA; v5_TranslateLang=en; Last-Event-ID=657572742f3062332f34343231353639613138312f343966393038383031633a353030303533313137313a65736c61663a6e776f64706f72642d6b636172742d717920616964656d2d756e656d2d6e776f64706f726420756e656d2d6e776f64706f72641523188907e209ef6a41'
        },
        "payload": JSON.stringify({
          "guid":"",
          "timeZoneOffset":-420,
          "data":[{
            "num": mavandon,
            "fc": _17TRACK_LIST[dvvc]['fc'],
            "sc":0
          }]
        })
      })
      if(res.getResponseCode() == 200){
        result.valid = true
        console.log(res.getContentText())
        res = JSON.parse(res.getContentText())
        result.content = res
        if(res["ret"] == 1 && res["msg"] == "Ok" && res["dat"] && res["dat"].length > 0 && res['dat'][0]["track"] && res['dat'][0]["track"]["z0"]){
          result.valid1 = true
        }
      }
      return result
      break
    default:
      return {valid: false, valid1: false, content: ''}
      break
  }
}






function addVD(teleID, dvvc, mavandon, tendonhang, interval){
  interval = interval || ''
  addRow(
    SpreadsheetApp.openById(SHEET_ID).getSheetByName(dvvc),
    [mavandon, teleID, tendonhang, '', '', interval]
  )
  loop()
}






function loop(){
  jt()
  ghn()
  best()
  tracktry()
  _17track()
}





function addRow(sheet, data){
  var added = false
  for(i=2; i<=sheet.getLastRow(); i++){
    var r = sheet.getRange(i, 1, 1, sheet.getLastColumn())
    var sd = r.getValues()
    var sEmpty = true
    for(j in sd[0]){
      if(sd[0][j]){
        sEmpty = false
        break
      }
    }
    if(sEmpty == true){
      r.setValues([data])
      added = true
      break
    }
  }
  if(added == false){
    sheet.appendRow(data)
  }
}





function getAll(id){

  function trackKey(msgtext, dvvc, code, name){
    return {
      "inline_keyboard": [
        [{
          "text": msgtext,
          "url": ALL_URL(dvvc, code)
        }],
        [{
          "text": 'Xoá đơn',
          "callback_data": "addNewVD.delete." + dvvc + "." + code + "." + name
        }]
      ]
    }
  }

  var vdCount = 0
  for(i in ALL_LIST){
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(i)
    if(sheet.getLastRow() > 1){
      var sd = sheet.getRange(2, 1, sheet.getLastRow()-1, sheet.getLastColumn()).getValues()
      for(j in sd){
        var vd = {
          code: sd[j][0],
          id: sd[j][1],
          name: sd[j][2],
          time: sd[j][3],
          content: sd[j][4],
          interval: sd[j][5]
        }
        if(vd.id == id){
          vdCount++
          if(vd.interval){
            telegramSendText(vd.id, '<b>Đơn hàng: '+vd.name+'</b>\nĐVVC: '+ALL_LIST[i]+'\nMã vận đơn: <code>'+vd.code+'</code>\n-----\nĐơn nằm trong danh sách chờ\nĐơn hàng được kiểm tra lần cuối vào lúc: '+Utilities.formatDate(new Date(vd.interval), 'GMT+7', 'dd/MM/yyyy HH:mm:ss'), trackKey('Xem tại Web', i, vd.code, vd.name))
          }else{
            console.log('<b>Đơn hàng: '+vd.name+'</b>\nĐVVC: '+ALL_LIST[i]+'\nMã vận đơn: <code>'+vd.code+'</code>\n-----\n'+vd.content)
            console.log(JSON.stringify(trackKey("Xem toàn bộ", i, vd.code, vd.name)))
            telegramSendText(vd.id, '<b>Đơn hàng: '+vd.name+'</b>\nĐVVC: '+ALL_LIST[i]+'\nMã vận đơn: <code>'+vd.code+'</code>\n-----\n'+vd.content, trackKey("Xem toàn bộ", i, vd.code, vd.name))
          }
        }
      }
    }
  }

  if(vdCount == 0){
    telegramSendText(id, '<b>Danh sách trống</b>\nDanh sách vận đơn của bạn hiện đang trống.')
  }

}



function deleteVD(dvvc, mavandon){
  var iss = false
  var ss = SpreadsheetApp.openById(SHEET_ID).getSheetByName(dvvc)
  for(i=2; i<= ss.getLastRow(); i++){
    var ssc = ss.getRange('A'+i).getValue()
    if(ssc == mavandon){
      ss.getRange(i, 1, 1, ss.getLastColumn()).clearContent()
      iss = true
    }
  }
  return iss
}




/* common functions */

function stringMatch(str, mstr){
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
  str = str.replace(/ + /g, "");
  str = str.replace(/\s/g, "");
  str = str.toLowerCase();
  str = str.trim();
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, "");
  if(str.indexOf(mstr) >= 0){
    return true
  }else{
    return false
  }
}


function prettifyString(str){
  return str.replace(/\n/g, ' ')
            .replace(/\r/g, ' ')
            .replace(/\t/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/^\s+/g, '')
            .replace(/(\s+)$/g, '')
}

function prettifyRow(row = [[]]){
  let newRow = []
  for(const i in row){
    if(row[i] && Array.isArray(row[i]) && row[i].length){
      newRow.push(row[i])
    }
  }
  return newRow
}






function jt(){
  const parse = (d) => {
    return {
      code: d[0],
      tid: d[1],
      name: d[2],
      time: d[3],
      content: d[4],
      interval: d[5],
      _path: {
        code: 0,
        tid: 1,
        name: 2,
        time: 3,
        content: 4,
        interval: 5
      }
    }
  }

  const ss = SpreadsheetApp.openById(SHEET_ID).getSheetByName('jt')
  if(ss === null) return
  if(ss.getLastRow() < 2) return

  let anyUpdate = false
  let data = ss.getRange(2, 1, ss.getLastRow()-1, ss.getLastColumn()).getValues()


  for(const i in data){
    try{
      const d = parse(data[i])
      if(!d.code){
        anyUpdate = true
        for(const j in data[i]) data[i][j] = ''
        continue
      }
      if(d.interval && new Date().getTime() < new Date(d.interval).getTime()+3600000){
        continue
      }

      const track = main('jt', d.code)
      if(track.content){
        data[d._path.interval] = ''
        if(track.time != d.time){
          
          anyUpdate = true
          telegramSendText(d.tid, `<b>Đơn hàng: ${d.name}</b>\nĐVVC: J&T Express\nMã vận đơn <code> ${d.code} </code>`)
          let trackKey = {
              "inline_keyboard": [
                  [ {
                      "text": "Xem toàn bộ",
                      "url": "https://jtexpress.vn/vi/tracking?type=track&billcode=" + d.code
                  } ],
              ]
          }
          if (stringMatch(track.content, 'donhangdakynhan')) {
            telegramSendText(d.tid,`${track.time}\n${track.content}\n\nĐơn hàng sẽ được tự động xoá khỏi hệ thống.`, trackKey)
            for(const j in data[i]) data[i][j] = ''              
          } else {
            telegramSendText(d.tid, `${track.time}\n${track.content}`, trackKey)
            data[i][d._path.time] = track.time
            data[i][d._path.content] = track.content                
          }

        }
      }else{
        anyUpdate = true
        // if user interval
        if(d.interval){
          data[i][d._path.interval] = String(new Date().getTime())
          // send msg để thông báo rằng kiểm tra lỗi, và thời điểm kiểm tra tiếp theo
        }
        // if not, remove
        else{
          telegramSendText(d.tid, '<b>Đã xảy ra lỗi</b>\nCó thể là mã vận đơn không đúng.\nĐơn hàng sẽ được xoá khỏi hệ thống.')
          for(const j in data[i]) data[i][j] = ''
        }
      }
      console.log({
        dvvc: 'jt',
        ...d,
        ...track
      })
    }catch(e){ console.warn(e) }
  }

  if(anyUpdate){
    data = prettifyRow(data)
    if(data.length){
      console.log('Set Sheet Value:')
      console.log(data)
      ss.getRange(2, 1, ss.getLastRow()-1, ss.getLastColumn()).clearContent()
      ss.getRange(2, 1, data.length, data[0].length).setValues(data)
    }
  }

}




function ghn(){
  function ghn_pc(data){
    if(data != null){
      data = ' - <code> ' + data + ' </code>'
    }else{
      data = ' '
    }
    return data
  }

  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('ghn')
  var lastRow = sheet.getLastRow()

  for(i=2; i<=lastRow; i++){
    var sd = sheet.getRange('A'+i+':F'+i).getValues()
    if(
      sd[0][0] != '' &&
      ( (sd[0][5] && new Date().getTime() >= (new Date(sd[0][5]).getTime() + 3600000)) || (sd[0][5] == '') )
    ){
      var res = main('ghn', sd[0][0])
      if(res.valid == true){
        sheet.getRange('F'+i).setValue('')

        var status = '', time = '', data = [], last = [], r = []
        res = JSON.parse(res.content)
        status = res["data"]["order_info"]["status"]
        data = res["data"]["tracking_logs"]
        last = data[data.length - 1]
        r = [
          last["status_name"],
          last["location"]["address"],
          last["executor"]["name"],
          last["executor"]["phone"],
          last["action_at"]
        ]
        time = Utilities.formatDate(new Date(r[4]), 'GMT+7', 'HH:mm:ss - dd/MM/yyyy')
        
        console.log({
          status,
          r,
          time
        })

        if(time != sd[0][3]){
          telegramSendText(sd[0][1], '<b>Đơn hàng: ' + sd[0][2] + '</b>\nĐVVC: Giao hàng nhanh\nMã vận đơn <code> ' + sd[0][0] + ' </code>')
          var trackKey = {
            "inline_keyboard": [
              [{
                "text": "Xem toàn bộ",
                "url": "https://donhang.ghn.vn/?order_code="+sd[0][0]
              }],
            ]
          }
          if(status == 'delivered' || status == 'cancel'){
            telegramSendText(sd[0][1], time + '\n' + r[0] + '\n' + r[2] + ghn_pc(r[3]) + '\n\nĐơn hàng sẽ được tự động xoá khỏi hệ thống.', trackKey)
            sheet.getRange('A'+i+':F'+i).clearContent()
          }else{
            var result = time + '\n' + r[0] + ': ' + r[1] + '\n' + r[2] + ghn_pc(r[3])
            telegramSendText(sd[0][1], result, trackKey)
            sheet.getRange('D'+i).setValue(time)
            sheet.getRange('E'+i).setValue(result)
          }
        }

      }else{
        if(sd[0][5]){
          sheet.getRange('F'+i).setValue(new Date().getTime())
        }else{
          telegramSendText(sd[0][1], '<b>Đã xảy ra lỗi</b>\nCó thể là mã vận đơn không đúng.\nĐơn hàng sẽ được xoá khỏi hệ thống.')
          sheet.getRange('A'+i+':F'+i).clearContent()
        }
      }
    }
  }
}




function best(){
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('best')
  var lastRow = sheet.getLastRow()

  for(i=2; i<=lastRow; i++){
    var sd = sheet.getRange('A'+i+':F'+i).getValues()
    if(
      sd[0][0] != '' &&
      ( (sd[0][5] && new Date().getTime() >= (new Date(sd[0][5]).getTime() + 3600000)) || (sd[0][5] == '') )
    ){
      var res = main('best', sd[0][0])
      if(res.valid == true){
        var time = '', content = ''
        sheet.getRange('F'+i).setValue('')
        const $ = Cheerio.load('<html><body>'+res.content+'</body></html>')
        content = $('ul:first-child li:first-child div:last-child').text()
        time = $('ul:first-child li:first-child div:last-child i:last-child').text()
        if(time)
          content = content.replace(time, '')
        content = prettifyString(content)

        if(time && time != sd[0][3]){
          telegramSendText(sd[0][1], `<b>Đơn hàng: ${sd[0][2] ? sd[0][2] : sd[0][0]}</b>\nĐVVC: ${ALL_LIST.best}\nMã vận đơn <code> ${sd[0][0]} </code>`)
          var trackKey = {
            "inline_keyboard": [
              [{
                "text": "Xem toàn bộ",
                "url": ALL_URL('best', sd[0][0])
              }],
            ]
          }
          // auto delete after delivered
          if(stringMatch(content, 'giaohangthanhcong')){
            telegramSendText(sd[0][1], `<b>${time}</b>\n${content}\n\nĐơn hàng sẽ được tự động xoá khỏi hệ thống.`, trackKey)
            sheet.getRange('A'+i+':F'+i).clearContent()
          }
          // send detail
          else{
            telegramSendText(sd[0][1], `<b>${time}</b>\n${content}`, trackKey)
            sheet.getRange('D'+i).setValue(time)
            sheet.getRange('E'+i).setValue(content)
          }
        }
      }else{
        if(sd[0][5]){
          sheet.getRange('F'+i).setValue(new Date().getTime())
        }else{
          telegramSendText(sd[0][1], '<b>Đã xảy ra lỗi</b>\nCó thể là mã vận đơn không đúng.\nĐơn hàng sẽ được xoá khỏi hệ thống.')
          sheet.getRange('A'+i+':F'+i).clearContent()
        }
      }
    }
  }
}



function tracktry(carrier){
  var carrier_code = '', carrier_name = '', carrier_url = false

  function track_url(_url, code){
    if(_url === true){
      return TRACKTRY_LIST[carrier][2](code)
    }else{
      return 'https://www.tracktry.com/track/'+code+'/'+carrier_code
    }
  }

  function track(){
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(carrier)
    var lastRow = sheet.getLastRow()
    for(i=2; i<=lastRow; i++){
      var sd = sheet.getRange('A'+i+':F'+i).getValues()
      if(
        sd[0][0] != '' &&
        ( (sd[0][5] && new Date().getTime() >= (new Date(sd[0][5]).getTime() + 3600000)) || (sd[0][5] == '') )
      ){
        var res = main(carrier, sd[0][0])
        logFile(res)

        if(res.valid == true){
          res = res.content

          // Valid Data
          if(res["data"] && res["data"]["items"][0] && res["data"]["items"][0]["lastUpdateTime"] && res["data"]["items"][0]["lastEvent"]){
            sheet.getRange('F'+i).setValue('')

            var time = new Date(res["data"]["items"][0]["lastUpdateTime"]).getTime()
            time = Utilities.formatDate(new Date(time+7*3600000), 'GMT+7', 'HH:mm:ss - dd/MM/yyyy')

            // something new
            if(time != sd[0][3]){
              telegramSendText(sd[0][1], '<b>Đơn hàng: ' + sd[0][2] + '</b>\nĐVVC: ' + carrier_name + '\nMã vận đơn <code> ' + sd[0][0] + ' </code>')
              var trackKey = {
                "inline_keyboard": [
                  [{
                    "text": "Xem toàn bộ",
                    "url": track_url(carrier_url, sd[0][0])
                  }]
                ]
              }
              if(res["data"]["items"][0]["status"] == 'delivered' || stringMatch(res["data"]["items"][0]["lastEvent"], 'giaothanhcong') == true){
                telegramSendText(sd[0][1], '<b>' + time + '</b>\n' + res["data"]["items"][0]["lastEvent"] + '\n\nĐơn hàng sẽ được tự động xoá khỏi hệ thống.', trackKey)
                sheet.getRange('A'+i+':F'+i).clearContent()
              }else{
                telegramSendText(sd[0][1], '<b>' + time + '</b>\n' + res["data"]["items"][0]["lastEvent"], trackKey)
                sheet.getRange('D'+i).setValue(time)
                sheet.getRange('E'+i).setValue(time + '\n' + res["data"]["items"][0]["lastEvent"])
              }
              SOC_SYNC.sync(carrier, res["data"]["items"][0]["lastEvent"])
            }

          }
          
          // Invalid Data
          else{
            sheet.getRange('F'+i).setValue(new Date().getTime())
            var trackKey = {
              "inline_keyboard": [
                [{
                  "text": "Xem tại web",
                  "url": track_url(carrier_url, sd[0][0])
                }]
              ]
            }
            telegramSendText(sd[0][1], '<b>Đã xảy ra lỗi</b>\nHệ thống sẽ tự động kiểm tra lại sau 60p\n------\n<b>Đơn hàng: ' + sd[0][2] + '</b>\nĐVVC: ' + carrier_name + '\nMã vận đơn <code> ' + sd[0][0] + ' </code>', trackKey)
          }
          
        }else{
          if(sd[0][5]){
            sheet.getRange('F'+i).setValue(new Date().getTime())
          }else{
            telegramSendText(sd[0][1], '<b>Đã xảy ra lỗi</b>\nCó thể là mã vận đơn không đúng.\nĐơn hàng sẽ được xoá khỏi hệ thống.')
            sheet.getRange('A'+i+':F'+i).clearContent()
          }
        }
      }
    }
  }

  if(carrier){
    carrier_code = TRACKTRY_LIST[carrier][0]
    carrier_name = TRACKTRY_LIST[carrier][1]
    if(TRACKTRY_LIST[carrier][2] !== undefined){
      carrier_url = true
    }else{
      carrier_url = false
    }
    track()
  }else{
    for(i in TRACKTRY_LIST){
      carrier = i
      carrier_code = TRACKTRY_LIST[carrier][0]
      carrier_name = TRACKTRY_LIST[carrier][1]
      if(TRACKTRY_LIST[carrier][2] !== undefined)
        carrier_url = true
      else
        carrier_url = false
      track()
    }
  }

}









function _17track(Carrier){
  var retry = 0

  function track_url(url, _carrier, code){
    if(url === true){
      return _17TRACK_LIST[_carrier]['url'](code)
    }else{
      return 'https://t.17track.net/en#nums='+code
    }
  }

  function track(carrier, carrier_code, carrier_name, carrier_url){
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(carrier)
    var lastRow = sheet.getLastRow()
    for(i=2; i<=lastRow; i++){
      var sd = sheet.getRange('A'+i+':F'+i).getValues()
      if(
        sd[0][0] != '' &&
        ( (sd[0][5] && new Date().getTime() >= (new Date(sd[0][5]).getTime() + 3600000)) || (sd[0][5] == '') )
      ){
        var res = main(carrier, sd[0][0])

        if(res.valid == true){
          res = res.content
          if(res["ret"] == 1 && res["msg"] == "Ok" && res["dat"] && res["dat"].length > 0 && res['dat'][0]["track"] && res['dat'][0]["track"]["z0"]){
            var resTime = res['dat'][0]["track"]["zex"]
            res = res['dat'][0]["track"]["z0"]
            sheet.getRange('F'+i).setValue('')

            var time = new Date(res["a"])
            time = Utilities.formatDate(new Date(time.getTime()-3600000), 'GMT+7', 'HH:mm - dd/MM/yyyy')
            if(time != sd[0][3]){
              telegramSendText(sd[0][1], '<b>Đơn hàng: ' + sd[0][2] + '</b>\nĐVVC: ' + carrier_name + '\nMã vận đơn <code> ' + sd[0][0] + ' </code>')
              var trackKey = {
                "inline_keyboard": [
                  [{
                    "text": "Xem toàn bộ",
                    "url": track_url(carrier_url, carrier, sd[0][0])
                  }]
                ]
              }
              if(resTime["dtD"] && resTime["dtD"] > 0 && new Date(resTime["dtD"]-7*3600*1000).getTime() <= new Date().getTime()){
                telegramSendText(sd[0][1], '<b>' + time + '</b>\n' + res["z"] + '\n\nĐơn hàng sẽ được tự động xoá khỏi hệ thống.', trackKey)
                sheet.getRange('A'+i+':F'+i).clearContent()
              }else{
                telegramSendText(sd[0][1], '<b>' + time + '</b>\n' + res["z"], trackKey)
                sheet.getRange('D'+i).setValue(time)
                sheet.getRange('E'+i).setValue(time + '\n' + res["z"])
              }
            }
          }else{
            if(res["ret"] != 1){
              telegramSendText('1009888713', '<b>Cookie cho 17track đã hết hạn!</b>\nVui lòng cập nhật cookie')
            }else if(retry < 2){
              retry++
              track(carrier, carrier_code, carrier_name, carrier_url)
              break
            }
            sheet.getRange('F'+i).setValue(new Date().getTime())
            var trackKey = {
              "inline_keyboard": [
                [{
                  "text": "Xem tại web",
                  "url": track_url(carrier_url, carrier, sd[0][0])
                }]
              ]
            }
            telegramSendText(sd[0][1], '<b>Đã xảy ra lỗi</b>\nHệ thống sẽ tự động kiểm tra lại sau 60p\n------\n<b>Đơn hàng: ' + sd[0][2] + '</b>\nĐVVC: ' + carrier_name + '\nMã vận đơn <code> ' + sd[0][0] + ' </code>', trackKey)
          }
        }else{
          if(sd[0][5]){
            sheet.getRange('F'+i).setValue(new Date().getTime())
          }else{
            telegramSendText(sd[0][1], '<b>Đã xảy ra lỗi</b>\nCó thể là mã vận đơn không đúng.\nĐơn hàng sẽ được xoá khỏi hệ thống.')
            sheet.getRange('A'+i+':F'+i).clearContent()
          }
        }
      }
    }
  }


  if(Carrier){
    var url = false
    if(_17TRACK_LIST[Carrier]['url'])
      url = true
    track(Carrier, _17TRACK_LIST[Carrier]['fc'], _17TRACK_LIST[Carrier]['name'], url)
  }else{
    for(i in _17TRACK_LIST){
      var url = false
      if(_17TRACK_LIST[i]['url'])
        url = true
      track(i, _17TRACK_LIST[i]['fc'], _17TRACK_LIST[i]['name'], url)
      retry = 0
    }
  }

}












function telegramSendText(chatId, text, keyBoard) {
  var data = {
    method: "post",
    muteHttpExceptions: true,
    payload: {
      method: "sendMessage",
      chat_id: String(chatId),
      text: text,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyBoard)
    }
  }
  var token = encodeURI(NHT_TOKEN['telegramBot']['NgyunThaiBot'])
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/', data)
  return JSON.parse(res.getContentText()).ok
}

function convertContent(data){
  while(data.indexOf('<') >= 0){
    var n = data.indexOf('<');
    var n_ = data.indexOf('>');
    data = data.substring(0, n) + data.substring(n_ + 1, data.length)
  }

  //Bỏ khoảng trắng dư
  data = data.replace(/\s+/g, ' ');
  if(data.indexOf(' ') == 0){data = data.substring(1, data.length);}
  if(data.lastIndexOf(' ') + 1 == data.length){data = data.substring(0, data.length - 1);}

  return data;
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  var resCode = callSendAPI(messageData);
  return resCode;
}






function fdjf(){
  var f = {
    dt: 1634743800000,
    dtD: 1635442260000,
    dtL: 1635442260000,
    dtP: 1635410940000,
    dtS: 1634743800000
  }

  for(i in f){
    var d = new Date(f[i]).getTime()
    console.log(Utilities.formatDate(new Date(d-3600*7*1000), 'GMT+7', 'dd/MM/yyyy - HH:mm:ss'))
  }
}