 /********************************************************************* 
*                       
*  Filename           :  Common.js     
* 
*  Copyright(c)       :  Zebra Technologies, 2024
*   
*  Description        :  ZebraWeb scanner      
* 
*  Author             :  Tharindu Rathnayaka
* 
*  Creation Date      :  2/23/2024 
* 
*  Derived From:      :
* 
*  Edit History:      :  19.08.2024
*        
**********************************************************************/
 
 
 //Convert hex to word (for post processes of parameter data)------------------------------------------------------------
 function hexToWord(hexArray) {
    if (hexArray.length !== 2) {
      throw new Error("Hex array must have exactly 2 bytes for WORD.");
    }
    const word = (hexArray[0] << 8) | hexArray[1];
    return word.toString();
  }
//Convert hex to sword (for post processes of parameter data)------------------------------------------------------------
  function hexToSWord(hexArray) {
    if (hexArray.length !== 2) {
      throw new Error("Hex array must have exactly 2 bytes for SWORD.");
    }
    let value = (hexArray[0] << 8) | hexArray[1];
    if (value & 0x8000) {
      value = value - 0x10000;
    }
    return value.toString();
  }
//Convert hex to Dword (for post processes of parameter data)------------------------------------------------------------
  function hexToDWord(hexArray) {
    console.log(hexArray);
    if (hexArray.length !== 4) {
      throw new Error("Hex array must have exactly 4 bytes for DWORD.");
    }
    const dWord = (
      (hexArray[0] << 24) |
      (hexArray[1] << 16) |
      (hexArray[2] << 8) |
      hexArray[3]
    ) >>> 0;
    return dWord.toString();
  }
//Convert hex to SDword (for post processes of parameter data)------------------------------------------------------------
  function hexToSDWord(hexArray) {
    if (hexArray.length !== 4) {
      throw new Error("Hex array must have exactly 4 bytes for SDWORD.");
    }
    let value = (hexArray[0] << 24) |
                (hexArray[1] << 16) |
                (hexArray[2] << 8) |
                hexArray[3];
    if (value & 0x80000000) {
      value = value - 0x100000000;
    }
    return value.toString();
  }
//Convert hex to flag  value (for post processes of parameter data)---------------------------------------------------------
  function flagval(hexArray) {
    if (hexArray.length !== 1) {
      throw new Error("Hex array must have exactly 1 byte for comparison.");
    }
    const value = hexArray[0];
    if(value==0x01){
      return "True";
    }
      else{
        return "False";
      }
    }
//Convert hex to unsigned int (for post processes of parameter data)------------------------------------------------------------
function hexToUnsignedInt(hexValue) {
    const unsignedInt = parseInt(hexValue, 16);
    return unsignedInt.toString();
}
//Convert hex to signed(for post processes of parameter data)-------------------------------------------------------------------
// string to int ---------------------------------------------------------------------------------------------------------------
function strToUnsignedInt(hexString) {
  return parseInt(hexString, 16);
}

function hexToSignedInt(hexValue) {

    const signedInt = parseInt(hexValue, 16);
    const max32BitInt = 0xFFFFFFFF;
    const signed32BitInt = signedInt > 0x7FFFFFFF ? signedInt - max32BitInt - 1 : signedInt;
    return signed32BitInt.toString();
}
// Hex string to byte array-----------------------------------------------------------------------------------------------
function hexStringToByteArray(hexString) {
  const result = [];
  for (let i = 0; i < hexString.length; i += 2) {
      const byte = parseInt(hexString.substr(i, 2), 16);
      result.push(byte);
  }
  return new Uint8Array(result);
}

  //Convert byte data to hex------------------------------------------------------------------
  function toHex(byte) {
    return '0x' + byte.toString(16).padStart(2, '0').toUpperCase();
}
  // Copy dataview model to hex array--------------------------------------------------------
  function copyToHexArray(dataView, start, length) {
      const hexArray = [];
      
      for (let i = 0; i < length; i++) {
        const byte = dataView.getUint8(start + i);
        hexArray.push(toHex(byte));
      } 
      return hexArray;
    }

     // Copy dataview model to hex array--------------------------------------------------------
  function copyToHexArrayint(dataView, start, length) {
    const hexArray = [];
    
    for (let i = 0; i < length; i++) {
      const byte = dataView[start + i];
      hexArray.push(toHex(byte));
    } 
    return hexArray;
  }
  
  //Append data to hex array------------------------------------------------------------------
    function appendToHexArray(existingHexArray, newDataView, start, length) {
      const newHexArray = [];
      for (let i = 0; i < length; i++) {
        const byte = newDataView.getUint8(start + i);
        newHexArray.push(toHex(byte));
      }
      return existingHexArray.concat(newHexArray);
    }

    // Webscanner allerts -----------------------------------------------------------------------------------------------------
