
let offset_Attstore=0;
let startIndex_Attstore=0;
let id_Attstore;
let type_Attstorte;
let property_Attstore;
let value_Attstore;
let value_Attstore240pckt;
let Pcktoffset240pckt;
let dcount=0;


async function StoreMultiPacketAttributes(id,type,property,value){

 let ValueLenght=value.length;
 console.log(ValueLenght);


let chunkSize = 227;



if(ValueLenght<227){
    value_Attstore240pckt=value.slice(0, ValueLenght);
    sendData_240pcktStart(id,type,property,0x00,value_Attstore240pckt,ValueLenght,0x00)

}
else{
        value_Attstore240pckt = value.slice(startIndex_Attstore, startIndex_Attstore + chunkSize);
        startIndex_Attstore += chunkSize;
        //console.log("data 240 packet:",Datachunk);
        await sendData_240pcktStart(id,type,property,0x00,value_Attstore240pckt,ValueLenght,offset_Attstore)
        offset_Attstore+=227;
   
}
 
}

// Send packet data (240 )via USB -Frist 32packet stat of the set offset------------------------------
async function sendData_240pcktStart(id, type, property,subProperty,value,lenght,offset){

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

        TotalPacketLenght_msb, TotalPacketLenght_lsb, 0x06,0x00, id_msb, id_lsb, type, property,
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
        await SendData_32pckt(data);
        Pcktoffset240pckt=15;
        
    }
 
}

//Process  device infor update USB------------------------------------------------------------------
async function ProcessDeviceInforUpdate(data,reportID){

    const datatoSend = [
        0x40, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00, 0x00, 0x00
      ];
    
      updateProgressbar2(offset_Attstore,value_Attstore.length);


    if(reportID==0x27 && data.getUint8(4) == 0x06){


        sendACK();
        
        console.log("ACK Recived : ATT Store");
        let ValueLenght=value_Attstore.length;
        let chunkSize = 227;

       if(startIndex_Attstore < ValueLenght) {

          if((ValueLenght-startIndex_Attstore)<227 ){
            value_Attstore240pckt = value_Attstore.slice(startIndex_Attstore,ValueLenght);
             startIndex_Attstore=ValueLenght;
             offset_Attstore=ValueLenght;
         }
          else{
            value_Attstore240pckt = value_Attstore.slice(startIndex_Attstore, startIndex_Attstore + chunkSize);
            startIndex_Attstore += chunkSize;
             }
        
           await sendData_240pcktStart(id_Attstore,type_Attstorte,property_Attstore,0x00,value_Attstore240pckt,ValueLenght,offset_Attstore)
           offset_Attstore+=227;
           dcount++;
           console.log(offset_Attstore);
           console.log(dcount);
    }
   

    }else if(reportID==0x21){

        let valuelength240pckt =value_Attstore240pckt.length;
        if(Pcktoffset240pckt < valuelength240pckt){
            let dataRemain=valuelength240pckt-Pcktoffset240pckt;
    
    
            if((dataRemain)<=0x1C){
                datatoSend.fill(0x00);
                console.log("stage3");
                datatoSend[0]=0x00;
                datatoSend[2]=dataRemain;
                valueOffset=value_Attstore240pckt.slice(Pcktoffset240pckt,valuelength240pckt);
                datatoSend.splice(3, dataRemain, ...valueOffset);
                await SendData_32pckt(datatoSend);
                Pcktoffset240pckt+=dataRemain;
                
            }
            else{
                console.log("stage2");
                datatoSend[0]=0x80;
                datatoSend[2]=0x1C;
                valueOffset=value_Attstore240pckt.slice(Pcktoffset240pckt,Pcktoffset240pckt+28)
                datatoSend.splice(3, 0x1C, ...valueOffset);
                await SendData_32pckt(datatoSend);
                Pcktoffset240pckt+=28;
    
    
            }
         
        }
        else{
            Pcktoffset240pckt=0;
        }         
    }

 }

// Update progressbar 2----------------------------------------------------------------------
 function updateProgressbar2(currentValue,maxValue) {
    const progressPercent = (currentValue / maxValue) * 100;
    const progressBar = document.getElementById('progressBar2');
    progressBar.style.width = progressPercent + '%';
    progressBar.textContent = progressPercent.toFixed(2) + '%'; 
 }


 // Get Scandef file input ----------------------------------------------------------------
 FilePathScandef.addEventListener('click', function() {
    FileInputScandef.click();
 });
 

 


function UpdateDeviceInfo_FromScandef(data){

console.log(data);


}