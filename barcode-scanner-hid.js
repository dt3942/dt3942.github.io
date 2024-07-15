let device;
let device_connected = false;
let get_value_response = false;
const attribute = new Set();
const editedRows = new Set();

//Update current state of buttons
function updateButtonState(element) {
    const button = document.getElementById(element);
    if (device_connected) {
      button.removeAttribute('disabled');
    } else {
      button.setAttribute('disabled', 'true');
    }
}

updateButtonState('get-value');
updateButtonState('set-value');

document.getElementById('connect-button').addEventListener('click', async () => {
    try {
        const devices = await navigator.hid.requestDevice({
            filters: [{ vendorId: 0x05e0 }] // Replace with the correct vendorId
        });
        if (devices.length === 0) {
            throw new Error('No device selected');
        }
        device = devices[0];
        await device.open();
        device_connected = true;

        updateButtonState('get-value');
        updateButtonState('set-value');
        document.getElementById('output').innerText = 'Connected to barcode scanner';
        device.addEventListener('inputreport',handleInputReport);

    } catch (error) {
        //console.error(error);
        document.getElementById('output').innerText = `Failed to connect to barcode scanner: ${error.message}`;
    }
});

function handleInputReport(event){
  //console.log(event);
  const { data, reportId } = event;
  if(get_value_response && reportId == 0x27){
    get_value_response = false;
    processGetValueResponse(data);
  }
  if(data.getUint8(0) == 0x01 && reportId == 0x22){
    processBarcodeData(data);
  }
}

function processBarcodeData(data){
  let barcodeData = '';
  for (let i = 5; i < 5 + data.getUint8(2) ; i++) {
    barcodeData += String.fromCharCode(data.getUint8(i));
  }
  const barcodeInput = document.getElementById('barcode-data');
  barcodeInput.type = 'text';
  barcodeInput.value = barcodeData;
}

function processGetValueResponse(data){
  if (data.getUint8(4) == 0x02){
    //const bytes = new Uint8Array(data.buffer);
    //packets.push(bytes);
    const highByte = data.getUint8(6);  // 7th byte (index 6 in 0-based array)
    const lowByte = data.getUint8(7);   // 8th byte (index 7 in 0-based array)
    // Combine the high byte and low byte to get the integer value
    const id = (highByte << 8) | lowByte;
    if (id == 0xffff){
      return;
    }

    if(!attribute.has(id)){
      attribute.add(id);
    }else{
      return;
    }
    const type = data.getUint8(8);
    const property = data.getUint8(9);
    const value = data.getUint8(10);

    const tableBody = document.querySelector('#idTable tbody');
    const row = document.createElement('tr');
    const cellId = document.createElement('td');
    cellId.textContent = id;
    row.appendChild(cellId);

    const cellType = document.createElement('td');
    cellType.textContent = type;//`0x${type.toString(16).padStart(2, '0')}`;
    row.appendChild(cellType);

    const cellProperty = document.createElement('td');
    cellProperty.textContent = property; //`0x${property.toString(16).padStart(2, '0')}`;
    row.appendChild(cellProperty);

    const cellValue = document.createElement('td');
    const inputValue = document.createElement('input');
    inputValue.type = 'text';
    inputValue.value = value;
    inputValue.setAttribute('data-id', id); // Adding a data attribute for easy identification
    inputValue.addEventListener('change', () => {
      editedRows.add(id); // Mark row as edited when value changes
    });
    cellValue.appendChild(inputValue);
    row.appendChild(cellValue);

    tableBody.appendChild(row);
  }
}

document.getElementById('get-value').addEventListener('click', async () => {
  if (!device) {
    console.log("Device not connected.");
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
    console.log("Report sent successfully.");
  } catch (error) {
    console.error("Error sending report:", error);
  }
});

document.getElementById('set-value').addEventListener('click', async () => {
  const table = document.getElementById('idTable');
  const rows = table.getElementsByTagName('tr');
  const updatedData = [];

  for (let i = 1; i < rows.length; i++) { // Skipping the header row
      const cells = rows[i].getElementsByTagName('td');
      const id = cells[0].textContent;

      if (editedRows.has(Number(id))) { // Only process edited rows
          const type = cells[1].textContent;
          const property = cells[2].textContent;
          const value = cells[3].getElementsByTagName('input')[0].value;
          updatedData.push({ id, type, property, value });
      }
  }

  if(!updatedData){
    return;
  }

  console.log(updatedData); // You can replace this with your desired action
});

