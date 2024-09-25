  /********************************************************************* 
*                       
*  Filename           :  Device-Connections_Serial.js     
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
async function Responce_DeviceInfo_Update_Serial(data){
    await ATT_SetStore_Responce_Serial(data,0x06);
    updateProgressbar2(startIndex_ATT_SetStore+Pcktoffset240pckt,value_ATT_SetStore.length);
    
    if(EndDeviceinforUpdate){
        console.log("inside1")
        EndDeviceinforUpdate=false;
        updateProgressbar2(0,100);
        RefreshApp();
         
    }   
    
  
}
function Update_DeviceInfo_Serial(){
  ATT_Store_Multipacket_Serial(id_ATT_SetStore,type_ATT_SetStore,0,value_ATT_SetStore);
}




