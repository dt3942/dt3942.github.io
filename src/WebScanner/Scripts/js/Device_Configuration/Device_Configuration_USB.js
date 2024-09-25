function UpdateConfiguration_USB(xml){

    num_of_parameters=getNumberOfParameters(xml);
    UpdateDeviceConfigurations=true;
    Set_Nth_Parameter_fromXML(xml,1);
    parameter_count=2;
    console.log("Tottal len:",num_of_parameters);


}

function Update_Device_Config_Responce_USB(data,reportID){

    
  if(reportID==0x27 && data.getUint8(4) == 0x05){

    sendACK(); 
    console.log("ACK Recived : ATT Store");
    if(parameter_count<=num_of_parameters){
        Set_Nth_Parameter_fromXML(config_xml,parameter_count);
        parameter_count++;
    }
    else{

        UpdateDeviceConfigurations=false; 
    }

    }


}


