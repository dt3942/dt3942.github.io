//Discover Scanners Via Seial 
async  function Discover_Scanenrs_Serial(){

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

async function Connect_Device_Serial(){
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
              console.log('Recived:', Array.from(buffer).map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' '));


              if(firmware_update==true){
                processFirmwareUpdateSerial(buffer);
              }
              else if(DeviceInfoUpdate){
                Responce_DeviceInfo_Update_Serial(buffer);
              }
              else if(UpdateDeviceConfigurations){
                Update_Device_Config_Responce_USB(data,reportId);
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