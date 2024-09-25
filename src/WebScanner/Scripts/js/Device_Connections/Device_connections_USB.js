  /********************************************************************* 
*                       
*  Filename           :  Device-Connections_USB.js     
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
// Discover Scanners Via USB

let ScannerIndex;
async function Discover_Scanenrs_USB(){
    try {
        devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: 0x05e0 }]  
    });
       console.log(devices);
      if (devices.length === 0) {
          throw new Error('No devices found');
      }
      else if((devices.length === 1) ){
        
        DeviceDropdown.innerHTML = '';
        const collection=devices[0].collections[0];

        if((collection.usage==3584 |collection.usagePage==65294) & devices[0].vendorId==1504){
           Connected_device=USB_SNAPI;
           const option = document.createElement('option');
           option.value = 0;
           option.text = `USB-SNAPI Zebra Scanner`;
           DeviceDropdown.appendChild(option);
        } 
        
        else if((collection.usage==6 |collection.usagePage==1) & devices[0].vendorId==1504){
          Connected_device=USB_HIDKB;
          const option = document.createElement('option');
          option.value = 0;
          option.text = `USB-HIDKB Zebra Scanner`;
          DeviceDropdown.appendChild(option);
       }  


      }
      else{
  
      DeviceDropdown.innerHTML = '';
      devices.forEach(async (device, index) => {
          const collection=device.collections[0];

          if((collection.usage==3584 & collection.usagePage==65298 ) & device.vendorId==1504){
             Connected_device=USB_HIDKB_CMP;
             const option = document.createElement('option');
             option.value = index;
             option.text = `USB-HIDKB CMP Zebra Scanner`;
             DeviceDropdown.appendChild(option);
            
          }

          else if((collection.usage==19200 & collection.usagePage==65349 ) & device.vendorId==1504){
            Connected_device=USB_IBMHID;
            const option = document.createElement('option');
            option.value = index;
            option.text = `USB-IBMHID Zebra Scanner`;
            DeviceDropdown.appendChild(option);
            
         }

        
      });
    }

      if(Connected_device == USB_SNAPI  | Connected_device == USB_HIDKB_CMP | Connected_device == USB_HIDKB | Connected_device == USB_IBMHID  ){
        Connect_button.disabled = false;
        DeviceDropdown.style.display = 'block';
      
      }
      else{
        WebScannerAlert("Selected Scanner is not supported !");
      }
   
      
  } catch (error) {
    WebScannerAlert(`Failed to discover devices: ${error.message}`); 
  }
}

//Connect to device via USB------------------------------------------

async function Connect_Device_USB(){

  
    try {
      if( Connected_device == USB_HIDKB | Connected_device == USB_IBMHID  ){
          WebScannerAlert(`No command interface detected in the scanner ${Connected_device}`);
          return;
      }
     
        const dropdown = document.getElementById('device-dropdown');
        const selectedDeviceIndex = dropdown.value;
  
        if (!devices[selectedDeviceIndex]) {
            throw new Error('Selected device not available');
        }

    
        if (devices.length === 1){
          device =devices[0];
          await device.open(); 
          device.addEventListener('inputreport', handleInputReport);
          statup();
          EnableButtons();  
        }
        else {
          device =devices[selectedDeviceIndex];
          await device.open(); 
          device.addEventListener('inputreport', handleInputReport);
          statup();
          EnableButtons();
        }
          
        
    
    } catch (error) {
        WebScannerAlert( `Failed to connect to device: ${error.message}`);
    }

}

//Handle Interrupt Report-----------------------------------------------------------------------------------
function handleInputReport(event){
 
    const { data, reportId } = event;
    console.log("Data Recived(USB):",reportId);
    printDataViewContent(data);

    if(firmware_update){
      
      processFirmwareUpdate(data,reportId);
    }
    else if(DeviceInfoUpdate){
      Responce_DeviceInfo_Update(data,reportId);
    }

    else if(UpdateDeviceConfigurations){
      Update_Device_Config_Responce_USB(data,reportId);
    }
  
    else if(get_value_response && reportId == 0x27){     
       get_value_response = false;
       ProcessGetRSMCommandsUSB(data);
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