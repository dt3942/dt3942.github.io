  /********************************************************************* 
*                       
*  Filename           :  RSM_HID.js     
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

   // Post processes parameter data--------------------------------------------------------------
   function PostProcesssesParameterData() {
    
    offset_count=1;
    paramPropertyStr=paramProperty;
    paramTypestr= String.fromCharCode(paramType);
    
    
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

    if(startup){
       updateDeviceInfo();
    }
    else{
       update_table();
    }
}

// Request specific parameter------------------------------------------------------------------------------------------------------
async function Request_parameter(param_num){

    if (!device) {
      console.log("Device not connected.");
       return;
     }
     const byte1 = (param_num >> 8) & 0xFF;  // Extract the high byte
     const byte2 = param_num & 0xFF;
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
       console.log("Request Report sent successfully.");
     } catch (error) {
       console.error("Error sending report:", error);
     }
  }

  // Getparameter USB---------------------------------------------------------------------------------------------------
async function GetvalueUSB(){
    update_table_status=true;
    if (!device) {
     console.log("Device not connected.");
     alert("Device is not connected")
      return;
    }
    const input = parseInt(document.getElementById('get-value-input').value);
    const byte1 = (input >> 8) & 0xFF;  // Extract the high byte
    const byte2 = input & 0xFF;
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
      console.log("Request Report sent successfully.");
    } catch (error) {
      console.error("Error sending report:", error);
    }
  }


  // Process Parameter Data  ------------------------------------------------------------------------------
function ProcessRSMCommands(data){
 
    printDataViewContent(data);
    if(data.getUint8(4) == 0x05){
      CommadResposeType=2;

    }
    else{
  
    if(multyPacketParam==false){
  
      if (data.getUint8(4) == 0x02){ // Get Parameter value
        console.log("debug");
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

      }
        sendACK();
    }

    
  // Post processes parameter data--------------------------------------------------------------
  function PostProcesssesParameterData() {
    
    offset_count=1;
    paramPropertyStr=paramProperty;
    paramTypestr= String.fromCharCode(paramType);
    
    
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

    if(startup){
       updateDeviceInfo();
    }
    else if(switchHostmodeEnable){
      processswitchHostMode();
  
    }
    else{
       update_table();
    }
}

//Switch to host mode -------------------------------------------------------------------------------------
function switchHostMode(){

  switchHostmodeEnable=true;
  EnableSwitchhost();
  Request_parameter(135);

}
async function EnableSwitchhost(){
  if (!device) {
    console.log("Device not connected.");
    return;
  }

  const reportId = 0x0D;
  const data = [
    0x40, 0x00, 0x09, 0x00, 0x09, 0x05, 0x00, 
    0x4E, 0x2A, 0x42, 0x00, 0x01, 0x00, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00
  ];

  try {
    get_value_response = true;
    await device.sendReport(reportId, new Uint8Array(data));
    console.log("Switch host mode  Report sent successfully, Data :",data);
  } catch (error) {
    console.error("Error sending report:", error);
  } 
}

function processswitchHostMode(){

  console.log(paramValueStr);

  let hexArray = paramValueStr.split(' ').map(hex => parseInt(hex, 16));
  let extractedArray = hexArray.slice(0, 15);
  console.log("exdat",extractedArray);
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
  SendData_32pckt(finalArray)



 extractedArray = hexArray.slice(71, 80);
 prependArray = [
 0x00, 0x00, 0x09,];
 finalArray = prependArray.concat(extractedArray);
 SendData_32pckt(finalArray)

 switchHostmodeEnable=false;
 location.reload();


}

async function SendData_32pckt(data){
  if (!device) {
    console.log("Device not connected.");
    return;
  }

  const reportId = 0x0D;

  try {
    get_value_response = true;
    await device.sendReport(reportId, new Uint8Array(data));
    console.log("Sent Report :", reportId, data.map(byte => '0x' + byte.toString(16).padStart(2, '0')));

  } catch (error) {
    console.error("Error sending report:", error);
  } 
}




 

  
  
  
 