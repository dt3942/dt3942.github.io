// Discover Scanners Via BVuetooth---------------------------
async function Discover_Scanenrs_Bluetooth(){
    
    try {
        BleDevice =navigator.bluetooth.requestDevice({
         filters: [{ name: 'RORO BLE Device' }],
     });
   }
   catch{
      console.log("Error");
   }
}

// Connnect to device via Bluetooth---------------------------
async function Connect_Device_Bluetooth(){

WebScannerAlert('Failed to connect to device via Bluetooth');
}