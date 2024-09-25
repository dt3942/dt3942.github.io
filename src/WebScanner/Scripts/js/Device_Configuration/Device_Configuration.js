
// Sample XML content
let config_xml;



let parameter_count=1;
let num_of_parameters=0;
let UpdateDeviceConfigurations=false;

const parameterValueTypes = {};
const initialValues = {};
//Update UI form Scandef----------------------------------------------------
function UpdateDeviceInfo_FromScandef(data){

    let length_msb = data[0];  
    let length_lsb = data[1]; 

    let length = (length_msb << 8) | length_lsb;
    let OriginalData = data.slice(2, 2 + length); 
 
   regenerateXml(OriginalData);
}

// Regenerate XML form byte array---------------------------------------------
function regenerateXml(byteArray) {
    // 
    let regeneratedXml = '';
    byteArray.forEach(byte => {
        regeneratedXml += String.fromCharCode(byte);
    });

   
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(regeneratedXml, "application/xml");

  
    const parserError = xmlDoc.getElementsByTagName("parsererror");
    if (parserError.length > 0) {
        console.error("Error parsing XML:", parserError[0].textContent);
        //return;
    }
    console.log("Regenerated xml:",regeneratedXml);
    displayParameterNames(xmlDoc);

}

// Set parameter------------------------------------------------------------------
function SetParameter(id,type,property,value) {
    console.log(`Setting parameter: ID = ${id},Type = ${type},Property = ${property}, Value = ${value}`);
    ATT_Set_USB(id,type,property,value);
  
   
}

// Set N th parameter form XML---------------------------------------------------
function Set_Nth_Parameter_fromXML(xml,n) {
    console.log("Set config:",n);
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(xml, "application/xml");

    let parameters = xmlDoc.getElementsByTagName("parameter");

    if (n > 0 && n <= parameters.length) {
        let param = parameters[n - 1];
        let id = param.getAttribute("id");
        let type = param.getAttribute("type");
        let value = param.getAttribute("value");
        SetParameter(id,type,0,value);
    } else {
        //WebScannerAlert("No Updated parameters");
        UpdateDeviceConfigurations=false; 
    }
}

// Update Configurations-------------------------------------------------------

SetConfiguration_Adv_Button.addEventListener('click', async () => {

  await generateXml();

   
  
  });


  // Get number of parameters in xml-----------------------------------------

  function getNumberOfParameters(xml) {
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(xml, "application/xml");
    let parameters = xmlDoc.getElementsByTagName("parameter");
    return parameters.length;
}


// Update UI form XML----------------------------------------------------------
function displayParameterNames(xmlDoc) {


  const parameters = xmlDoc.getElementsByTagName("parameter");

  // Hide all form groups initially
  document.querySelectorAll('.form-group').forEach(div => {
      div.style.display = 'none';
  });

  for (let i = 0; i < parameters.length; i++) {
      const id = parameters[i].getAttribute('id');
      const valueType = parameters[i].getAttribute('value-type');
      if (id && valueType) {
          parameterValueTypes[id] = valueType;
      }
      const formGroup = document.getElementById(id);
      if (formGroup) {
          formGroup.style.display = 'flex';
          const input = formGroup.querySelector('select, input[type="range"], input[type="number"], input[type="checkbox"], input[type="text"]');
          if (input) {
              if (input.type === 'checkbox') {
                  initialValues[id] = input.checked;
              } else {
                  initialValues[id] = input.value;
              }
          }
      }
  }

  // Set form elements to their default values
  setDefaultValues();
    
  }


  
  function setDefaultValues() {
    document.querySelectorAll('.form-group').forEach(group => {
        const defaultValue = group.getAttribute('default');
        if (defaultValue !== null) {
            const input = group.querySelector('select, input[type="number"], input[type="checkbox"], input[type="text"]');
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = defaultValue === '1';
                } else if (input.type === 'select-one') {
                    input.value = defaultValue;
                } else {
                    input.value = defaultValue;
                }
            }
        }
    });
}

function generateXml() {
    const formGroups = document.querySelectorAll('.form-group');
    let config_xml = `<parameters>\n`;

    formGroups.forEach(group => {
        const input = group.querySelector('select, input[type="range"], input[type="number"], input[type="checkbox"], input[type="text"]');
        const id = group.id;
        const valueType = parameterValueTypes[id];
        const defaultValue = group.getAttribute('default');
        if (input) {
            let value;
            if (input.type === 'checkbox') {
                value = input.checked ? '1' : '0';
            } else if (input.type === 'select-one') {
                value = input.value;
            } else {
                value = input.value;
            }
            if (value !== defaultValue) {
              config_xml += `  <parameter id="${id}" value="${value}" type="${valueType}"></parameter>\n`;
            }
        }
    });

    config_xml += `</parameters>`;
     

    console.log(config_xml);
    if(com_interface==USB_HID){
      UpdateConfiguration_USB(config_xml)
    
    }else if(com_interface==SERIAL){ 
      UpdateConfiguration_Serial(config_xml)
    }
    else if(com_interface==BLUETOOTH){
      
    }
    
}