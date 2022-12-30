const convert = require('geo-coordinates-parser');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  let converted;
  try {
    converted = convert(line);
    console.log('           [')
    console.log('             ' + converted.decimalLongitude + ',')
    console.log('             ' + converted.decimalLatitude)
    console.log('           ],')
  }
  catch (e) {
    console.log(e)
    /*we get here if the string is not valid coordinates or format is inconsistent between lat and long*/
  }
});

rl.once('close', () => {
     // end of input
});
