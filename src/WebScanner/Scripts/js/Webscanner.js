/*********************************************************************
 *
 *  Filename           :  Webscanner.js
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

// ============================
// Global Varibles
//============================
let device;
let devices;
let com_interface;
let barcode_device;
let device_connected = false;
let get_value_response = false;
const attribute = new Set();
const editedRows = new Set();
let multy_packet_param = true;
let paramID;
let paramType;
let paramProperty;
let paramTypestr;
let paramPropertyStr;
let paramValue = [];
let paramValueStr;
let multyPacketParam = false;
let param_lenght_cur = 0;
let multy_param_offset = false;
let multy_param_offset_res = false;
let offset_count = 1;
let startup = true;
let strtup_count = 1;
let selectedRow = null;
let SerialPort;
let SerialWriter;
let startwebscanner = true;
let firmware_update = false;
let switchHostmodeEnable = false;
let BleDevice;
let CommadResposeType = 0;
let CurrentHostMode;
let DeviceInfoUpdate = false;
let ACK_attstore = true;
let Connected_device;
let GetmodelName = false;

//============================
// Constants
//============================
const USB_HID = "1";
const SERIAL = "2";
const BLUETOOTH = "3";
const STARTUP_PARAMETER = 533;

const SNAPI = 0x09;
const HIDKB = 0x03;
const IBMHID = 0x01;
const CDC = 0x0e;
const SSI = 0x0e;
const IBMTT = 0x09;
const OPOS = 0x09;

const USB_HIDKB = "USB-HIDKB";
const USB_HIDKB_CMP = "USB-HIDKBCMP";
const USB_SNAPI = "USB-SNAPI";
const USB_IBMHID = "USB-IBMHID";
const SERIAL_COMPORT = "SERIAL COM Port";

// ==================================
//HTML Elements
//===================================
const Connect_button = document.getElementById("connect-button");
const Discover_button = document.getElementById("discover-button");
const Com_dropdown = document.getElementById("com-dropdown");
const table = document.getElementById("idTable");
const SetValueButton = document.getElementById("set-value");
const StoreValueButton = document.getElementById("store-value");
const GetValueButton = document.getElementById("get-value");
const tbody = table.querySelector("tbody");
const fwUpdateButton = document.getElementById("button-update");
const fwLaunchButton = document.getElementById("button-launch");
const fwAbortButton = document.getElementById("button-abort");
const DeviceDropdown = document.getElementById("device-dropdown");
const SwitchHostButton = document.getElementById("switch-host-button");
const HostVarientDropdown = document.getElementById("host-varient-dropdown");
const RebootButton = document.getElementById("reboot");
const FilePathScandef = document.getElementById("filePath2");
const FileInputScandef = document.getElementById("fileInput2");
const FilePathImage = document.getElementById("filePath3");
const FileInputImage = document.getElementById("fileInput3");
const Tab1button = document.getElementById("IDtab1");
const Tab1 = document.getElementById("Tab1");
const Scanneer_config_tab2 = document.getElementById("Tab2-maincontent");
const ScannerStatus_tab2 = document.getElementById("Tab2_status");
const SetConfiguration_Adv_Button = document.getElementById(
  "updateConfiguration"
);
const UpdateScandef_Button = document.getElementById("button-send-scandef");
const UpdateDeviceimahge_Button = document.getElementById("button-send-image");

//Inilitize HTML components-----------------------------
Connect_button.disabled = true;
Discover_button.disabled = true;
SetValueButton.disabled = true;
StoreValueButton.disabled = true;
GetValueButton.disabled = true;
fwUpdateButton.disabled = true;
fwLaunchButton.disabled = true;
fwAbortButton.disabled = true;
HostVarientDropdown.disabled = true;
SwitchHostButton.disabled = true;
RebootButton.disabled = true;
Tab1button.classList.add("active");
Tab1.style.display = "block";
UpdateScandef_Button.disabled = true;
UpdateDeviceimahge_Button.disabled = true;

//========================================================
//  Tab handling
//========================================================

function openTab(event, tabName) {
  var tabContent = document.getElementsByClassName("tab-content");
  for (var i = 0; i < tabContent.length; i++) {
    tabContent[i].style.display = "none";
  }
  var tabButtons = document.getElementsByClassName("tab-button");
  for (var i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove("active");
  }
  document.getElementById(tabName).style.display = "block";
  event.currentTarget.classList.add("active");
}

// ==============================================================
// Device Connections
//===============================================================

// Select Com interface-------------------------------------------
Com_dropdown.addEventListener("change", async () => {
  com_interface = Com_dropdown.value;
  Discover_button.disabled = false;
});

// Discover Scanners--------------------------------------------
Discover_button.addEventListener("click", async () => {
  if (com_interface == USB_HID) {
    Discover_Scanenrs_USB();
  } else if (com_interface == SERIAL) {
    Discover_Scanenrs_Serial();
  } else if (com_interface == BLUETOOTH) {
    Discover_Scanenrs_Bluetooth();
  }
});

// Handle Connect to Selected Device--------------------------------
Connect_button.addEventListener("click", async () => {
  if (com_interface == USB_HID) {
    Connect_Device_USB();
  } else if (com_interface == SERIAL) {
    Connect_Device_Serial();
  } else if (com_interface == BLUETOOTH) {
    Connect_Device_Bluetooth();
  }
});

//Switch Host mode ------------------------------------------------------

SwitchHostButton.addEventListener("click", async () => {
  if (com_interface == USB_HID) {
    SwitchHostMode_USB();
  } else if (com_interface == SERIAL) {
    switchHostModeSerial();
  }
});

HostVarientDropdown.addEventListener("change", async () => {
  if (HostVarientDropdown.value == "1") {
    CurrentHostMode = IBMHID;
  } else if (HostVarientDropdown.value == "2") {
    CurrentHostMode = HIDKB;
  } else if (HostVarientDropdown.value == "3") {
    CurrentHostMode = OPOS;
  } else if (HostVarientDropdown.value == "4") {
    CurrentHostMode = SNAPI;
  } else if (HostVarientDropdown.value == "5") {
    CurrentHostMode = CDC;
  } else if (HostVarientDropdown.value == "6") {
    CurrentHostMode = SSI;
  } else if (HostVarientDropdown.value == "7") {
    CurrentHostMode = IBMII;
  }
});

RebootButton.addEventListener("click", function () {
  if (com_interface == USB_HID) {
    RebootUSB();
  } else if (com_interface == SERIAL) {
    RebootSerial();
  }

  location.reload();
});

//=======================================================================
//  Scanner Configurations
//=======================================================================

// Update parametertable ------------------------------------------------
function update_table() {
  const tableBody = document.querySelector("#idTable tbody");
  const row = document.createElement("tr");
  const cellId = document.createElement("td");
  cellId.textContent = paramID;
  row.appendChild(cellId);

  const cellType = document.createElement("td");
  cellType.textContent = paramTypestr;
  row.appendChild(cellType);

  const cellProperty = document.createElement("td");
  cellProperty.textContent = paramProperty;
  row.appendChild(cellProperty);

  const cellValue = document.createElement("td");
  const inputValue = document.createElement("input");
  inputValue.type = "text";
  inputValue.value = paramValueStr;
  inputValue.setAttribute("data-id", paramID);
  inputValue.addEventListener("change", () => {
    editedRows.add(paramID);
  });
  cellValue.appendChild(inputValue);
  row.appendChild(cellValue);
  tableBody.appendChild(row);

  row.addEventListener("click", selectRow);
}
//Get Attribute --------------------------------------------------------------

GetValueButton.addEventListener("click", async () => {
  const input = parseInt(document.getElementById("get-value-input").value);
  if (com_interface == USB_HID) {
    if (Connected_device == USB_IBMHID) {
      ATT_Get_USBIBM(input);
    } else {
      ATT_Get_USB(input);
    }
  } else if (com_interface == SERIAL) {
     ATT_Get_Serial(input);
  }
});

// Set Attribute ------------------------------------------------------------

function selectRow(event) {
  document
    .querySelectorAll("#idTable tbody tr")
    .forEach((row) => row.classList.remove("selected"));
  selectedRow = event.currentTarget;
  selectedRow.classList.add("selected");
}

SetValueButton.addEventListener("click", async () => {
  if (selectedRow) {
    const cells = selectedRow.getElementsByTagName("td");
    var id = cells[0].textContent;
    var type = cells[1].textContent;
    var property = cells[2].textContent;
    var value = cells[3].getElementsByTagName("input")[0].value;

    if (com_interface == USB_HID) {
      ATT_Set_USB(id, type, property, value);
    } else if (com_interface == SERIAL) {
      ATT_Set_Serial(id, type, property, value);
    }
  } else {
    alert("Please select a parameter to set value");
  }
});
table.querySelectorAll("tbody tr").forEach((row) => {
  row.addEventListener("click", selectRow);
});

// Store Parameter ---------------------------------------------------------------------
StoreValueButton.addEventListener("click", async () => {
  if (selectedRow) {
    const cells = selectedRow.getElementsByTagName("td");
    var id = cells[0].textContent;
    var type = cells[1].textContent;
    var property = cells[2].textContent;
    var value = cells[3].getElementsByTagName("input")[0].value;
    if (com_interface == USB_HID) {
    } else if (com_interface == SERIAL) {
    }
  } else {
    alert("Please select a parameter to store value");
  }
});
table.querySelectorAll("tbody tr").forEach((row) => {
  row.addEventListener("click", selectRow);
});

// =============================================================
// Device Information
//==============================================================

//Build jepef image form byte data------------------------------

function drawImageFromByteArray_jpeg(byteArray) {
  const canvas = document.getElementById("Canvas");
  const context = canvas.getContext("2d");

  const blob = new Blob([new Uint8Array(byteArray)], { type: "image/jpeg" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
  };
  img.src = url;
}
// Statup(load device information)----------------------------------
async function statup() {
  Startloading();
  startup = true;
  if (com_interface == USB_HID) {
    await ATT_Get_USB(STARTUP_PARAMETER);
  } else if (com_interface == SERIAL) {
    await Request_parameterSerial(STARTUP_PARAMETER);
  }
}

// Update device info-------------------------------------------------
function updateDeviceInfo() {
  console.log("Inside device info");

  const requestParams = [
    { id: "scannerModel", param: 534 },
    { id: "serialNum", param: 535 },
    { id: "dom", param: 20012 },
    { id: "firmware", param: 616 },
    { id: "config", param: 15109 },
    { id: "decode-count", param: 15011 },
    { id: "power-count", param: 20000 },
    { id: "battery", param: 20000 },
    { id: "camera", param: 2471 },
  ];

  if (strtup_count > 0 && strtup_count <= requestParams.length) {
    const { id, param } = requestParams[strtup_count - 1];
    document.getElementById(id).innerText = paramValueStr;

    if (com_interface === USB_HID) {
      ATT_Get_USB(param);
    } else {
      Request_parameterSerial(param);
    }

    strtup_count++;
  } else if (strtup_count === 10 && paramValueStr !== "N/A") {
    const byteArray = paramValueStr
      .match(/0x[0-9A-Fa-f]+/g)
      .map((hex) => parseInt(hex, 16));
    console.log("Image data:", byteArray);
    drawImageFromByteArray_jpeg(byteArray);

    if (com_interface === USB_HID) {
      ATT_Get_USB(5032);
    } else {
      Request_parameterSerial(5032);
    }
    strtup_count++;
  } else if (strtup_count === 11 && paramValueStr !== "N/A") {
    const byteArray = paramValueStr
      .match(/0x[0-9A-Fa-f]+/g)
      .map((hex) => parseInt(hex, 16));
    UpdateDeviceInfo_FromScandef(byteArray);
    strtup_count = 1;
    startup = false;
    CloseLoading();
    return;
  }
}

// Enable buttons----------------------------------------------------------------------------
function EnableButtons() {
  SetValueButton.disabled = false;
  StoreValueButton.disabled = false;
  GetValueButton.disabled = false;
  fwUpdateButton.disabled = false;
  fwLaunchButton.disabled = false;
  fwAbortButton.disabled = false;
  HostVarientDropdown.disabled = false;
  SwitchHostButton.disabled = false;
  RebootButton.disabled = false;
  Scanneer_config_tab2.style.display = "block";
  ScannerStatus_tab2.style.display = "none";
  UpdateScandef_Button.disabled = false;
  UpdateDeviceimahge_Button.disabled = false;
}
