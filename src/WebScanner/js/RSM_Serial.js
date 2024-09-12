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
          intarray=data.slice(4, datalen+3);
          paramValue = Array.from(intarray, byte => '0x' + byte.toString(16).padStart(2, '0').toUpperCase());
          console.log("param_val:",paramValue);
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
          intarray=data.slice(17, datalen+3);
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
  async function GetValueSerial() {
    try {
      const input = parseInt(document.getElementById('get-value-input').value);
      const IDmsb= (input >> 8) & 0xFF;
      const IDlsb =input & 0xFF;
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
        paramValue=paramValue.slice(0,-1)
        paramValueStr=hexToDWord(paramValue);   
        break;
      case 'F':
        paramValue=paramValue.slice(8);
        paramValue=paramValue.slice(0,-1);
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
    else{
       update_table();
    }
}

// Switch host mode -------------------------------------------------------------------------------------------

function switchHostModeSerial(){
  Set_parameterSerial(20010,'B',0,1);


}
async function Set_parameterSerial(id,type,property,value){

  id = parseInt(id, 10);
  const id_lsb = (id & 0xFF);          
  const id_msb = (id >> 8) & 0xFF;

  type = type.charCodeAt(0);
  type = parseInt(type, 10);
  property = parseInt(property, 10);

  let byteArray = [];

 if (type === 70) {
     byteArray = [value & 0xFF];
 }

 let array_len=byteArray.length+8
 const len_lsb = (array_len & 0xFF);          
 const len_msb = (array_len >> 8) & 0xFF;


 let data = [
  0x0a, 0x80, 0x04, 0x00,len_msb, len_lsb, 0x05 ,0x00,
  id_msb,id_lsb, type, property];

  data = data.concat(byteArray);

  data[0] =data.length;
  const checksum= getChecksum(new Uint8Array(data));
  datatoWrite=data.concat(checksum[0]);
  datatoWrite=datatoWrite.concat(checksum[1]);
  
  try {

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
  