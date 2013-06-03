var util = require('util'),
    fs = require('fs'),
    stream = require('stream');

var dtS = Date.now();
console.log(' * started @ ' + dtS);
var rs = fs.createReadStream('access20.log', { 
    // highWaterMark: 1 * 1024, // 64 * 1024
    flags: 'r',
    encoding: 'utf-8'
  }
)

/////////////
var t = 0, 
    data = '';
    
rs.on('readable', function(){
  // console.log('readable CB #'+(t++));
  var chunk = null; 
  while( (chunk = rs.read()) != null ) {
    data += chunk.toString();
    // console.log(' *chunk: ', chunk, '\n ======================= \n');
    // consume(chunk);
  }
});

rs.on('end', function(){
  var dtE = Date.now();
  console.log(' * end.... @ '+dtE+'\n data.length: '+ Math.floor(data.length/1024)+'kB; @ timed used: ',  dtE - dtS);
  console.log( ' * snippet: ', data.substr(data.length-500, data.length-50));
});

// console.log(' *rs: ', util.inspect(rs, {colors: true}) );
