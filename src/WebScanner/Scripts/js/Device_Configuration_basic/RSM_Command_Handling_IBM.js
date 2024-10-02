// Attribute Get IBM

async function ATT_Get_USBIBM(id){

    if (!device) {
        console.log("Device not connected.");
        alert("Device is not connected")
         return;
       }
       const byte1 = (id >> 8) & 0xFF;  // Extract the high byte
       const byte2 = id & 0xFF;
       const reportId = 0x30; // Report ID in hexadecimal
       const data = [
         0x50, 0x40, 0x00, 0x06, 0x02, 0x00, 
         byte1, byte2, 0x00, 0x00 ];
     
       try {
         get_value_response = true;
         await device.sendReport(reportId, new Uint8Array(data));
         console.log("Send Data (IBM):",data);
       } catch (error) {
         console.error("Error sending report:", error);
       }



}

function ProcessGetRSMCommandsUSB_IBM(reportId5,data){



}