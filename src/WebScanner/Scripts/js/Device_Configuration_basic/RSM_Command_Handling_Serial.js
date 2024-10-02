/********************************************************************* 
*                       
*  Filename           :  RSM_Serial.js     
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

// Global Variable 
let get_offset_serial=false;
let pckt_offset_serial=0;


//Process RSM Commands Serial-----------------------------------------------------------------------------------
function ProcessRSMCommandsSerial(data){
    let intarray;
    
      console.log("came");
      datalen=(data[4] << 8) | data[5];


      if(data[6]==0x02){
        paramID=(data[8] << 8) | data[9];
        paramType=data[10];
        paramProperty=data[11];

        if (paramID == 0xffff){
          paramType=90;
          PostProcesssesParameterDataSerial();
          return;}

        if(datalen <240){
          intarray=data.slice(4, datalen+2);
          paramValue = Array.from(intarray, byte => '0x' + byte.toString(16).padStart(2, '0').toUpperCase());
          pckt_offset_serial=0;
          PostProcesssesParameterDataSerial();

        }
        else{
          intarray=data.slice(14, 244);
          paramValue = Array.from(intarray, byte => '0x' + byte.toString(16).padStart(2, '0').toUpperCase());
          pckt_offset_serial++
          GetOffsetSerial(pckt_offset_serial*227);
        }
      }
      else if(data[6]==0x04){
         
        if((datalen <240)){
          intarray=data.slice(17, datalen+2);
          Array.from(intarray, byte => paramValue.push('0x' + byte.toString(16).padStart(2, '0').toUpperCase()));
          PostProcesssesParameterDataSerial();
          pckt_offset_serial=0;
          get_offset_serial=false;

        }
        else{

        intarray=data.slice(17, 244);
        Array.from(intarray, byte => paramValue.push('0x' + byte.toString(16).padStart(2, '0').toUpperCase()));
        pckt_offset_serial++
        GetOffsetSerial(pckt_offset_serial*227);
        get_offset_serial=true;
          
        }

      }
      else if(get_offset_serial==true && data[6]!=0x04 ){
        PostProcesssesParameterDataSerial();
        pckt_offset_serial=0;
          get_offset_serial=false;

      }
    

  }

//Get offset Serial------------------------------------------------------------------------------------------------

async function GetOffsetSerial(offset){
    try {
      const input = parseInt(document.getElementById('get-value-input').value);
      const IDmsb= (paramID >> 8) & 0xFF;
      const IDlsb =paramID & 0xFF;
      const Offsetmsb= (offset >> 8) & 0xFF;
      const Offsetlsb =offset & 0xFF;
      const data =[
        0x0c, 0x80, 0x04, 0x00, 0x00, 0x08, 0x04 ,0x00,IDmsb,IDlsb,Offsetmsb,Offsetlsb
      ]
       const checksum= getChecksum(new Uint8Array(data));
  
      const datatoWrite =[
        0x0c, 0x80, 0x04, 0x00, 0x00, 0x08, 0x04 ,0x00,IDmsb,IDlsb,Offsetmsb,Offsetlsb,checksum[0],checksum[1]
      ]

      if (datatoWrite && SerialWriter) {  
          await SerialWriter.write(new Uint8Array(datatoWrite));
          console.log('Sent:', new Uint8Array(datatoWrite) ,"Offset:",pckt_offset_serial);
      } else {
          console.log('No data to send or writer not initialized.');   
      }
  } catch (error) {
      console.error('Error sending data:', error);  
  }


}
// Get value serial -----------------------------------------------------------------------------------------------
  async function ATT_Get_Serial(id) {
    try {
      
      const IDmsb= (id >> 8) & 0xFF;
      const IDlsb =id & 0xFF;
      const data =[
        0x0a, 0x80, 0x04, 0x00, 0x00, 0x06, 0x02 ,0x00,IDmsb,IDlsb
      ]
       const checksum= getChecksum(new Uint8Array(data));
  
      const datatoWrite =[
        0x0a, 0x80, 0x04, 0x00, 0x00, 0x06, 0x02 ,0x00,IDmsb,IDlsb,checksum[0],checksum[1]
      ]

      if (datatoWrite && SerialWriter) {  
          await SerialWriter.write(new Uint8Array(datatoWrite));
          console.log('Sent:', Array.from(new Uint8Array(datatoWrite)).map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' '));

      } else {
          console.log('No data to send or writer not initialized.');   
      }
  } catch (error) {
      console.error('Error sending data:', error);  
  }
  } 

  //Request Parameter serial----------------------------------------------------------------------------------

async function Request_parameterSerial(param_num){

    try {
      const IDmsb= (param_num >> 8) & 0xFF;
      const IDlsb =param_num & 0xFF;
      const data =[
        0x0a, 0x80, 0x04, 0x00, 0x00, 0x06, 0x02 ,0x00,IDmsb,IDlsb
      ]
       const checksum= getChecksum(new Uint8Array(data));
       const datatoWrite =[
        0x0a, 0x80, 0x04, 0x00, 0x00, 0x06, 0x02 ,0x00,IDmsb,IDlsb,checksum[0],checksum[1]
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

  // Post processes parameter data--------------------------------------------------------------
  function PostProcesssesParameterDataSerial() {
    console.log("post");
    offset_count=1;
    paramPropertyStr=paramProperty;
    paramTypestr= String.fromCharCode(paramType);
    
    
    switch(paramTypestr) {

      case 'A':
        paramValue=paramValue.slice(3)
        paramValueStr=paramValue.join(' ');
        break;
      case 'B':
        paramValueStr=hexToUnsignedInt(paramValue[0])
         break;
      case 'C':
        paramValueStr=hexToSignedInt(paramValue[0])
        break;
      case 'D':
        paramValue=paramValue.slice(8)
        paramValueStr=hexToDWord(paramValue);   
        break;
      case 'F':
        paramValue=paramValue.slice(8);
        console.log(paramValue);
        paramValueStr=flagval(paramValue)  ;   
        break;
      case 'I':
         paramValueStr=hexToSWord(paramValue);   
        break;
      case 'L':
         paramValueStr=hexToSDWord(paramValue);   
        break;
      case 'S':
        paramValue=paramValue.slice(12);
        paramValue = paramValue.slice(0, -2);
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

    if(startup){
       updateDeviceInfo();
    }
    else if(switchHostmodeEnable){
      processswitchHostMode_Serial();
  
    }
    else{
       update_table();
    }
}


// Set Paramert USB-----------------------------------------------------------------------------------------------------

function ATT_Set_Serial(id,type,property,value){
  ATT_SetStore_Serial(id,type,property,value,0x05);

}

// Set Paramert USB-----------------------------------------------------------------------------------------------------

function ATT_Store_Serial(id,type,property,value){
  ATT_SetStore_Serial(id,type,property,value,0x06);
}


async function ATT_SetStore_Serial(id,type,property,value,cmd){
  
  id = parseInt(id, 10);
  const id_lsb = (id & 0xFF);          
  const id_msb = (id >> 8) & 0xFF;

  type = type.charCodeAt(0);
  type = parseInt(type, 10);
  property = parseInt(property, 10);

  let byteArray = [];

 if(type==65){
  byteArray=value;
 }
 else{
  byteArray = [value & 0xFF];

 }
 
 console.log(byteArray);

 let array_len=byteArray.length+8
 const len_lsb = (array_len & 0xFF);          
 const len_msb = (array_len >> 8) & 0xFF;


 let data = [
  0x0a, 0x80, 0x04, 0x00,len_msb, len_lsb, cmd ,0x00,
  id_msb,id_lsb, type, property];

  data = data.concat(byteArray);

  data[0] =data.length;
  const checksum= getChecksum(new Uint8Array(data));
  datatoWrite=data.concat(checksum[0]);
  datatoWrite=datatoWrite.concat(checksum[1]);
  
  try {

    if (datatoWrite && SerialWriter) {  
        await SerialWriter.write(new Uint8Array(datatoWrite));
        console.log('Sent:', Array.from(new Uint8Array(datatoWrite)).map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' '));
        
    } else {
        console.log('No data to send or writer not initialized.');   
    }
} catch (error) {
    console.error('Error sending data:', error);    
}
} 

// Attribute set multipacket
function ATT_Set_MultiPacket_Serial(id,type,property,value){
  ATT_SetStore_Multipacket_Serial(id,type,property,value,0x05);
}
//Attribute Store multipacket------------------------------------------------
function ATT_Store_Multipacket_Serial(id,type,property,value){
  ATT_SetStore_Multipacket_Serial(id,type,property,value,0x06);
}

// Atreribute swtstore  in serial
async function ATT_SetStore_Multipacket_Serial(id,type,property,value,cmdtype){
  let ValueLenght=value.length;
  console.log(ValueLenght);
 let chunkSize = 227;
 
 if(ValueLenght<227){
     value_ATT_SetStore240pckt=value.slice(0, ValueLenght);
     sendData_240pcktOffsetSerial(id,type,property,0x00,value_ATT_SetStore240pckt,ValueLenght,0x00,cmdtype)
 
 }
 else{
         value_ATT_SetStore240pckt = value.slice(startIndex_ATT_SetStore, startIndex_ATT_SetStore + chunkSize);
         startIndex_ATT_SetStore += chunkSize;
         await sendData_240pcktOffsetSerial(id,type,property,0x00,value_ATT_SetStore240pckt,ValueLenght,offset_ATT_SetStore,cmdtype)
         offset_ATT_SetStore+=227;
    
 }
  
 }
 
 // Send packet data (240 )via USB -Frist 32packet stat of the set offset------------------------------
 async function sendData_240pcktOffsetSerial(id, type, property,subProperty,value,lenght,offset,cmdtype){
 
     let valuelength=value.length;
     let valueOffset;
     let datatoWrite=[];
     
    
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
         TotalPacketLenght_msb, TotalPacketLenght_lsb, cmdtype,0x00, id_msb, id_lsb, type, property,
         subProperty, length_msb, length_lsb,  offset_msb, offset_lsb,
      
       ];


       datatoWrite[0]=valuelength+17;
       datatoWrite[1]=0x80;
       datatoWrite[2]=0x04;
       datatoWrite[3]=0x00;
       datatoWrite.splice(4, 0, ...data);
       datatoWrite.splice(17, 0, ...value);

       const checksum= getChecksum(new Uint8Array(datatoWrite));
       datatoWrite.splice(datatoWrite.length, 0, ...checksum);

       try {
          
          if (datatoWrite && SerialWriter) {  
              await SerialWriter.write(new Uint8Array(datatoWrite));
              console.log('Sent:', new Uint8Array(datatoWrite) ,"Offset:",offset);
          } else {
              console.log('No data to send or writer not initialized.');   
          }
      } catch (error) {
          console.error('Error sending data:', error);  
      }
 

  
 }
 
 //Process  device infor update USB------------------------------------------------------------------
 async function ATT_SetStore_Responce_Serial(data,cmd){

     
         updateProgressbar2(offset_ATT_SetStore,value_ATT_SetStore.length);
 
         
         
         console.log("ACK Recived : ATT Store");
         let ValueLenght=value_ATT_SetStore.length;
         let chunkSize = 227;
 
        if(startIndex_ATT_SetStore < ValueLenght) {
 
           if((ValueLenght-startIndex_ATT_SetStore)<227 ){
              value_ATT_SetStore240pckt = value_ATT_SetStore.slice(startIndex_ATT_SetStore,ValueLenght);
              startIndex_ATT_SetStore=ValueLenght;
              offset_ATT_SetStore=ValueLenght;
              await sendData_240pcktOffsetSerial(id_ATT_SetStore,type_ATT_SetStore,property_ATT_SetStore,0x00,value_ATT_SetStore240pckt,ValueLenght,offset_ATT_SetStore,cmd)
               offset_ATT_SetStore=ValueLenght;
               EndDeviceinforUpdate=true;
          }
           else{
              value_ATT_SetStore240pckt = value_ATT_SetStore.slice(startIndex_ATT_SetStore, startIndex_ATT_SetStore + chunkSize);
             startIndex_ATT_SetStore += chunkSize;
             await sendData_240pcktOffsetSerial(id_ATT_SetStore,type_ATT_SetStore,property_ATT_SetStore,0x00,value_ATT_SetStore240pckt,ValueLenght,offset_ATT_SetStore,cmd)
             offset_ATT_SetStore+=227;
              }
         
           
            
     }
     
 
  }


  // Switch host mode -------------------------------------------------------------------------------------------

async function switchHostModeSerial(){
  //WebScannerAlert("Switch host mode is currenlty unavailable in Serial COM mode")
  switchHostmodeEnable=true;
  await EnableSwitchhostSerial();
  await ATT_Get_Serial(135);
}

async function EnableSwitchhostSerial(){
  ATT_Set_Serial(20010,'B',0x00,0x01);
}


async function processswitchHostMode_Serial(){

  let hexArray = paramValueStr.split(' ').map(hex => parseInt(hex, 16));
  hexArray=hexArray.slice(10);
  hexArray[7]= 0x01;    //CurrentHostMode;
  let prependArray = [
    0x61, 0x80, 0x04, 0x00,0x00, 0x5D, 0x05, 0x00, 0x00,
    0x87, 0x41, 0x07, 0x20, 0x00, 0x50, 0x00, 0x00,];
   let datatoWrite = prependArray.concat(hexArray);
    
     console.log(datatoWrite);
    const checksum= getChecksum(new Uint8Array(datatoWrite));
    datatoWrite=datatoWrite.concat(checksum[0]);
    datatoWrite=datatoWrite.concat(checksum[1]);

   

   try {

    if (datatoWrite && SerialWriter) {  
        await SerialWriter.write(new Uint8Array(datatoWrite));
        console.log('Sent:', Array.from(new Uint8Array(datatoWrite)).map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' '));

        
    } else {
        console.log('No data to send or writer not initialized.');   
    }
} catch (error) {
    console.error('Error sending data:', error);    
}


RebootSerial();
location.reload();
}
  