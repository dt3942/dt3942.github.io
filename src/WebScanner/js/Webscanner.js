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
let SerialPort;
let SerialWriter;
let startwebscanner=true;
let firmware_update=false;
let switchHostmodeEnable=false;
let BleDevice;
let CommadResposeType=0;
let CurrentHostMode;
let DeviceInfoUpdate=false;
let ACK_attstore=true;
//Constants
const USB_HID='1';
const SERIAL= '2';
const BLUETOOTH='3';
const STARTUP_PARAMETER=533;

const SNAPI=0x09;
const HIDKB=0x03;
const IBMHID=0x03;
const CDC=0x03;
const SSI=0x03;
const IBMTT=0x03;
const OPOS=0x03;

 
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
const DeviceDropdown = document.getElementById('device-dropdown');
const SwitchHostButton = document.getElementById('switch-host-button');
const HostVarientDropdown = document.getElementById('host-varient-dropdown');
const RebootButton = document.getElementById('reboot');
const FilePathScandef = document.getElementById('filePath2');
const FileInputScandef = document.getElementById('fileInput2');



//Inilitize components-------------------------------------------------------------------------
Connect_button.disabled = true;
Discover_button.disabled = true;
setValueButton.disabled = true;
storeValueButton.disabled= true;
getValueButton.disabled = true;
fwUpdateButton.disabled = true;
fwLaunchButton.disabled = true;
fwAbortButton.disabled = true;
HostVarientDropdown.disabled = true;
SwitchHostButton.disabled = true;
RebootButton.disabled = true;

// Tab handling ------------------------------------------------------------------------------=

function openTab(event, tabName) {

  var tabContent = document.getElementsByClassName("tab-content");
  for (var i = 0; i < tabContent.length; i++) {
    tabContent[i].style.display = "none";
  }

  var tabButtons = document.getElementsByClassName("tab-button");
  for (var i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove("active");
  }

  document.getElementById(tabName).style.display = "block";
  event.currentTarget.classList.add("active");
}
document.getElementById('Tab1').style.display = 'block';



// Select Com interface------------------------------------------------------------------------
Com_dropdown.addEventListener('change', async () => {
  com_interface= Com_dropdown.value;
  Discover_button.disabled = false;
});
// Discover HID Devices-------------------------------------------------------------------------
Discover_button.addEventListener('click', async () => {
  
  if(com_interface==USB_HID){
    
    try {
        devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: 0x05e0 }]  
    });
  
      if (devices.length === 0) {
          throw new Error('No devices found');
      }
      else if((devices.length === 1) ){
        console.log(devices);
        DeviceDropdown.innerHTML = '';
        const collection=devices[0].collections[0];
        if((collection.usage==3584 |collection.usage==6) & devices[0].vendorId==1504){
           const option = document.createElement('option');
           option.value = 0;
           option.text = `${devices[0].productName} (${devices[0].vendorId.toString(16)})`;
           DeviceDropdown.appendChild(option);
        }  
      }
      else{
  
      DeviceDropdown.innerHTML = '';
      devices.forEach((device, index) => {
          const collection=device.collections[0];
          if((collection.usage==6 |collection.usage==19200 ) & device.vendorId==1504){
             const option = document.createElement('option');
             option.value = index;
             option.text = `${device.productName} (${device.vendorId.toString(16)})`;
             DeviceDropdown.appendChild(option);
          }
      });
    }
      DeviceDropdown.style.display = 'block';  
      Connect_button.disabled = false;   
      
  } catch (error) {
    WebScannerAlert(`Failed to discover devices: ${error.message}`); 
  }
  }
  else if(com_interface==SERIAL){
    try {
      SerialPort = await navigator.serial.requestPort();
      DeviceDropdown.innerHTML = '';
      const option = document.createElement('option');
      option.value = "1";
      option.text =  "Symbol Barcode scanner";
      DeviceDropdown.appendChild(option);
      Connect_button.disabled = false;

    }catch (error) {
      WebScannerAlert(`Failed to discover devices: ${error.message}`);
  }

  }

  else if(com_interface==BLUETOOTH){

    try {
       BleDevice =navigator.bluetooth.requestDevice({
        filters: [{ name: 'RORO BLE Device' }],
    });
  }

  
  catch{
     console.log("Error");
  }
  console.log(BleDevice)  ;


  }
 
});

