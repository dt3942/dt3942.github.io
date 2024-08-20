/********************************************************************* 
*                       
*  Filename           :  Webscanner.js     
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

// Global variables
let device;
let devices;
let com_interface
let barcode_device;
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
let strtup_count=1;
let selectedRow = null;


//Elements
const Connect_button = document.getElementById("connect-button");
const Discover_button = document.getElementById("discover-button");
const Com_dropdown = document.getElementById("com-dropdown");
const table = document.getElementById('idTable');
const setValueButton = document.getElementById('set-value');
const storeValueButton = document.getElementById('store-value');
const getValueButton = document.getElementById('get-value');
const tbody = table.querySelector('tbody');
const fwUpdateButton = document.getElementById('button-update');
const fwLaunchButton = document.getElementById('button-launch');
const fwAbortButton = document.getElementById('button-abort');



//Inilitize components-------------------------------------------------------------------------
Connect_button.disabled = true;
Discover_button.disabled = true;
setValueButton.disabled = true;
storeValueButton.disabled= true;
getValueButton.disabled = true;
fwUpdateButton.disabled = true;
fwLaunchButton.disabled = true;
fwAbortButton.disabled = true;






// Select Com interface------------------------------------------------------------------------
Com_dropdown.addEventListener('change', async () => {
  com_interface= Com_dropdown.value;
  Discover_button.disabled = false;
  console.log(com_interface);

});
// Discover HID Devices-------------------------------------------------------------------------
Discover_button.addEventListener('click', async () => {
  if(com_interface=="1"){
    const dropdown = document.getElementById('device-dropdown');
    try {
        devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: 0x05e0 }]  
    });
  
      if (devices.length === 0) {
          throw new Error('No devices found');
      }
      else if((devices.length === 1) ){
      
        dropdown.innerHTML = '';
        const collection=devices[0].collections[0];
        if(collection.usage==3584 & devices[0].vendorId==1504){
           const option = document.createElement('option');
           option.value = 0;
           option.text = `${devices[0].productName} (${devices[0].vendorId.toString(16)})`;
           dropdown.appendChild(option);
        }  
      }
      else{
  
      dropdown.innerHTML = '';
      devices.forEach((device, index) => {
          const collection=device.collections[0];
          if((collection.usage==6 |collection.usage==19200 ) & device.vendorId==1504){
             const option = document.createElement('option');
             option.value = index;
             option.text = `${device.productName} (${device.vendorId.toString(16)})`;
             dropdown.appendChild(option);
          }
      });
    }
      dropdown.style.display = 'block';  
      Connect_button.disabled = false;   
      
  } catch (error) {
      document.getElementById('output').innerText = `Failed to discover devices: ${error.message}`;
  }
  }
  else if(com_interface=="2"){

  }

  else if(com_interface=="3"){


  }
 
});

// Handle Connect to Selected Device----------------------------------------------------------------------
document.getElementById('connect-button').addEventListener('click', async () => {


if(com_interface=="1"){
  try {
    const dropdown = document.getElementById('device-dropdown');
    const selectedDeviceIndex = dropdown.value;
    let deviceName;
    console.log(selectedDeviceIndex);
    if (!devices[selectedDeviceIndex]) {
        throw new Error('Selected device not available');
    }

    if (devices.length === 1){
      device =devices[0];
      await device.open(); 
      document.getElementById('output').innerText = `Connected to ${device.productName}`;
      device.addEventListener('inputreport', handleInputReport);  
    }
    else {
      devices.forEach((curr_device, index) => {
        const collection=curr_device.collections[0];
        if((collection.usage==3584 | collection.usage==19200) & curr_device.vendorId==1504){
          device = devices[index];
          
        }
        else if(collection.usage==6 & curr_device.vendorId==1504){
          barcode_device= devices[index];
          
        }
    });

    if(barcode_device==null){
      deviceName=device.productName;
    }
    else{
      deviceName=barcode_device.productName;
    }

    await device.open(); 
    document.getElementById('output').innerText ="";   //`Connected to ${deviceName}`;
    device.addEventListener('inputreport', handleCommandInputReport);
    statup();
    EnableButtons();

    }

} catch (error) {
    document.getElementById('output').innerText = `Failed to connect to device: ${error.message}`;
}

}else if(com_interface=="2"){


}
else if(com_interface=="3"){


}
else{


}
});

//Handle Interrupt Report-----------------------------------------------------------------------------------
function handleInputReport(event){
  console.log
  const { data, reportId } = event;
  if(get_value_response && reportId == 0x27){     
    get_value_response = false;
  
    ProcessRSMCommands(data);
  }
  if(data.getUint8(0) == 0x01 && reportId == 0x22){
    processBarcodeData(data);
  }
}
//Process barcode data ------------------------------------------------------------------------------------
function processBarcodeData(data){
  
  let barcodeData = '';
  for (let i = 5; i < 5 + data.getUint8(2) ; i++) {
    barcodeData += String.fromCharCode(data.getUint8(i));
  }
  const barcodeInput = document.getElementById('barcode-data');
  barcodeInput.type = 'text';
  barcodeInput.value = barcodeData;

}

// Handle Interrupt Report for Command Device----------------------------------------------------------------
function handleCommandInputReport(event) {
  const { data, reportId } = event;
  if (get_value_response && reportId == 0x27) {
    get_value_response = false;
   
    ProcessRSMCommands(data);
  }
}

// Handle Interrupt Report for Barcode Device-------------------------------------------------------------------
function handleBarcodeInputReport(event) {
  console.log("barcode \n");
  const { data, reportId } = event;
  printDataViewContent(data);
  if (data.getUint8(0) == 0x01 && reportId == 0x22) {
    processBarcodeData(data);
  }
}
// Update parametertable ---------------------------------------------------------------------------------------
function update_table(){

    const tableBody = document.querySelector('#idTable tbody');
    const row = document.createElement('tr');
    const cellId = document.createElement('td');
    cellId.textContent = paramID;
    row.appendChild(cellId);

    const cellType = document.createElement('td');
    cellType.textContent =paramTypestr; 
    row.appendChild(cellType);

    const cellProperty = document.createElement('td');
    cellProperty.textContent = paramProperty; 
    row.appendChild(cellProperty);

    const cellValue = document.createElement('td');
    const inputValue = document.createElement('input');
    inputValue.type = 'text';
    inputValue.value = paramValueStr;
    inputValue.setAttribute('data-id', paramID); 
    inputValue.addEventListener('change', () => {
      editedRows.add(paramID); 
    });
    cellValue.appendChild(inputValue);
    row.appendChild(cellValue);
    tableBody.appendChild(row);

    row.addEventListener('click', selectRow);

}

//Get Parameter ---------------------------------------------------------------------------------------------

getValueButton.addEventListener('click', async () => {
  update_table_status=true;
  if (!device) {
   console.log("Device not connected.");
   alert("Device is not connected")
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

// Set Parameter ------------------------------------------------------------------------------------------------------

function selectRow(event) {
    document.querySelectorAll('#idTable tbody tr').forEach(row => row.classList.remove('selected'));
    selectedRow = event.currentTarget;
    selectedRow.classList.add('selected');
}

setValueButton.addEventListener('click',async () => {
    if (selectedRow) {
        const cells = selectedRow.getElementsByTagName('td');
        var id = cells[0].textContent;
        var type = cells[1].textContent;
        var property = cells[2].textContent;
        var value = cells[3].getElementsByTagName('input')[0].value;;
       
        
        id = parseInt(id, 10);
        const id_lsb = (id & 0xFF);          
        const id_msb = (id >> 8) & 0xFF;

        type = type.charCodeAt(0);
        type = parseInt(type, 10);
        property = parseInt(property, 10);
      
        let byteArray = [];

       if (type === 70) {
           byteArray = [value & 0xFF];
       }

       let array_len=byteArray.length+8
       const len_lsb = (array_len & 0xFF);          
       const len_msb = (array_len >> 8) & 0xFF;
       const reportId = 0x0D;

       let data = [
        0x40, 0x00, 0x06, len_msb, len_lsb, 0x05, 0x00, 
        id_msb,id_lsb, type, property, 0x00, 0x00, 0x00, 
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00, 0x00, 0x00
      ];

      for (let i = 0; i < byteArray.length; i++) {
        if (11 + i < data.length) {
            data[11 + i] = byteArray[i];
        }else {
            break;
        }
      }
      try {
         await device.sendReport(reportId, new Uint8Array(data));
         console.log("Request Report sent successfully.");
     } catch (error) {
         console.error("Error sending report:", error);
    }
    
    } else {
        alert('Please select a parameter to set value');
    }
});
table.querySelectorAll('tbody tr').forEach(row => {
    row.addEventListener('click', selectRow);
});


// Store Parameter ------------------------------------------------------------------------------------------------------
storeValueButton.addEventListener('click',async () => {
  if (selectedRow) {
      const cells = selectedRow.getElementsByTagName('td');
      var id = cells[0].textContent;
      var type = cells[1].textContent;
      var property = cells[2].textContent;
      var value = cells[3].getElementsByTagName('input')[0].value;;
     
      
      id = parseInt(id, 10);
      const id_lsb = (id & 0xFF);          
      const id_msb = (id >> 8) & 0xFF;

      type = type.charCodeAt(0);
      type = parseInt(type, 10);
      property = parseInt(property, 10);
    
      let byteArray = [];

     if (type === 70) {
         byteArray = [value & 0xFF];
     }

     let array_len=byteArray.length+8
     const len_lsb = (array_len & 0xFF);          
     const len_msb = (array_len >> 8) & 0xFF;
     const reportId = 0x0D;

     let data = [
      0x40, 0x00, 0x06, len_msb, len_lsb, 0x06, 0x00, 
      id_msb,id_lsb, type, property, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00
    ];

    for (let i = 0; i < byteArray.length; i++) {
      if (11 + i < data.length) {
          data[11 + i] = byteArray[i];
      }else {
          break;
      }
    }
    console.log(data);
    try {
       await device.sendReport(reportId, new Uint8Array(data));
       console.log("Request Report sent successfully.");
   } catch (error) {
       console.error("Error sending report:", error);
  }  
  
  } else {
      alert('Please select a parameter to store value');
  }
});
table.querySelectorAll('tbody tr').forEach(row => {
  row.addEventListener('click', selectRow);
});


// Process Parameter Data  ------------------------------------------------------------------------------
function ProcessRSMCommands(data){
 
  printDataViewContent(data);

  if(multyPacketParam==false){

    if (data.getUint8(4) == 0x02){ // Get Parameter value
      console.log("debug");
      const highByte = data.getUint8(6);   
      const lowByte = data.getUint8(7); 
      
       paramID = (highByte << 8) | lowByte;
      if (paramID == 0xffff){
          paramType=90;
          PostProcesssesParameterData();
          return;
      
      }
      paramType = data.getUint8(8);
      paramProperty = data.getUint8(9);

      if(data.getUint8(3) <= 0x1D){  // Single packet Parameter
          paramValue =copyToHexArray(data, 10,(data.getUint8(3))-8 );
          PostProcesssesParameterData(); 
      }
      else{  //Multiple packet parameter
          multyPacketParam=true;
          paramValue =copyToHexArray(data, 10,21 );

          if(data.getUint8(3) == 0xF0){  //Multiple ofsets parameters
              multy_param_offset=true;
          }
      }
  }
  }else{

      if(multy_param_offset_res==false){  //Get multiple packet patermeter offsets(form 2nd packet onwords)

         if(data.getUint8(1)==0x1D){ // Intermediate data of  multiple packet patermeter offsets
            paramValue= appendToHexArray(paramValue,data,2,29);
           }
         else{  

             if(multy_param_offset==true){  // End of data in current offset
                 paramValue=appendToHexArray(paramValue,data,2,data.getUint8(1));
                 sendACK();
                 SendCommandOffset(offset_count);
                 offset_count++;
                 multy_param_offset_res=true;
                 return;
                }
              else{   // End of the offset data
                 paramValue=appendToHexArray(paramValue,data,2,data.getUint8(1));
                 PostProcesssesParameterData();
                 multyPacketParam=false;
          }
      }
      }
      else{  //Get multiple packet patermeter offsets(first packet)

          if(data.getUint8(4) == 0x04){
             if(data.getUint8(3) == 0xF0){
                 paramValue=appendToHexArray(paramValue,data,15,16);
                 multy_param_offset_res=false;
              }
             else if(data.getUint8(3) <=0x15){
                 paramValue=appendToHexArray(paramValue,data,15,data.getUint8(3)-15);
                 PostProcesssesParameterData();
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

  
  // Send offsed command------------------------------------------------------------------------
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
  
  //Append data to hex array------------------------------------------------------------------
    function appendToHexArray(existingHexArray, newDataView, start, length) {
      const newHexArray = [];
      for (let i = 0; i < length; i++) {
        const byte = newDataView.getUint8(start + i);
        newHexArray.push(toHex(byte));
      }
      return existingHexArray.concat(newHexArray);
    }
  
  // Post processes parameter data--------------------------------------------------------------
  function PostProcesssesParameterData() {
    console.log("inside the proceeparamdata \n")
      offset_count=1;
      paramPropertyStr=paramProperty;
      paramTypestr= String.fromCharCode(paramType);
      console.log(paramTypestr);
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
          paramValue=paramValue.slice(0,-2)
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
        case 'Z':
          paramValueStr="N/A" ;
          paramProperty=0;
          paramTypestr="-"; 
          paramID=parseInt(document.getElementById('get-value-input').value);
  
          break;   
        default:
          paramValueStr=paramValue.join(' ');     
      }

      console.log("ID:", paramID, "Type:", paramType, "Property:", paramProperty, "Value:", paramValueStr, "\n");

      if(startup){
         updateDeviceInfo();
      }
      else{
         update_table();
      }
  }

  //Print data view contetent(for debuging)----------------------------------------------------------------------------
  function printDataViewContent(dataView) {
    let content = [];
    for (let i = 0; i < dataView.byteLength; i++) {
      let hexValue = dataView.getUint8(i).toString(16).padStart(2, '0'); // Convert to hex and pad with zero if necessary
      content.push(hexValue);
    }
    console.log("DataView Content (Hex):", content.join(' '));
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
    console.log(hexArray)
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
//Build jepef image form byte data-------------------------------------------------------------------------------------------------
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
    URL.revokeObjectURL(url);
  };
  img.src = url;
}
// Statup(load device information)-------------------------------------------------------------------------------------------------
async function statup(){
  await Request_parameter(533);
}
// Request specific parameter------------------------------------------------------------------------------------------------------
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
// Update device info---------------------------------------------------------------------------------------------------------------
function updateDeviceInfo(){
  console.log("inside devce infor \n")
  console.log(paramValueStr);
  if(strtup_count==10){

    if(paramValueStr !="N/A"){
    const hexArray = paramValueStr.match(/0x[0-9A-Fa-f]+/g);
    const byteArray = hexArray.map(hex => parseInt(hex, 16));
    drawImageFromByteArray_jpeg(byteArray);
    }
    strtup_count=1;
    startup=false
    }
    else if(strtup_count==1){
       document.getElementById("scannerModel").innerText =paramValueStr;
       Request_parameter(534);
       strtup_count++;
    }
    else if(strtup_count==2){
       document.getElementById("serialNum").innerText =  paramValueStr;
       Request_parameter(535);
       strtup_count++;
      }
    else if(strtup_count==3){
       document.getElementById("dom").innerText = paramValueStr;
       Request_parameter(20012);
       strtup_count++;
      }
    else if(strtup_count==4){
       document.getElementById("frimware").innerText =  paramValueStr;
       Request_parameter(616);
       strtup_count++;
    }
    else if(strtup_count==5){
      document.getElementById("config").innerText = paramValueStr;
      Request_parameter(15109);
      strtup_count++;   
  }

    else if(strtup_count==6){
      document.getElementById("decode-count").innerText = paramValueStr;
      Request_parameter(15011); 
      strtup_count++; 
      
   }
    else if(strtup_count==7){
      document.getElementById("power-count").innerText = paramValueStr;
      Request_parameter(30012);  
      strtup_count++;    
   }
   else if(strtup_count==8){
      document.getElementById("battery").innerText = paramValueStr;
      Request_parameter(30012);  
      strtup_count++;    
  }
   else if(strtup_count==9){
      document.getElementById("camera").innerText = paramValueStr;
      Request_parameter(2471);  
      strtup_count++;   
  
}

}
// Enable buttons-----------------------------------------------------------------------------------------------------------
function EnableButtons(){
  setValueButton.disabled = false;
  storeValueButton.disabled = false;
  getValueButton.disabled = false;
  fwUpdateButton.disabled = false;
  fwLaunchButton.disabled = false;
  fwAbortButton.disabled = false;
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

//---------------------------------------------------------------------------------------------------------------------------------------------------