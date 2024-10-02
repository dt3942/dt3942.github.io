// Discover HID Devices-------------------------------------------------------------------------
document.getElementById('discover-button').addEventListener('click', async () => {


    try {
      const devices = await navigator.hid.requestDevice({
          filters: [{ vendorId: 0x05e0 }]  // Optional: Add filters to narrow down the list of devices
      });

      if (devices.length === 0) {
          throw new Error('No devices selected');
      }
    }
      catch (error) {
        document.getElementById('output').innerText = `Failed to discover devices: ${error.message}`;
    }
    try {
      const devices = await navigator.hid.getDevices(); // Get already authorized devices

      if (devices.length === 0) {
          throw new Error('No devices found');
      }
      console.log(devices);

      const dropdown = document.getElementById('device-dropdown');
      dropdown.innerHTML = '';
      devices.forEach((device, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.text = `${device.productName} (${device.vendorId.toString(16)})`;
          dropdown.appendChild(option);
      });

      dropdown.style.display = 'block';     
      
  } catch (error) {
      document.getElementById('output').innerText = `Failed to discover devices: ${error.message}`;
  }
});

// Handle Connect to Selected Device----------------------------------------------------------------------
document.getElementById('connect-button').addEventListener('click', async () => {
  try {
      const dropdown = document.getElementById('device-dropdown');
      const selectedDeviceIndex = dropdown.value;
      const devices = await navigator.hid.getDevices();

      if (!devices[selectedDeviceIndex]) {
          throw new Error('Selected device not available');
      }

      const device = devices[selectedDeviceIndex];
      await device.open();  // This automatically connects to the 0th interface
      console.log(device);

      document.getElementById('output').innerText = `Connected to ${device.productName}`;
      device.addEventListener('inputreport', handleInputReport);

  } catch (error) {
      document.getElementById('output').innerText = `Failed to connect to device: ${error.message}`;
  }

   statup();
});