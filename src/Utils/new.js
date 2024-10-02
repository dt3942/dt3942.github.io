document.getElementById('set-value').addEventListener('click', async () => {
    const table = document.getElementById('idTable');
    const rows = table.getElementsByTagName('tr');
    const updatedData = [];
  
    const data = [
      0x40, 0x00, 0x06, 0x00, 0x06, 0x02, 0x00, 
      0x00,0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
      0x00, 0x00, 0x00
    ];
  
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
  
    
  
  
  
    console.log(updatedData); 
  });