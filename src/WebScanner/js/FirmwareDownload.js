//----------------------------------------------Firmware download------------------------------------------------



// Firmware Update----------------------------------------------------------------------------------------------
fwUpdateButton.addEventListener('click', async () => {
    
  
   WebScannerAlert('Firmware Update failed');
 });

// FW-Launch---------------------------------------------------------------------------------------------------
fwLaunchButton.addEventListener('click', async () => {
    
    WebScannerAlert("Canot Launch No firmware Updating processes")
 });

 //FW-Abort---------------------------------------------------------------------------------------------------
 fwAbortButton.addEventListener('click', async () => {
    
    WebScannerAlert("Canot abort No firmware updating processes")
 });


 document.getElementById('filePath').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', function(event) {
    const filePath = event.target.files[0].name;
    document.getElementById('filePath').value = filePath;
}); 
