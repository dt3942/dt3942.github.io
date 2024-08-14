//______________________________________________________________________________________________________


let device;
let device_connected = false;
let get_value_response = false;
const attribute = new Set();
const editedRows = new Set();
let multy_packet_param=true;
let paramID;
let paramType;
let paramProperty;
let paramTypestr;
let paramPropertyStr;
let paramValue=[];
let paramValueStr;
let multyPacketParam=false;
let param_lenght_cur=0;
let multy_param_offset=false;
let multy_param_offset_res=false;
let offset_count=1;
let startup=true;

//ScanerDetail
let ModelNumber="MP700";
let SerialNumber="h";
let DOM="";
let Firmware="";
let config ="";
let ColorCamera="";




//Update current state of buttons
function updateButtonState(element) {
    const button = document.getElementById(element);
    if (device_connected) {
      button.removeAttribute('disabled');
    } else {
      button.setAttribute('disabled', 'true');
    }
}

//updateButtonState('get-value');
//updateButtonState('set-value');




//----------------------------------------------------------------------------

document.getElementById('discover-button').addEventListener('click', async () => {
  try {
      const devices = await navigator.hid.requestDevice({
          filters: [{ vendorId: 0x05e0 }] // Replace with the correct vendorId
      });

      if (devices.length === 0) {
          throw new Error('No devices found');
      }

       console.log(devices);

      // Populate the dropdown with discovered devices
      const dropdown = document.getElementById('device-dropdown');
      dropdown.innerHTML = ''; // Clear any previous entries
      devices.forEach((device, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.text = `${device.productName} (${device.vendorId.toString(16)})`;
          dropdown.appendChild(option);
      });

      // Display the dropdown and connect button
      dropdown.style.display = 'block';
      
      
  } catch (error) {
      document.getElementById('output').innerText = `Failed to discover devices: ${error.message}`;
  }
});

// Handle Connect to Selected Device
document.getElementById('connect-button').addEventListener('click', async () => {
  try {
      const dropdown = document.getElementById('device-dropdown');
      const selectedDeviceIndex = dropdown.value;
      const devices = await navigator.hid.getDevices();
      
      if (!devices[selectedDeviceIndex]) {
          throw new Error('Selected device not available');
      }

      device = devices[selectedDeviceIndex];
      await device.open();
      device_connected = true;

      document.getElementById('output').innerText = `Connected to ${device.productName}`;
      device.addEventListener('inputreport', handleInputReport);

  } catch (error) {
      document.getElementById('output').innerText = `Failed to connect to device: ${error.message}`;
  }

  statup();
});
//--------------------------------------------------------------------------------------------------
function handleInputReport(event){
  //console.log(event);
  const { data, reportId } = event;
  if(get_value_response && reportId == 0x27){
    get_value_response = false;
  
    processGetValueResponse_updated(data);
  }
  if(data.getUint8(0) == 0x01 && reportId == 0x22){
    processBarcodeData(data);
  }
}
//---------------------------------------------------------------------------------------------------
function processBarcodeData(data){
  let barcodeData = '';
  for (let i = 5; i < 5 + data.getUint8(2) ; i++) {
    barcodeData += String.fromCharCode(data.getUint8(i));
  }
  const barcodeInput = document.getElementById('barcode-data');
  barcodeInput.type = 'text';
  barcodeInput.value = barcodeData;
}
//--------------------------------------------------------------------------------------------------



function update_table(){

    const tableBody = document.querySelector('#idTable tbody');
    const row = document.createElement('tr');
    const cellId = document.createElement('td');
    cellId.textContent = paramID;
    row.appendChild(cellId);

    const cellType = document.createElement('td');
    cellType.textContent =paramTypestr; //`0x${type.toString(16).padStart(2, '0')}`;
    row.appendChild(cellType);

    const cellProperty = document.createElement('td');
    cellProperty.textContent = paramProperty; //`0x${property.toString(16).padStart(2, '0')}`;
    row.appendChild(cellProperty);

    const cellValue = document.createElement('td');
    const inputValue = document.createElement('input');
    inputValue.type = 'text';
    inputValue.value = paramValueStr;
    inputValue.setAttribute('data-id', paramID); // Adding a data attribute for easy identification
    inputValue.addEventListener('change', () => {
      editedRows.add(paramID); // Mark row as edited when value changes
    });
    cellValue.appendChild(inputValue);
    row.appendChild(cellValue);

    tableBody.appendChild(row);

}