function WebScannerAlert(message) {
    document.querySelector('#custom-alert p.alert-msg').textContent= message;
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('custom-alert').style.display = 'block';
  }
  
  function closeCustomAlert() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('custom-alert').style.display = 'none';
  }

  function Startloading(){
    document.getElementById('loading').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';

  }

  function CloseLoading(){
    document.getElementById('loading').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';


  }
  
  //Append Data to buffter ------------------------------------------------------------------------------------------------------
  function appendBuffer(buffer1, buffer2) {
    let tmp = new Uint8Array(buffer1.length + buffer2.length);
    tmp.set(buffer1, 0);
    tmp.set(buffer2, buffer1.length);
    return tmp;
  }

  // Checksum-------------------------------------------------------------------------------------------------------------------
  function getChecksum(data) {
    let sum = [0x00, 0x00];
    
    for (let i = 0; i < data.length; i++) {
        sum[1] += data[i];
        if (sum[1] > 0xFF) { 
            sum[1] -= 0x100; // Handle overflow by subtracting 256 (0x100)
            sum[0]++; // Increment the upper byte
        }
    }

    // XOR with 0xFF
    let result = new Uint8Array(2);
    result[0] = (sum[0] ^ 0xFF);
    result[1] = (sum[1] ^ 0xFF);
    
    // Handle carry-over when the lower byte is 0xFF
    if (result[1] === 0xFF) {
        result[0] = (result[0] + 1) & 0xFF; // Increment the upper byte
        result[1] = 0x00;
    } else {
        result[1] = (result[1] + 1) & 0xFF; // Increment the lower byte
    }

    return result;
}


  // Send Acknowledgement command-----------------------------------------------------------------------------------------
  async function sendACK() {

    if (!device) {
      console.log("Device not connected.");
      return;
    }
    const data = [
      0x27, 0x01, 0x00];
    try {
      get_value_response = true;
      await device.sendReport(0x01, new Uint8Array(data));
      console.log(" ACK Report sent successfully.");
    } catch (error) {
      console.error("Error sending report:", error);
    }
  }


    //Print data view contetent(for debuging)----------------------------------------------------------------------------
    function printDataViewContent(dataView) {
        let content = [];
        for (let i = 0; i < dataView.byteLength; i++) {
          let hexValue = dataView.getUint8(i).toString(16).padStart(2, '0'); // Convert to hex and pad with zero if necessary
          content.push(hexValue);
        }
        console.log(content.join(' '));
      }


  
  //Conver to abytearray

  function convertToByteArray() {

    if (!xmlContent) {
        alert('No file content loaded!');
        return;
    }
    value_Attstore = [];
    for (let i = 0; i < xmlContent.length; i++) {
        value_Attstore.push(xmlContent.charCodeAt(i));
    }

    const length=value_Attstore.length
    const length_msb = (length >> 8) & 0xFF;  
    const length_lsb = length & 0xFF;
    value_Attstore.unshift(length_msb, length_lsb);
    console.log(value_Attstore);
    
}

//Refressh app

function RefreshApp(){
  DeviceInfoUpdate=false;
  firmware_update=false;
  statup();

}