// Handle Connect to Selected Device----------------------------------------------------------------------
document.getElementById('connect-button').addEventListener('click', async () => {


if(com_interface==USB_HID){
  try {
    const dropdown = document.getElementById('device-dropdown');
    const selectedDeviceIndex = dropdown.value;
    let deviceName;
   
    if (!devices[selectedDeviceIndex]) {
        throw new Error('Selected device not available');
    }

    if (devices.length === 1){
      device =devices[0];
      await device.open(); 
      document.getElementById('output').innerText = `Connected to ${device.productName}`;
      device.addEventListener('inputreport', handleInputReport);
      statup();
      EnableButtons();  
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
    WebScannerAlert( `Failed to connect to device: ${error.message}`);
}


}else if(com_interface==SERIAL){ 

try{
  await SerialPort.open({ baudRate: 115200 });
  const reader = SerialPort.readable.getReader();
  SerialWriter= SerialPort.writable.getWriter();
  
  statup();
  EnableButtons();
  
  let buffer = new Uint8Array();

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
        console.log('Stream closed.');
        document.getElementById('output').textContent += 'Stream closed.\n';
        break;
    }

    
    buffer = appendBuffer(buffer, value);
    
    if (buffer.length == buffer[0]+2) {
        console.log("Received:", buffer);
        if(firmware_update==true){
          processFirmwareUpdateSerial(buffer);
        }
        else{
        ProcessRSMCommandsSerial(buffer);
        }
        buffer = new Uint8Array(); 
    }
}
  reader.releaseLock();

}catch (error) {
  WebScannerAlert( `Failed to connect to device: ${error.message}`);

}

}
else if(com_interface==BLUETOOTH){


}
else{


}
});

//Handle Interrupt Report-----------------------------------------------------------------------------------
function handleInputReport(event){
 
  const { data, reportId } = event;
  //console.log("Data Recived(USB):");
 // printDataViewContent(data);
  if(firmware_update){
    
    processFirmwareUpdate(data,reportId);
  }
  else if(DeviceInfoUpdate){
    ProcessDeviceInforUpdate(data,reportId);
  }

  else if(get_value_response && reportId == 0x27){     
    get_value_response = false;
  
    ProcessRSMCommands(data);
  }
  else if(data.getUint8(0) == 0x01 && reportId == 0x22){
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
  if(com_interface==USB_HID){
    GetvalueUSB();
  }
  else if(com_interface==SERIAL){
    GetValueSerial();
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
        var value = cells[3].getElementsByTagName('input')[0].value;

        if(com_interface==USB_HID){
          SetValueUSB(id,type,property,value);
        }
        else if(com_interface==SERIAL){
          SetValueSerial(id,type,property,value)
        }
        
    } else {
        alert('Please select a parameter to set value');
    }
});
table.querySelectorAll('tbody tr').forEach(row => {
    row.addEventListener('click', selectRow);
});

// Set Paramert USB-----------------------------------------------------------------------------------------------------

async function SetValueUSB(id,type,property,value){
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
    

}

// Set Paramert USB-----------------------------------------------------------------------------------------------------

function SetValueSerial(id,type,property,value){

}


// Set Paramert USB-----------------------------------------------------------------------------------------------------

async function StoreValueUSB(){

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
   
    try {
       await device.sendReport(reportId, new Uint8Array(data));
       console.log("Request Report sent successfully.");
   } catch (error) {
       console.error("Error sending report:", error);
  }  

}

// Set Paramert USB-----------------------------------------------------------------------------------------------------

function StoreValueSerial(){

}

// Store Parameter ------------------------------------------------------------------------------------------------------
storeValueButton.addEventListener('click',async () => {
  if (selectedRow) {
      const cells = selectedRow.getElementsByTagName('td');
      var id = cells[0].textContent;
      var type = cells[1].textContent;
      var property = cells[2].textContent;
      var value = cells[3].getElementsByTagName('input')[0].value;;
      if(com_interface==USB_HID){

      }
      else if(com_interface==SERIAL){
        
      }
      
      
  
  } else {
      alert('Please select a parameter to store value');
  }
});
table.querySelectorAll('tbody tr').forEach(row => {
  row.addEventListener('click', selectRow);
});

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
  Startloading()
  if(com_interface==USB_HID){
  await Request_parameter(STARTUP_PARAMETER);
  }
  else if(com_interface==SERIAL){
   await Request_parameterSerial(STARTUP_PARAMETER);
  }
}

