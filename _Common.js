const DEBUG = false

const SHEET_ID = '1TSsV-sCAXCbnb8uZoY06rOeUTQLXtNOxzaVoLx_UJ2c'

var NHT_TOKEN = JSON.parse(DriveApp.getFileById('1IL_jU6oa2O-MbquaONGBOv1wVdJ1B98d').getBlob().getDataAsString())



var ALL_COURIERS = [
    /*{
        // 'vnems': 'VietNam EMS',
    },*/
    {
        id: ['vnpost'],
        name: 'VietNam Post',
        url: (code) => 'http://www.vnpost.vn/en-us/dinh-vi/buu-pham?key=' + code,
        trackFunction: tracktry
    },
    {
        id: ['njv', 'ninjavan'],
        name: 'NinjaVan',
        url: (code) => 'https://www.ninjavan.co/vi-vn/tracking?id=' + code,
        trackFunction: tracktry
    },
    {
        id: ['vtp', 'viettelpost'],
        name: 'Viettel Post',
        url: (code) => 'https://www.tracktry.com/couriers/viettelpost/' + code,
        trackFunction: tracktry
    },
    {
        id: ['spx'],
        name: 'Shopee Express',
        url: (code) => 'https://www.tracktry.com/couriers/spx-vn/' + code,
        trackFunction: tracktry
    },
    {
        id: ['ghn'],
        name: 'Giao Hàng Nhanh',
        url: (code) => 'https://donhang.ghn.vn/?order_code=' + code,
        trackFunction: ghn
    },
    {
        id: ['jt'],
        name: 'J&T Express',
        url: (code) => 'https://jtexpress.vn/track?billcodes=' + code,
        trackFunction: jt
    },
    {
        id: ['best', 'bestexpress'],
        name: 'Best Express',
        url: (code) => 'https://best-inc.vn/track?bills=' + code,
        trackFunction: best
    }
]


/**
 * List of id and name of all couriers supported
 */
var ALL_LIST = {}
for (const i in ALL_COURIERS) {
    for (const j in ALL_COURIERS[ i ].id) {
        ALL_LIST[ ALL_COURIERS[ i ].id[ j ] ] = ALL_COURIERS[ i ].name
    }
}


/**
 * Get direct tracking link of a courier
 * @param {string} dvvc courier id
 * @param {string} code tracking code
 * @return {string}
 */
function ALL_URL(dvvc, code) {
    if(!dvvc || !code) return ''
    for (const i in ALL_COURIERS) {
        if (ALL_COURIERS[ i ].id.includes(dvvc)) {
            return ALL_COURIERS[ i ].url(code)
        }
    }
    return ''
}



var _17TRACK_LIST = {
    /*
    ninjavan: {
      fc: 100129,
      url: function(code){return 'https://www.ninjavan.co/en-vn/tracking?id='+code},
      name: 'Ninjavan'
    },
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




var TRACKTRY_LIST = {
    /*
    'bestexpress': [
      '800best',
      'Best Express',
      function(code){return 'https://best-inc.vn/track?bills='+code}
    ],
    */
    'ninjavan': [
        'ninjavan-vn',
        'Ninjavan',
        function (code) { return 'https://www.ninjavan.co/vi-vn/tracking?id=' + code }
    ],
    'vnpost': [
        'vietnam-post',
        'VietNam Post',
        function (code) { return 'http://www.vnpost.vn/en-us/dinh-vi/buu-pham?key=' + code }
    ],
    'viettelpost': [ 'viettelpost', 'ViettelPost' ],
    'spx': [ 'spx-vn', 'Shopee Express' ]
}





/**
 * Send text meesage to a Telegram user, group, channel by NgyunThaiBot
 * @param {string} chatId Telegram chat id
 * @param {string} text Text message
 * @param {{}} keyBoard Inline keyboard
 * @return {Boolean} true if success
 */
function telegramSendText(chatId, text, keyBoard) {
    let data = {
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
    let token = encodeURI(NHT_TOKEN[ 'telegramBot' ][ 'NgyunThaiBot' ])
    let res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/', data)
    return JSON.parse(res.getContentText()).ok
}



/**
 * Save JSON Object to a txt file in Google Drive
 * @param {{}} content JSON Object to log
 * @return {void}
 */
function logFile(content) {
    if (DEBUG){
        DriveApp.getFolderById('10AeDHITThqcOowgHpEAXeWtuFwo3I4DZ').createFile(Utilities.formatDate(new Date(), 'GMT+7', 'ddMMyyyy_HHmmss') + '.txt', JSON.stringify(content))
    }
}


/**
 * Convert a string to raw and match
 * @param {string} str string to match
 * @param {string} mstr match string
 * @returns {Boolean} true if match
 */
function stringMatch(str, mstr) {
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
    if (str.indexOf(mstr) >= 0) {
        return true
    } else {
        return false
    }
}


/**
 * Remove bad spaces
 * @param {string} str string to prettify
 * @returns {string} prettified string
 */
function prettifyString(str) {
    return str.replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^\s+/g, '')
        .replace(/(\s+)$/g, '')
}

/**
 * Remove empty empty array
 * @param {[][]} row 
 * @returns {[][]} row
 */
function prettifyRow(row = [ [] ]) {
    let newRow = []
    for (const i in row) {
        if (row[ i ] && Array.isArray(row[ i ]) && row[ i ].length) {
            newRow.push(row[ i ])
        }
    }
    return newRow
}