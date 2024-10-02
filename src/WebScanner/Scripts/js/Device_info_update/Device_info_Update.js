

//=======================================================
// Update Device Image
//=======================================================
var scandeffile;
var imagefile;
// Get Device image file input ------------------------------------------------------
FilePathImage.addEventListener('click', function() {
    FileInputImage.click();
 });

  // Get Device image file ----------------------------------------------------------
  FileInputImage.addEventListener('change', function(event) {
    imagefile = event.target.files[0];

    const filePath = imagefile.name.toLowerCase();
    if (!filePath.endsWith('.jpg')) {
        WebScannerAlert('Please Select a .jpg image file.');
        return;
    }
    FilePathImage.value = filePath;
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;

        img.onload = function() {
            if (img.width === 100 && img.height === 100) {
                const binaryString = atob(e.target.result.split(',')[1]);
                const byteArray = new Uint8Array(binaryString.length);
                
                for (let i = 0; i < binaryString.length; i++) {
                    byteArray[i] = binaryString.charCodeAt(i);
                }

        
                value_ATT_SetStore = [];
                for (let i = 0; i < byteArray.length; i++) {
                    value_ATT_SetStore.push(byteArray[i]);
                }
               
            } else {
                WebScannerAlert('The image resolution must be 100x100 pixels.');
            }
        };
    };

    reader.readAsDataURL(imagefile); // Read the file as a data URL
});
  
// Update Image------------------------------------------------------------------------


document.getElementById('button-send-image').addEventListener('click', UpdateDeviceImage);
function UpdateDeviceImage(){
    
    if (!imagefile) {
        WebScannerAlert('No Image file has been selected');
        return;
     }
    
    DeviceInfoUpdate=true;
    id_ATT_SetStore=2471;
    type_ATT_SetStore=65;
    property_ATT_SetStore=0x00;
    offset_ATT_SetStore=0;
    startIndex_ATT_SetStore=0;

    if(com_interface==USB_HID){
        Update_DeviceInfo_USB();
    }
    else if(com_interface==SERIAL){
        Update_DeviceInfo_Serial();
    }
  }

  //======================================================
  //Update Device Scandef
  //=====================================================


 // Get Scandef file input ------------------------------------------------------
 FilePathScandef.addEventListener('click', function() {
    FileInputScandef.click();
 });

// Get scandef file ------------------------------------------------------------------------
FileInputScandef.addEventListener('change', function(event) {
    const filePath = event.target.files[0].name;
    FilePathScandef.value = filePath;
    scandeffile = event.target.files[0];
    if (scandeffile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            fileContent = e.target.result; // Store file content in the variable
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(fileContent, 'application/xml');
            const generalGroup = xmlDoc.querySelector('group[name="GENERAL"]');
            if (generalGroup) {
                 const serializer = new XMLSerializer();
                 xmlContent = serializer.serializeToString(generalGroup);
                }
        };
        reader.readAsText(scandeffile);
    } else {
        WebScannerAlert('No Scandef file selected!');
    }
            
   
  });


  //Conver to abytearray

  function convertxmlToByteArray() {

    if (!xmlContent) {
        WebScannerAlert('No file content loaded!');
        return;
    }
    value_ATT_SetStore = [];
    for (let i = 0; i < xmlContent.length; i++) {
        const charCode = xmlContent.charCodeAt(i);
        value_ATT_SetStore.push(charCode);
    }

    const length=value_ATT_SetStore.length
    const length_msb = (length >> 8) & 0xFF;  
    const length_lsb = length & 0xFF;
    value_ATT_SetStore.unshift(length_msb, length_lsb);
    
    
}

document.getElementById('button-send-scandef').addEventListener('click', UpdateDeviceScandef);
function UpdateDeviceScandef(){
  if(!scandeffile){
    WebScannerAlert("No Scandef file has been selected");
    return;
  }
  convertxmlToByteArray();
  DeviceInfoUpdate=true;
  id_ATT_SetStore=5032;
  type_ATT_SetStore=65;
  property_ATT_SetStore=0x00;
  offset_ATT_SetStore=0;
  startIndex_ATT_SetStore=0;

  if(com_interface==USB_HID){
      Update_DeviceInfo_USB();
      
  }
  else if(com_interface==SERIAL){
      Update_DeviceInfo_Serial();
  }
}


    
// Update progressbar 2--------------------------------------------------------
function updateProgressbar2(currentValue,maxValue) {
    const progressPercent = (currentValue / maxValue) * 100;
    const progressBar = document.getElementById('progressBar2');
    progressBar.style.width = progressPercent + '%';
    progressBar.textContent = progressPercent.toFixed(2) + '%'; 
 }

  
  




  
  