// Update device info---------------------------------------------------------------------------------------------------------------
function updateDeviceInfo() {
  console.log("Inside device info");

  const requestParams = [
    { id: "scannerModel", param: 534 },
    { id: "serialNum", param: 535 },
    { id: "dom", param: 20012 },
    { id: "firmware", param: 616 },
    { id: "config", param: 15109 },
    { id: "decode-count", param: 15011 },
    { id: "power-count", param: 20000 },
    { id: "battery", param: 20000 },
    { id: "camera", param: 2471 }
  ];



  if (strtup_count > 0 && strtup_count <= requestParams.length) {
    const { id, param } = requestParams[strtup_count - 1];
    document.getElementById(id).innerText = paramValueStr;

    if (com_interface === USB_HID) {
      Request_parameter(param);
    } else {
      Request_parameterSerial(param);
    }

    strtup_count++;
  }

  else if (strtup_count === 10 && paramValueStr !== "N/A") {
    const byteArray = paramValueStr.match(/0x[0-9A-Fa-f]+/g).map(hex => parseInt(hex, 16));
    console.log("Image data:", byteArray);
    drawImageFromByteArray_jpeg(byteArray);
    
    if (com_interface === USB_HID) {
      Request_parameter(5032);
    } else {
      Request_parameterSerial(5032);
    }
    strtup_count++;
    
  }
  else if(strtup_count === 11 && paramValueStr !== "N/A"){
    const byteArray = paramValueStr.match(/0x[0-9A-Fa-f]+/g).map(hex => parseInt(hex, 16));
    UpdateDeviceInfo_FromScandef(byteArray);
    console.log("TR");
    strtup_count = 1;
    startup = false;
    CloseLoading();
    return;


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
  HostVarientDropdown.disabled=false;
  SwitchHostButton.disabled=false;
  RebootButton.disabled=false;
  
}

//Switch Host mode -----------------------------------------------------------------------------------------------------------

SwitchHostButton.addEventListener('click', async () => {
  if(com_interface==USB_HID){
  switchHostMode();
  }
  else if(com_interface==SERIAL){
    switchHostModeSerial();
  }
});

HostVarientDropdown.addEventListener('change', async () => {
  if(HostVarientDropdown.value=='1'){
    CurrentHostMode=IBMHID;
  }
  else if(HostVarientDropdown.value=='2'){
    CurrentHostMode=HIDKB;
  }
  else if(HostVarientDropdown.value=='3'){
    CurrentHostMode=OPOS;
  }
  else if(HostVarientDropdown.value=='4'){
    CurrentHostMode=SNAPI;
  }
  else if(HostVarientDropdown.value=='5'){
    CurrentHostMode=CDC;
  }
  else if(HostVarientDropdown.value=='6'){
    CurrentHostMode=SSI;
  }
  else if(HostVarientDropdown.value=='7'){
    CurrentHostMode=IBMII;
  }
});




document.getElementById('reboot').addEventListener('click', function() {

if(com_interface==USB_HID){
 RebootUSB();


}
else if(com_interface==SERIAL){

RebootSerial();

}
});


FileInputScandef.addEventListener('change', function(event) {
  const filePath = event.target.files[0].name;
  FilePathScandef.value = filePath;
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
      const text = e.target.result;
      const hexStrings = text.split(/\s+/);
      value_Attstore = hexStrings.map(hexString => parseInt(hexString, 16));

  };

  reader.readAsText(file);
  console.log(value_Attstore);
});


document.getElementById('button-send-scandef').addEventListener('click', Sendsandef);


function Sendsandef(){
  DeviceInfoUpdate=true;
  id_Attstore=5032;
  type_Attstorte=65;
  property_Attstore=0x00;
  StoreMultiPacketAttributes(5032,65,0,value_Attstore);
}