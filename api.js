//https://script.google.com/macros/s/AKfycbyCbVnx0UhAt25F2K4RcRf9znOCUW0aUI2VmRyOlQ/exec

function doGet(e) {
  function stripQuotes( value ) {
    return value.replace(/^["']|['"]$/g, "");
  }
  var result = 'Ok'
  if (e.parameter == 'undefined') {
    result = 'No Parameters';
  }else {
    for (var param in e.parameter) {
      var value = stripQuotes(e.parameter[param]);
      switch (param) {
        case 'jt':
          jt()
          break;
        case 'ghn':
          ghn()
          break;
        case 'tracktry':
          tracktry(value)
          break;
        case 'bestexpress': case 'ninjavan': case 'vnpost': case 'viettelpost': case 'spx':
          tracktry(param)
          break;

        case 'check':
          var r = JSON.parse(value)
          result = JSON.stringify(main(r.dvvc, r.mavandon))
          break
        case 'add':
          var d = JSON.parse(value)
          addVD(d.id, d.dvvc, d.mavandon, d.tendonhang, d.interval)
          break
        case 'getAll':
          getAll(value)
          break
        case 'delete':
          var d = JSON.parse(value)
          result = deleteVD(d.dvvc, d.mavandon)
          break
        default:
          result = "unsupported parameter";
      }
    }
  }
  return ContentService.createTextOutput(result);
}