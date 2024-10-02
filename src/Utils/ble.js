document.getElementById('connectButton').addEventListener('click', connectBluetoothDevice);

async function connectBluetoothDevice() {
    try {
        // Request Bluetooth device
        const device = await navigator.bluetooth.requestDevice({
            //filters: [{ namePrefix: 'DS8178' }], // Adjust this filter as needed
            acceptAllDevices: true,
             optionalServices: ['battery_service'] // Required to access service later.

             
        });

        document.getElementById('status').innerText = `Status: Connecting to ${device.name}`;

        // Connect to the device's GATT server
        const server = await device.gatt.connect();
        console.log('Connected to GATT server');

        // Get the primary service (replace 'custom_service_uuid' with the correct service UUID for Zebra scanner)
        const service = await server.getPrimaryService('custom_service_uuid');

        // Get the characteristic (replace 'custom_characteristic_uuid' with the correct characteristic UUID for Zebra scanner)
        const characteristic = await service.getCharacteristic('custom_characteristic_uuid');

        // Read from the characteristic (assuming it supports read)
        const value = await characteristic.readValue();
        const data = new TextDecoder().decode(value);
        console.log('Data from scanner:', data);

        document.getElementById('status').innerText = `Status: Connected to ${device.name}`;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('status').innerText = `Status: Error connecting to device`;
    }
}
