  /********************************************************************* 
*                       
*  Filename           :  RSM Command Handling.js     
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
  // Global Varibales 

let offset_ATT_SetStore=0;
let startIndex_ATT_SetStore=0;
let id_ATT_SetStore;
let type_ATT_SetStore;
let property_ATT_SetStore;
let value_ATT_SetStore;
let value_ATT_SetStore240pckt;
let Pcktoffset240pckt;
  
  // Send offsed command------------------------------------------------------------------------
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



  // Process Parameter Data  ------------------------------------------------------------------------------
function ProcessGetRSMCommandsUSB(data){
 

  console.log("debugs");
    if(multyPacketParam==false){
  
      if (data.getUint8(4) == 0x02){ // Get Parameter value
        
        const highByte = data.getUint8(6);   
        const lowByte = data.getUint8(7); 
        
         paramID = (highByte << 8) | lowByte;
        if (paramID == 0xffff){
            paramType=90;
            PostProcesssesParameterData();
            return;
        
        }
        paramType = data.getUint8(8);
        paramProperty = data.getUint8(9);
  
        if(data.getUint8(3) <= 0x1D){  // Single packet Parameter
            paramValue =copyToHexArray(data, 10,(data.getUint8(3))-8 );
            PostProcesssesParameterData(); 
        }
        else{  //Multiple packet parameter
            multyPacketParam=true;
            paramValue =copyToHexArray(data, 10,21 );
  
            if(data.getUint8(3) == 0xF0){  //Multiple ofsets parameters
                multy_param_offset=true;
            }
        }
    }
    }else{
  
        if(multy_param_offset_res==false){  //Get multiple packet patermeter offsets(form 2nd packet onwords)
  
           if(data.getUint8(1)==0x1D && data.getUint8(0)==0x10){ // Intermediate data of  multiple packet patermeter offsets
              paramValue= appendToHexArray(paramValue,data,2,29);
             }
           else{  
  
               if(multy_param_offset==true){  // End of data in current offset
                   paramValue=appendToHexArray(paramValue,data,2,data.getUint8(1));
                   sendACK();
                   SendCommandOffset(offset_count);
                   offset_count++;
                   multy_param_offset_res=true;
                   return;
                  }
                else{   // End of the offset data
                   paramValue=appendToHexArray(paramValue,data,2,data.getUint8(1));
                   PostProcesssesParameterData();
                   multyPacketParam=false;
            }
        }
        }
        else{  //Get multiple packet patermeter offsets(first packet)
  
            if(data.getUint8(4) == 0x04){
               if(data.getUint8(3) == 0xF0){
                   paramValue=appendToHexArray(paramValue,data,15,16);
                   multy_param_offset_res=false;
                }
               else if(data.getUint8(3) <=0x15){
                   paramValue=appendToHexArray(paramValue,data,15,data.getUint8(3)-15);
                   PostProcesssesParameterData();
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

    
  // Post processes parameter data--------------------------------------------------------------
  function PostProcesssesParameterData() {
    
    offset_count=1;
    paramPropertyStr=paramProperty;
    paramTypestr= String.fromCharCode(paramType);
    console.log("rtt");
    
    switch(paramTypestr) {

      case 'A':
        paramValue=paramValue.slice(5)
        paramValueStr=paramValue.join(' ');
        break;
      case 'B':
        paramValueStr=hexToUnsignedInt(paramValue[0])
         break;
      case 'C':
        paramValueStr=hexToSignedInt(paramValue[0])
        break;
      case 'D':
        paramValue=paramValue.slice(0,-2)
        paramValueStr=hexToDWord(paramValue);   
        break;
      case 'F':
        paramValue=paramValue.slice(0,-2)
        paramValueStr=flagval(paramValue)     
        break;
      case 'I':
         paramValueStr=hexToSWord(paramValue);   
        break;
      case 'L':
         paramValueStr=hexToSDWord(paramValue);   
        break;
      case 'S':
        paramValue=paramValue.slice(4)
        paramValue = paramValue.slice(0, -3);
        paramValueStr=paramValue.map(hex => String.fromCharCode(parseInt(hex, 16))).join('');
        break;
      case 'X':
        paramValueStr=paramValue.map(hex => String.fromCharCode(parseInt(hex, 16))).join(''); 
        break;
      case 'W':
        paramValue=paramValue.slice(0,-2)
        paramValueStr=hexToWord(paramValue);  
        break; 
      case 'Z':
        paramValueStr="N/A" ;
        paramProperty=0;
        paramTypestr="-"; 
        paramID=parseInt(document.getElementById('get-value-input').value);

        break;   
      default:
        paramValueStr=paramValue.join(' ');     
    }


    console.log("ID:", paramID, "Type:", paramType, "Property:", paramProperty, "Value:", paramValueStr, "\n");

    
    if (GetmodelName){
      AddDevicetoDropdown();
      
    }
    else if (startup){
       updateDeviceInfo();
    }
    
    else if(switchHostmodeEnable){
      processswitchHostMode();
  
    }
    else{
       update_table();
    }
}

  // Get Attribute USB----------------------------------------------------
  async function ATT_Get_USB(id){
    update_table_status=true;
    if (!device) {
     console.log("Device not connected.");
     alert("Device is not connected")
      return;
    }
    const byte1 = (id >> 8) & 0xFF;  // Extract the high byte
    const byte2 = id & 0xFF;
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
      console.log("Request Report sent successfully. Send:",data);
    } catch (error) {
      console.error("Error sending report:", error);
    }
  }


// Set Paramert USB-----------------------------------------------------------------------------------------------------

async function ATT_Set_USB(id,type,property,value){
  ATT_SetStore_USB(id,type,property,value,0x05);
}

// Set Set Attribute USB----------------------------------------------
async function ATT_Store_USB(id,type,property,value){
  ATT_SetStore_USB(id,type,property,value,0x06);
}


// Attribute GetSet---------------------------------------------------
async function ATT_SetStore_USB(id,type,property,value,cmd){

  id = parseInt(id, 10);
   const id_lsb = (id & 0xFF);          
   const id_msb = (id >> 8) & 0xFF;

   type = type.charCodeAt(0);
   type = parseInt(type, 10);
   property = parseInt(property, 10);
 
   let byteArray = [];

   byteArray = [value & 0xFF];
  

  let array_len=byteArray.length+8
  const len_lsb = (array_len & 0xFF);          
  const len_msb = (array_len >> 8) & 0xFF;
  const reportId = 0x0D;

  let data = [
   0x40, len_msb, len_lsb, len_msb, len_lsb, cmd, 0x00, 
   id_msb,id_lsb, type, property, 0x00, 0x00, 0x00, 
   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
   0x00, 0x00, 0x00
 ];

 for (let i = 0; i < byteArray.length; i++) {
   if (11 + i < data.length) {
       data[11 + i] = byteArray[i];
   }else {
       break;
   }
 }
 try {
    await device.sendReport(reportId, new Uint8Array(data));
    console.log("Data Send(USB) :",reportId,data);
   
} catch (error) {
    console.error("Error sending report:", error);
}

}


//Switch to host mode --------------------------------------------
async function SwitchHostMode_USB(){

  if(Connected_device==USB_HIDKB){
    switchHost_USBHIDKB(0);
  }
  else{
  switchHostmodeEnable=true;
  await EnableSwitchhost();
  await ATT_Get_USB(135);
  }

}
async function EnableSwitchhost(){
  ATT_Set_USB(20010,'B',0x00,0x01);
}

function processswitchHostMode(){

  let hexArray = paramValueStr.split(' ').map(hex => parseInt(hex, 16));
  let extractedArray = hexArray.slice(0, 15);

  let prependArray = [
    0xC0, 0x00, 0x1C, 0x00, 0x5D, 0x05, 0x00, 0x00,
    0x87, 0x41, 0x00, 0x00, 0x00, 0x50, 0x00, 0x00,];
   finalArray = prependArray.concat(extractedArray);
   finalArray[23]=CurrentHostMode;
   SendData_32pckt(finalArray);


   extractedArray = hexArray.slice(15, 43);
   prependArray = [
   0x80, 0x00, 0x1C,];
   finalArray = prependArray.concat(extractedArray);
   SendData_32pckt(finalArray)

   extractedArray = hexArray.slice(43, 71);
   prependArray = [
   0x80, 0x00, 0x1C,];
   finalArray = prependArray.concat(extractedArray);
   SendData_32pckt(finalArray);

  extractedArray = hexArray.slice(71, 80);
  prependArray = [
  0x00, 0x00, 0x09,];
  finalArray = prependArray.concat(extractedArray);
  SendData_32pckt(finalArray)

  switchHostmodeEnable=false;
   location.reload();


}

async function switchHost_USBHIDKB(Hostmode) {
  if (!device) {
    console.log("Device not connected.");
    return;
  }

  const Data = [0x02, 0x00, 0x00];  
  const reportId = 0x80;  

  try {
    await device.sendFeatureReport(0x80, new Uint8Array([0x02]));
    console.log("Data Sent (USB):", reportId, Data.map(byte => '0x' + byte.toString(16).padStart(2, '0')));
  } catch (error) {
    console.error("Error sending report:", error);
  }
}

// Send 32 bits data packet----------------------------------------------------
async function SendData_32pckt(data){
  if (!device) {
    console.log("Device not connected.");
    return;
  }
  const reportId = 0x0D;

  try {
    get_value_response = true;
    await device.sendReport(reportId, new Uint8Array(data));
    console.log("Data Sent(USB):", reportId, data.map(byte => '0x' + byte.toString(16).padStart(2, '0')));

  } catch (error) {
    console.error("Error sending report:", error);
  } 
}


// Attribute Set Multipacket-----------------------------------------------

function ATT_Set_MultiPacket_USB(id,type,property,value){
  ATT_SetStore_Multipacket_USB(id,type,property,value,0x05);
}
//Attribute Store multipacket------------------------------------------------
function ATT_Store_Multipacket_USB(id,type,property,value){
  ATT_SetStore_Multipacket_USB(id,type,property,value,0x06);
}

// Attribute Setstore multipacket--------------------------------------------
async function ATT_SetStore_Multipacket_USB(id,type,property,value,cmdtype){

let ValueLenght=value.length;
console.log(ValueLenght);
let chunkSize = 227;

if(ValueLenght<227){
  value_ATT_SetStore240pckt=value.slice(0, ValueLenght);
  sendData_240pcktOffsetUSB(id,type,property,0x00,value_ATT_SetStore240pckt,ValueLenght,0x00,cmdtype)

}
else{
  value_ATT_SetStore240pckt = value.slice(startIndex_ATT_SetStore, startIndex_ATT_SetStore + chunkSize);
      startIndex_ATT_SetStore += chunkSize;
      await sendData_240pcktOffsetUSB(id,type,property,0x00,value_ATT_SetStore240pckt,ValueLenght,offset_ATT_SetStore,cmdtype)
      offset_ATT_SetStore+=227; 
}

}

// Send packet data (240 )via USB -Frist 32packet stat of the set offset------------------------------
async function sendData_240pcktOffsetUSB(id, type, property,subProperty,value,lenght,offset,cmdtype){

  let valuelength=value.length;
  let valueOffset;
  
 
  const id_msb = (id >> 8) & 0xFF; 
  const id_lsb = id & 0xFF;

  const length_msb = (lenght >> 8) & 0xFF;  
  const length_lsb = lenght & 0xFF;

  const offset_msb = (offset >> 8) & 0xFF;  
  const offset_lsb = offset& 0xFF;


  const TotalPacketLenght=valuelength+13;
  const TotalPacketLenght_msb = (TotalPacketLenght >> 8) & 0xFF;  
  const TotalPacketLenght_lsb = TotalPacketLenght & 0xFF;

  
  let data = [
      0x40, 0x00, 0x00,

      TotalPacketLenght_msb, TotalPacketLenght_lsb, cmdtype,0x00, id_msb, id_lsb, type, property,
      subProperty, length_msb, length_lsb,  offset_msb, offset_lsb,
       
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,  0x00, 0x00, 0x00,
      0x00
    ];

  if(valuelength <= 15){

      data[0]=0x40;
      data[2]=TotalPacketLenght;
      data.splice(16, valuelength, ...value);
      await SendData_32pckt(data);
      return;

  }else{
      console.log("stage1");
      data[0]=0xC0;
      data[2]=0x1C;
      valueOffset=value.slice(0,15)
      data.splice(16, 15, ...valueOffset);
      Pcktoffset240pckt=15;
      await SendData_32pckt(data);
      
      
  }

}

//Get Resposes of Attribute Setstore----------------------------------------------------------------
async function ATT_SetStore_Responce_USB(data,reportID,cmd){

  const datatoSend = [
      0x40, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00
    ];
   
  
    
    let ValueLenght=value_ATT_SetStore.length;

  if(reportID==0x27 && data.getUint8(4) == 0x06){

      sendACK(); 
      console.log("ACK Recived : ATT Store");
      let chunkSize = 227;
      

     if(startIndex_ATT_SetStore < ValueLenght) {

        if((ValueLenght-startIndex_ATT_SetStore)<227 ){
          value_ATT_SetStore240pckt = value_ATT_SetStore.slice(startIndex_ATT_SetStore,ValueLenght);
          await sendData_240pcktOffsetUSB(id_ATT_SetStore,type_ATT_SetStore,property_ATT_SetStore,0x00,value_ATT_SetStore240pckt,ValueLenght,offset_ATT_SetStore,cmd);
          startIndex_ATT_SetStore=ValueLenght;
           offset_ATT_SetStore=ValueLenght;
       }
        else{
          value_ATT_SetStore240pckt = value_ATT_SetStore.slice(startIndex_ATT_SetStore, startIndex_ATT_SetStore + chunkSize);
          await sendData_240pcktOffsetUSB(id_ATT_SetStore,type_ATT_SetStore,property_ATT_SetStore,0x00,value_ATT_SetStore240pckt,ValueLenght,offset_ATT_SetStore,cmd)
          startIndex_ATT_SetStore += chunkSize;
          offset_ATT_SetStore+=227;
           }
         

         console.log('Offset:',offset_ATT_SetStore)
         
      
  }
 

  }else if(reportID==0x21){

      let valuelength240pckt =value_ATT_SetStore240pckt.length;
      if(Pcktoffset240pckt < valuelength240pckt){
          let dataRemain=valuelength240pckt-Pcktoffset240pckt;
  
  
          if((dataRemain)<=0x1C){
              datatoSend.fill(0x00);
              console.log("stage3");
              datatoSend[0]=0x00;
              datatoSend[2]=dataRemain;
              valueOffset=value_ATT_SetStore240pckt.slice(Pcktoffset240pckt,valuelength240pckt);
              datatoSend.splice(3, dataRemain, ...valueOffset);
              Pcktoffset240pckt+=dataRemain;
              await SendData_32pckt(datatoSend);
              if(startIndex_ATT_SetStore==ValueLenght){
                EndDeviceinforUpdate=true;
              }
              
              
          }
          else{
              console.log("stage2");
              datatoSend[0]=0x80;
              datatoSend[2]=0x1C;
              valueOffset=value_ATT_SetStore240pckt.slice(Pcktoffset240pckt,Pcktoffset240pckt+28)
              datatoSend.splice(3, 0x1C, ...valueOffset);
              Pcktoffset240pckt+=28;
              await SendData_32pckt(datatoSend);
              
          }
       
      }
      else{
          Pcktoffset240pckt=0;
      }         
  }

}






 

  
  
  
 