//-------------------------------------------------------------------------------------------------

document.getElementById('get-value').addEventListener('click', async () => {
  update_table_status=true;
  if (!device) {
   console.log("Device not connected.");
    return;
  }
  const input = parseInt(document.getElementById('get-value-input').value);
  const byte1 = (input >> 8) & 0xFF;  // Extract the high byte
  const byte2 = input & 0xFF;
  const reportId = 0x0D; // Report ID in hexadecimal
  const data = [
    0x40, 0x00, 0x06, 0x00, 0x06, 0x02, 0x00, 
    byte1, byte2, 0x00, 0x00, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00
  ];

  try {
    get_value_response = true;
    await device.sendReport(reportId, new Uint8Array(data));
    console.log("Request Report sent successfully.");
  } catch (error) {
    console.error("Error sending report:", error);
  }
});

//-----------------------------------------------------------------------------------------------------

document.getElementById('set-value').addEventListener('click', async () => {
  const table = document.getElementById('idTable');
  const rows = table.getElementsByTagName('tr');
  const updatedData = [];

  for (let i = 1; i < rows.length; i++) { // Skipping the header row
      const cells = rows[i].getElementsByTagName('td');
      const id = cells[0].textContent;

      if (editedRows.has(Number(id))) { // Only process edited rows
          const type = cells[1].textContent;
          const property = cells[2].textContent;
          const value = cells[3].getElementsByTagName('input')[0].value;
          updatedData.push({ id, type, property, value });
      }
  }

  if(!updatedData){
    return;
  }

  console.log(updatedData); 
});

// ---------------------------------------------------------------------------

function processGetValueResponse_updated(data){
  console.log("lenght :",data.getUint8(3));
  printDataViewContent(data);
  if(multyPacketParam==false){

  if (data.getUint8(4) == 0x02){

      //Get param id
      const highByte = data.getUint8(6);   
      const lowByte = data.getUint8(7); 
      
       paramID = (highByte << 8) | lowByte;
      if (paramID == 0xffff){
        return;
      }

      paramType = data.getUint8(8);
      paramProperty = data.getUint8(9);

      if(data.getUint8(3) <= 0x1D){ // Single packet param 
          paramValue =copyToHexArray(data, 10,(data.getUint8(3))-8 );
          addDataToTable();
       
      }
      else{  // multy packet params 

          multyPacketParam=true;
          paramValue =copyToHexArray(data, 10,21 );

          if(data.getUint8(3) == 0xF0){
          multy_param_offset=true;
          }
      }
  }

  }else{

      if(multy_param_offset_res==false){

      if(data.getUint8(1)==0x1D){

        paramValue= appendToHexArray(paramValue,data,2,29);
      }
      else{      
          
       
          if(multy_param_offset==true){
          paramValue=appendToHexArray(paramValue,data,2,data.getUint8(1));
          sendACK();
          SendCommandOffset(offset_count);
          offset_count++;
          multy_param_offset_res=true;
          return;
          }
          else{
              
              paramValue=appendToHexArray(paramValue,data,2,data.getUint8(1));
              addDataToTable();
              multyPacketParam=false;
          }
      }

      }
      else{

          if(data.getUint8(4) == 0x04){

           if(data.getUint8(3) == 0xF0){
              
              paramValue=appendToHexArray(paramValue,data,15,16);
              multy_param_offset_res=false;
           }
           else if(data.getUint8(3) <=0x15){
              paramValue=appendToHexArray(paramValue,data,15,data.getUint8(3)-15);
          
              addDataToTable();
              multy_param_offset_res=false;
              multy_param_offset=false;
              multyPacketParam=false;
           }
           else{
              paramValue=appendToHexArray(paramValue,data,15,16);
              multy_param_offset_res=false;
              multy_param_offset=false;
           }

           }

          }
      }
      sendACK();
  }

