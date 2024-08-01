let device;
let device_connected = false;
let get_value_response = false;
const attribute = new Set();
const editedRows = new Set();
let multy_packet_param=true;
let paramID;
let paramType;
let paramProperty;
let paramValue=[];
let paramValueStr;

let multyPacketParam=false;
let param_lenght_cur=0;
let multy_param_offset=false;
let multy_param_offset_res=false;
let offset_count=1;


//Update current state of buttons
function updateButtonState(element) {
    const button = document.getElementById(element);
    if (device_connected) {
      button.removeAttribute('disabled');
    } else {
      button.setAttribute('disabled', 'true');
    }
}

updateButtonState('get-value');
updateButtonState('set-value');

document.getElementById('connect-button').addEventListener('click', async () => {
    try {
        const devices = await navigator.hid.requestDevice({
            filters: [{ vendorId: 0x05e0 }] // Replace with the correct vendorId
        });
        if (devices.length === 0) {
            throw new Error('No device selected');
        }
        device = devices[0];
        await device.open();
        device_connected = true;

        updateButtonState('get-value');
        updateButtonState('set-value');
        document.getElementById('output').innerText = 'Connected to barcode scanner';
        device.addEventListener('inputreport',handleInputReport);

    } catch (error) {
        //console.error(error);
        document.getElementById('output').innerText = `Failed to connect to barcode scanner: ${error.message}`;
    }
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

    paramValueStr=paramValue.join(' ');

    const tableBody = document.querySelector('#idTable tbody');
    const row = document.createElement('tr');
    const cellId = document.createElement('td');
    cellId.textContent = paramID;
    row.appendChild(cellId);

    const cellType = document.createElement('td');
    cellType.textContent = paramType;//`0x${type.toString(16).padStart(2, '0')}`;
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

      if(data.getUint8(3) <= 0x15){ // Single packet param 
          paramValue =copyToHexArray(data, 10,(data.getUint8(3))-10 );
          addDataToTable(paramID,paramType,paramProperty,paramValue);
       
      }
      else{  // multy packet params 

          multyPacketParam=true;
          paramValue =copyToHexArray(data, 15,16 );

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
              paramValue=appendToHexArray(paramValue,data,2,data.getUint8(1)-2);
              addDataToTable(paramID,paramType,paramProperty,paramValue);
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
              paramValue=appendToHexArray(paramValue,data,15,data.getUint8(3));
              addDataToTable(paramID,paramType,paramProperty,paramValue);
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
  function addDataToTable(ID, type, property, value) {
  
          console.log("ID:", ID, "Type:", type, "Property:", property, "Value:", value, "\n");
          update_table();
      
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

