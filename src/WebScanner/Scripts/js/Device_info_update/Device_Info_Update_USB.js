  /********************************************************************* 
*                       
*  Filename           :  Device_infoUpdate_USB.js     
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
let EndDeviceinforUpdate=false;
let dcount=0;
let xmlContent = '';


//=======================================================
// Update SCANDEF
//=======================================================
//Respose for device info update-----------------------------------------
async function Responce_DeviceInfo_Update(data,reportID){
    await ATT_SetStore_Responce_USB(data,reportID,0x06);
    updateProgressbar2(startIndex_ATT_SetStore+Pcktoffset240pckt,value_ATT_SetStore.length);
    if(EndDeviceinforUpdate){
        console.log("inside1")
        EndDeviceinforUpdate=false;
        updateProgressbar2(0,100);
        RefreshApp();
         
    }   
}
function Update_DeviceInfo_USB(){
  ATT_Store_Multipacket_USB(id_ATT_SetStore,type_ATT_SetStore,0,value_ATT_SetStore);
}
