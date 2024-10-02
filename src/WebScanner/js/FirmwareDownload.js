/********************************************************************* 
*                       
*  Filename           :  FirmwareDownload.js     
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
//Local Variables
let fileData = null;
let currentOffset = 8; 
let recordCount = 1;
let recordDataHex;
let recordLength;
let current_record_lenght;
let current_record_sent=0;
let EndRecord=false;
let  readend=false;
let firmwareUpdateInProgress=false;
let firmware_updateCompleate=false;
let data = [

   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
];

// Html Elements
const FWFilePath = document.getElementById('filePath');
const FWFileInput = document.getElementById('fileInput');

// Firmware Update----------------------------------------------------------------------------------------------
fwUpdateButton.addEventListener('click', async () => {
   firmware_update=true;
   firmwareUpdateInProgress=true;
   firmware_updateCompleate=false;
   StartFirmwareUpdate();
 });

// FW-Launch---------------------------------------------------------------------------------------------------
fwLaunchButton.addEventListener('click', async () => { 
   if(firmware_updateCompleate==true){
      Reboot();
      WebScannerAlert("Firmware update was launched, device will reboot");
   }
   else{
      WebScannerAlert("Faild to launch , No downloaded firmware");
   }
   
 });

 //FW-Abort---------------------------------------------------------------------------------------------------
 fwAbortButton.addEventListener('click', async () => {
   if(firmwareUpdateInProgress==true){
       firmwareUpdateInProgress=false; 
       WebScannerAlert("Firmware Update was aborted");
   }
   else{
       WebScannerAlert("No firmware download in Progress");
   }
 });

// Select DAT file -------------------------------------------------------------------------------------------
 FWFilePath.addEventListener('click', function() {
   FWFileInput.click();
});

FWFileInput.addEventListener('change', function(event) {
    const filePath = event.target.files[0].name;
    FWFilePath.value = filePath;
}); 


//==============================================================================================================
// Firmware Update Via USB
//==============================================================================================================

// Processes firmware update----------------------------------------------------------------------------------
function processFirmwareUpdate(data,reportId){
   console.log("Response:",reportId)
   printDataViewContent(data);

   if(firmwareUpdateInProgress==true){
      if(!EndRecord){
         if(reportId==0x21){
             if(current_record_lenght <=28){
                 SendDatafirmware(0,current_record_lenght,0x40);
                 current_record_sent=0;
                 readNextRecord();
                 EndRecord=true;
            }
             else{
                if((current_record_lenght-current_record_sent)<28){
                     SendDatafirmware(current_record_sent,current_record_lenght,0x00);
                     current_record_sent=0;
                     readNextRecord();
                     EndRecord=true;
                  }
               else{
                   SendDatafirmware(current_record_sent,current_record_sent+28,0x80);
                   current_record_sent+=28;
               }
                 } 
        }   
   }
      else{
         if(readend==false){
            if(reportId==0x27){
              sendACK();

               if(current_record_lenght <=28){
                  SendDatafirmware(0,current_record_lenght,0x40);
                  current_record_sent=0;
                  readNextRecord();
                  EndRecord=true;
              }
               else{
                  if((current_record_lenght-current_record_sent)<28){
                      SendDatafirmware(current_record_sent,current_record_lenght,0x00);
                      current_record_sent=0;
                      readNextRecord();
                      EndRecord=true;
                  }
                  else{
                      SendDatafirmware(current_record_sent,current_record_sent+28,0xC0);
                      current_record_sent+=28;
                      EndRecord=false;
                    }
              }
        }  
   } 
     else{
        firmware_update=false;
        firmware_updateCompleate=true;
        WebScannerAlert("Firmware Download is compleated");
       } 
  }
  }
  else{ 
   firmware_update=false;
  }
}

// Send Data (firmware) via USB -------------------------------------------------------------------------------
async function SendDatafirmware(start,end,cmdtype){

   if (!device) {
      console.log("Device not connected.");
      alert("Device is not connected")
      return;
   }
   const reportId = 0x0D; 
   const datalen=end-start;
   const lenmsb= (datalen >> 8) & 0xFF;
   const lenlsb = datalen & 0xFF;

    data[0]=cmdtype;
    data[1]=lenmsb;
    data[2]=lenlsb;
  
    let extractedData = recordDataHex.slice(start, end);
    data.splice(3, extractedData.length, ...extractedData);
    updateProgress(recordCount,26144);
   try {
      
     firmware_update=true;
     await device.sendReport(reportId, new Uint8Array(data));
     console.log("Request Report sent successfully.");
   } catch (error) {
     console.error("Error sending report:", error);
   }
   console.log(data);
 }

// Reboot Device-----------------------------------------------------------------------
async function RebootUSB(){
   if (!device) {
     console.log("Device not connected.");
      return;
    }
    const reportId = 0x0D; 
    const data = [
      0x40, 0x00, 0x04, 0x00, 0x04, 0x65, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00
    ];
    try {
      get_value_response = true;
      await device.sendReport(reportId, new Uint8Array(data));
      console.log("Request Report sent successfully(Reboot).");
    } catch (error) {
      console.error("Error sending report:", error);
    }
 }
 
 //==================================================================================
 // Firmware Update Via Serial
 //===================================================================================
 function processFirmwareUpdateSerial(data){

  readNextRecord();
  if(firmwareUpdateInProgress==true){
     if(readend ==false){ 
        SendDatafirmwareSerial();
  }
  else{
      firmware_updateCompleate=true;
       WebScannerAlert("Firmware Download is compleated");
  }
  }
 }
// Send firmware data via serial---------------------------------------------------
async function SendDatafirmwareSerial(){
try{
 const  datalen=recordDataHex.length +4;
 const data=[];
 data[0]=datalen;
 data[1]=0x80;
 data[2]=0x04;
 data[3]=0x00;
 data.splice(4, 0, ...recordDataHex);

 const checksum= getChecksum(new Uint8Array(data));

 data.splice(datalen, 0, ...checksum);
 console.log(data);
 updateProgress(recordCount,26144);
 if (data && SerialWriter) {  
   await SerialWriter.write(new Uint8Array(data));
   console.log('Sent:', new Uint8Array(data));
   
} else {
   console.log('No data to send or writer not initialized.');   
}
} catch (error) {
console.error('Error sending data:', error);    
}

}

//Reboot device via Serial------------------------------------------------------
async function RebootSerial() {
   try {
     const input = parseInt(document.getElementById('get-value-input').value);
     const IDmsb= (input >> 8) & 0xFF;
     const IDlsb =input & 0xFF;
     const data =[
       0x08, 0x80, 0x04, 0x00, 0x00, 0x04, 0x65,0x00 
     ]
      const checksum= getChecksum(new Uint8Array(data));
 
     const datatoWrite =[
      0x08, 0x80, 0x04, 0x00, 0x00, 0x04, 0x65,0x00,checksum[0],checksum[1]
     ]

     if (datatoWrite && SerialWriter) {  
         await SerialWriter.write(new Uint8Array(datatoWrite));
         console.log('Sent:', new Uint8Array(datatoWrite));
     } else {
         console.log('No data to send or writer not initialized.');   
     }
 } catch (error) {
     console.error('Error sending data:', error);  
 }
 } 

// ================================================================================
// Firmware Update 
//=================================================================================

// Start Firmware Update process---------------------------------------------------
function StartFirmwareUpdate() {
   const fileInput = document.getElementById('fileInput');

   if (fileInput.files.length === 0) {
      console.log('Please select a .dat file first.');
      WebScannerAlert("Please Seelct  a Firmwatre DAT file ");
       return;
   }

   const file = fileInput.files[0];
   const reader = new FileReader();

   reader.onload = function(e) {
       fileData = new Uint8Array(e.target.result);
       currentOffset = 8; 
       recordCount = 1;   
       console.log("file initilizede")
       readNextRecord();
       console.log(recordDataHex);

       if(com_interface=='1'){
         SendDatafirmware(0,28,0xC0);
       }
       else if(com_interface=='2'){
        SendDatafirmwareSerial();
       }
       current_record_sent=28;
   
   };

   reader.onerror = function() {
       output.textContent = 'Error reading the file.';
   };
   reader.readAsArrayBuffer(file);  
}

// Read DAT file---------------------------------------------------------------------------
function readNextRecord() {

   if (!fileData || currentOffset >= fileData.length) {
       console.log("file is",fileData);
       readend=true;
       return;
   }
   recordLength = fileData[currentOffset];
   const fixedField = fileData.slice(currentOffset + 1, currentOffset + 4);
   const recordData = fileData.slice(currentOffset + 4, currentOffset + 4 + recordLength);

   const fixedFieldHex = Array.from(fixedField).map(b => b.toString(16).padStart(2, '0')).join(' ');
    recordDataHex = Array.from(recordData, byte => `0x${byte.toString(16).padStart(2, '0')}`);
    current_record_lenght=recordLength;

   currentOffset += 4 + recordLength; // Move to the next record
   recordCount++;  
}

//Update progrerss bar---------------------------------------------------------------------
function updateProgress(currentValue,maxValue) {
   const progressPercent = (currentValue / maxValue) * 100;
   const progressBar = document.getElementById('progressBar');
   progressBar.style.width = progressPercent + '%';
   progressBar.textContent = progressPercent.toFixed(2) + '%'; 
}

//Reboot device ----------------------------------------------------------------------------
 function Reboot(){
   if(com_interface=='1'){
      RebootUSB();
   }
   else if(com_interface=='2'){
      RebootSerial();
   }

 }