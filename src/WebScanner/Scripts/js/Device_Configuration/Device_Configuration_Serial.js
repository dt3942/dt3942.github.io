function UpdateConfiguration_Serial(xml){

    num_of_parameters=getNumberOfParameters(xml);
    UpdateDeviceConfigurations=true;
    Set_Nth_Parameter_fromXML(xml,1);
    parameter_count=2;


}

function Update_Device_Config_Responce_Serial(data,reportID){

    
    console.log("ACK Recived : ATT Set");
    if(parameter_count<=num_of_parameters){
        Set_Nth_Parameter_fromXML(config_xml,parameter_count); 
        parameter_count++;
    }
    else{

        UpdateDeviceConfigurations=false; 
        
    }

    


}


