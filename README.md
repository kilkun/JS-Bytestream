## JS-Bytestream
*A seekable bytestream written in ES6 style Javascript.*

#### Features:
* Reading individual bytes AND bits from a stream
* Reading bytes off-alignment
* Pattern searching with wildcards!
* Read multiple bits/bytes and return them as an array

Needs to be initialized with a Uint8Array.

Example Usage:
```javascript
const inputObject = document.getElementById("ID_OF_INPUT_WITH_TYPE_FILE");
const reader = new FileReader();
let stream = null;

reader.readAsArrayBuffer(inputObject.files[0]);
reader.onload = event => {
  const byteArray = new Uint8Array(event.target.result);
  stream = new ByteStream(byteArray);
}
```
No external documentation as of right now. Luckily there's plenty in the code, and a lot of the functions are straight-forward.