//-----------------------------------------------------------------------------------------------

function processGetValueResponse_wraper(hexString){

  const byteArray = hexString.split(' ').map(byte => parseInt(byte, 16));
  
  
  const arrayBuffer = new ArrayBuffer(byteArray.length);
  const dataView = new DataView(arrayBuffer);
  
  // Fill the DataView with the byte array
  byteArray.forEach((byte, index) => {
  dataView.setUint8(index, byte);
  });
  
  processGetValueResponse_updated(dataView);
  
  }
  
  //------------------------------------------------------------------------------------------------
  
  async function SendCommandOffset(offset){
    if (!device) {
      console.log("Device not connected.");
      return;
    }
    const msb_paramID = (paramID >> 8) & 0xFF;
    const lsb_paramID = paramID & 0xFF;
    const offset_param=offset*227;
    const msb_offset =(offset_param >> 8) & 0xFF;
    const lsb_offset = offset_param & 0xFF;


    const reportId = 0x0D; // Report ID in hexadecimal
    const data = [
      0x40, 0x00, 0x08, 0x00, 0x08, 0x04, 0x00, 
      msb_paramID, lsb_paramID, msb_offset, lsb_offset, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00
    ];
  
    try {
      get_value_response = true;
      await device.sendReport(reportId, new Uint8Array(data));
      console.log("Offset Report sent successfully :",offset_param);
    } catch (error) {
      console.error("Error sending report:", error);
    }
    
  }
  
  
  function toHex(byte) {
    return '0x' + byte.toString(16).padStart(2, '0').toUpperCase();
}
  
  function copyToHexArray(dataView, start, length) {
      const hexArray = [];
      
      for (let i = 0; i < length; i++) {
        const byte = dataView.getUint8(start + i);
        hexArray.push(toHex(byte));
      }
      
      return hexArray;
    }
  
  //---------------------------------------------------------------------------------------------------
    function appendToHexArray(existingHexArray, newDataView, start, length) {
      const newHexArray = [];
      
      // Convert the new data to hexadecimal
      for (let i = 0; i < length; i++) {
        const byte = newDataView.getUint8(start + i);
        newHexArray.push(toHex(byte));
      }
      
      // Append new hex data to the existing hex array
      return existingHexArray.concat(newHexArray);
    }
    
    
  
  //---------------------------------------------------------------------------------------------------
  function addDataToTable() {

         
          offset_count=1;
          paramPropertyStr=paramProperty;
          paramTypestr= String.fromCharCode(paramType);

          switch(paramTypestr) {

            case 'A':
              paramValue=paramValue.slice(5)
              paramValueStr=paramValue.join(' ');
              break;

            case 'B':
              paramValueStr=hexToUnsignedInt(paramValue[0])
              break;

            case 'C':
              paramValueStr=hexToSignedInt(paramValue[0])
              break;

            case 'D':
              paramValueStr=hexToDWord(paramValue);   
              break;

            case 'F':
              paramValue=paramValue.slice(0,-2)
              paramValueStr=flagval(paramValue)
              
              break;

            case 'I':
              paramValueStr=hexToSWord(paramValue);   
              break;

            case 'L':
              paramValueStr=hexToSDWord(paramValue);   
              break;

            case 'S':
             paramValue=paramValue.slice(4)
             paramValue = paramValue.slice(0, -3);
             paramValueStr=paramValue.map(hex => String.fromCharCode(parseInt(hex, 16))).join('');
             break;

            case 'X':
             paramValueStr=paramValue.map(hex => String.fromCharCode(parseInt(hex, 16))).join(''); 
             break;
 
            case 'W':
            paramValueStr=hexToWord(paramValue);  
            break;
            
            default:
            paramValueStr=paramValue.join(' ');
             
          }

  

          console.log("ID:", paramID, "Type:", paramType, "Property:", paramProperty, "Value:", paramValueStr, "\n");

          if(startup){
           
          updateDeviceInfo(paramID,paramValueStr);
         
          }
          else{
            update_table();

          }

      
  }

  //----------------------------------------------------------------------------------------------------
  function printDataViewContent(dataView) {
    let content = [];
    for (let i = 0; i < dataView.byteLength; i++) {
      let hexValue = dataView.getUint8(i).toString(16).padStart(2, '0'); // Convert to hex and pad with zero if necessary
      content.push(hexValue);
    }
    console.log("DataView Content (Hex):", content.join(' '));
  }

  //-----------------------------------------------------------------------------------------------------

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


  //------------------------------------------------------------------

  function hexToWord(hexArray) {
    if (hexArray.length !== 2) {
      throw new Error("Hex array must have exactly 2 bytes for WORD.");
    }
    const word = (hexArray[0] << 8) | hexArray[1];
    return word.toString();
  }



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



  function hexToDWord(hexArray) {
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
  


function hexToUnsignedInt(hexValue) {
    const unsignedInt = parseInt(hexValue, 16);
    return unsignedInt.toString();
}

function hexToSignedInt(hexValue) {

    const signedInt = parseInt(hexValue, 16);
    const max32BitInt = 0xFFFFFFFF;
    const signed32BitInt = signedInt > 0x7FFFFFFF ? signedInt - max32BitInt - 1 : signedInt;
    return signed32BitInt.toString();
}



function drawImageFromByteArray_jpeg(byteArray) {
  const canvas = document.getElementById('Canvas');
  const context = canvas.getContext('2d');

  const blob = new Blob([new Uint8Array(byteArray)], { type: 'image/jpeg' });

  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = function() {
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    
    // Clean up the object URL
    URL.revokeObjectURL(url);
  };
  img.src = url;
}


// Draw the image on the canvas

async function statup(){
  await Request_parameter(533);

  
}


async function Request_parameter(param_num){

  if (!device) {
    console.log("Device not connected.");
     return;
   }
   const byte1 = (param_num >> 8) & 0xFF;  // Extract the high byte
   const byte2 = param_num & 0xFF;
   const reportId = 0x0D; // Report ID in hexadecimal
   const data = [
     0x40, 0x00, 0x06, 0x00, 0x06, 0x02, 0x00, 
     byte1, byte2, 0x00, 0x00, 0x00, 0x00, 0x00, 
     0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
     0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
     0x00, 0x00, 0x00
   ];
 
   try {
     get_value_response = true;
     await device.sendReport(reportId, new Uint8Array(data));
     console.log("Request Report sent successfully.");
   } catch (error) {
     console.error("Error sending report:", error);
   }
}

function updateDeviceInfo(paramID,paramValueStr){
  
  if(paramID=="2471"){
    const hexArray = paramValueStr.match(/0x[0-9A-Fa-f]+/g);
    const byteArray = hexArray.map(hex => parseInt(hex, 16));
    drawImageFromByteArray_jpeg(byteArray);
    startup=false
    }
    else if(paramID=="533"){
       document.getElementById("scannerModel").innerText =paramValueStr;
       Request_parameter(534);
    }

    else if(paramID=="534"){
      document.getElementById("serialNum").innerText =  paramValueStr;
      Request_parameter(535);
      }

     else if(paramID=="535"){
        document.getElementById("dom").innerText = paramValueStr;
        Request_parameter(20012);
      }

    else if(paramID=="20012"){
        document.getElementById("frimware").innerText =  paramValueStr;
        Request_parameter(616);
    }

    else if(paramID=="616"){
      document.getElementById("config").innerText = paramValueStr;
      Request_parameter(2471);
     
  }

}