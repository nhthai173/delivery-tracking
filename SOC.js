const SOC_SYNC = {
  ss: function(sheetName){
    if(sheetName)
      return SpreadsheetApp.openById(SHEET_ID).getSheetByName(sheetName)
    return null
  },
  getData: function(sName){
    var output = []
    if(sName){
      const ss = this.ss(sName)
      if(ss.getLastRow() > 1){
        output = ss.getRange(2, 1, ss.getLastRow()-1, ss.getLastColumn()).getValues()
      }
    }
    return output
  },
  pushData: function(sName, data){
    if(sName && data && Array.isArray(data)){
      const ss = this.ss(sName)
      ss.appendRow(data)
    }
    this.prettifyData(sName)
  },
  prettifyData: function(sName){
    if(sName){
      const ss = this.ss(sName)
      if(ss.getLastRow() > 1){
        var range = ss.getRange(2, 1, ss.getLastRow()-1, ss.getLastColumn())
        var vals = range.getValues()
        if(vals && vals.length){
          vals = vals.sort((a, b) => {
            if(!a[0])
              return 1
            if(!b[0])
              return -1
            if(a[0] && b[0])
              return a[0].localeCompare(b[0])
          })
          range.setValues(vals)
        }
      }
    }
  },
  toJSON: function(data){
    var output = {}
    if(data && data.length && data[0].length){
      data.forEach(sub => {
        if(sub[0]){
          output[sub[0]] = {
            lat: sub[1],
            long: sub[2]
          }
        }
      })
    }
    return output
  },
  sheetParse: function(json){
    var output = []
    if(json && Object.keys(json).length){
      for(const i in json){
        if(json.lat && json.long)
          output.push([i, json.lat, json.long])
        else
          output.push([i, '', ''])
      }
    }
    return output
  },
  sync(carrier = '', data = ''){
    switch(carrier){
      case 'spx':
        this.spx(data)
        break
    }
  },
  spx: function(str){
    var m = str.match(/(?<=\[).+?(?=\])/g)
    if (m && m.length) {
        m = m.map(s => s.trim())
        m = m[0]
        // check duplicate in database
        var oData = this.toJSON(this.getData('spx_SOC'))
        for(const i in oData){
          if(i == m)
            return '' // Duplicated -> stop function
        }
        this.pushData('spx_SOC', [m])
    }
  }
}