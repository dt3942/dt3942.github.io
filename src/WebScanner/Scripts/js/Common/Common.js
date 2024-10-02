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

// Barcode types----------------------------

const barcodeTypes = {
  0x00: "BT_NOT_APP",
  0x01: "BT_CODE_39",
  0x02: "BT_CODABAR",
  0x03: "BT_CODE_128",
  0x04: "BT_D2OF5",
  0x05: "BT_IATA",
  0x06: "BT_I2OF5",
  0x07: "BT_CODE93",
  0x08: "BT_UPCA",
  0x09: "BT_UPCE0",
  0x0A: "BT_EAN8",
  0x0B: "BT_EAN13",
  0x0C: "BT_CODE11",
  0x0D: "BT_CODE49",
  0x0E: "BT_MSI",
  0x0F: "BT_EAN128",
  0x10: "BT_UPCE1",
  0x11: "BT_PDF417",
  0x12: "BT_CODE16K",
  0x13: "BT_C39FULL",
  0x14: "BT_UPCD",
  0x15: "BT_TRIOPTIC",
  0x16: "BT_BOOKLND",
  0x17: "BT_COUPON",
  0x18: "BT_NW7",
  0x19: "BT_ISBT128",
  0x1A: "BT_UPDF",
  0x1B: "BT_DATAMATRIX",
  0x1C: "BT_QR_CODE",
  0x1D: "BT_UPDF_CCA",
  0x1E: "BT_POSTNET_US",
  0x1F: "BT_PLANET",
  0x20: "BT_CODE32",
  0x21: "BT_ISBT128_CON",
  0x22: "BT_JAPAN",
  0x23: "BT_POST_AUSTRA",
  0x24: "BT_POST_DUTCH",
  0x25: "BT_MAXICODE",
  0x26: "BT_POST_CA",
  0x27: "BT_POST_UK",
  0x28: "BT_MPDF",
  0x29: "BT_MACRO_QR_CODE",
  0x2A: "BT_FR_LOT",
  0x2C: "BT_MICRO_QR_CODE",
  0x2D: "BT_AZTEC_CODE",
  0x2E: "BT_AZTEC_RUNE_CODE",
  0x2F: "BT_DISTANCE",
  0x30: "BT_RSS14",
  0x31: "BT_RSS_LIM",
  0x32: "BT_RSS_EXP",
  0x33: "BT_PARAMETER",
  0x34: "BT_4STATE_US",
  0x35: "BT_4STATE_US4",
  0x36: "BT_ISSN",
  0x37: "BT_SCANLET",
  0x38: "BT_CUECODE",
  0x39: "BT_M2OF5",
  0x48: "BT_UPCA_2",
  0x49: "BT_UPCE0_2",
  0x4A: "BT_EAN8_2",
  0x4B: "BT_EAN13_2",
  0x50: "BT_UPCE1_2",
  0x51: "BT_CCA_EAN128",
  0x52: "BT_CCA_EAN13",
  0x53: "BT_CCA_EAN8",
  0x54: "BT_CCA_RSSEXP",
  0x55: "BT_CCA_RSSLIM",
  0x56: "BT_CCA_RSS14",
  0x57: "BT_CCA_UPCA",
  0x58: "BT_CCA_UPCE",
  0x59: "BT_CCC_EAN128",
  0x5A: "BT_TLC39",
  0x61: "BT_CCB_EAN128",
  0x62: "BT_CCB_EAN13",
  0x63: "BT_CCB_EAN8",
  0x64: "BT_CCB_RSSEXP",
  0x65: "BT_CCB_RSSLIM",
  0x66: "BT_CCB_RSS14",
  0x67: "BT_CCB_UPCA",
  0x68: "BT_CCB_UPCE",
  0x69: "BT_SIGNATURE",
  0x6A: "BT_MOA",
  0x70: "BT_PDF417_PARAMETER",
  0x72: "BT_C2OF5",
  0x73: "BT_KOREAN_3OF5",
  0x74: "BT_DATAMATRIX_PARAMETER",
  0x75: "BT_CODEZ",
  0x88: "BT_UPCA_5",
  0x89: "BT_UPCE0_5",
  0x8A: "BT_EAN8_5",
  0x8B: "BT_EAN13_5",
  0x90: "BT_UPCE1_5",
  0x98: "BT_MULTI_BARCODE_SSI_PACKET_TYPE",
  0x99: "BT_PACKETED_SSI_PACKET_TYPE",
  0x9A: "BT_MACRO_UPDF",
  0xA0: "BT_OCRB",
  0xA1: "BT_OCR",
  0xB1: "BT_PARSED_DL",
  0xB2: "BT_PARSED_UID",
  0xB3: "BT_PARSED_NDC",
  0xB4: "BT_DATABAR_COUPON",
  0xB5: "BT_ISO15434",
  0xB6: "BT_PARSED_XML",
  0xB7: "BT_HAN_XIN_CODE",
  0xC0: "BT_CALIBRATION",
  0xC1: "BT_GS1_DATAMATRIX",
  0xC2: "BT_GS1_QR",
  0xC3: "BT_MAILMARK",
  0xC4: "BT_DOTCODE",
  0xC5: "BT_PSTAGE",
  0xC6: "BT_MULTICODE",
  0xC7: "BT_UK_PLESSEY",
  0xC8: "BT_GRID_MATRIX",
  0xC9: "BT_HP_LINK",
  0xCA: "BT_TELEPEN",
  0xCB: "BT_C365",
  0xCC: "BT_UDI_CODE",
  0xCD: "BT_POSTI4S",
  0xFF: "BT_NO_SYMBOLOGY"
};

function getBarcodeType(code) {
  return barcodeTypes[code] || "Unknown barcode type";
}