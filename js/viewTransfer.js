document.addEventListener("DOMContentLoaded", async function () {
    // Get the query string part of the URL (everything after the ?)
    let queryString = window.location.search;

    // Create a URLSearchParams object from the query string
    urlParams = new URLSearchParams(queryString);
  const auth = urlParams.get('auth');
  //console.log(auth); 
  if(auth == 2){
    document.getElementById('authCode').classList.remove("hidden")
  }
  errorElement = document.getElementById("errorMessage");

});

function downloadZip() {
    const zip = new JSZip();
    // An array of file URLs to include in the zip
    const fileUrls = [
      '/files/document1.pdf',
      '/files/image1.jpg'
    ];

    // Fetch each file as a blob and add it to the zip
    Promise.all(
      fileUrls.map(url => 
        fetch(url)
          .then(resp => resp.blob())
          .then(blob => {
            // Extract file name from URL
            const fileName = url.split('/').pop();
            zip.file(fileName, blob);
          })
      )
    ).then(() => {
      // Generate the zip file asynchronously and trigger download
      zip.generateAsync({ type: 'blob' }).then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'files.zip';
        link.click();
      });
    });
  }
async function runGetPackageDetails() {    
    await showLoadingSpinner()
    errorElement.classList.add("hidden");

    // Extract the packageId parameter
    const packageId = urlParams.get('packageId');

    const recipientEmail = document.getElementById("recipientEmail").value;
    const authCode = document.getElementById("authCode").value;
    const packageDetails = await getPackageDetails(packageId,recipientEmail,authCode)
    if(packageDetails){
      await generatePackageTable(packageDetails)
      const packageDetailsElement = document.getElementById('packageDetails')
      packageDetailsElement.classList.remove("hidden")
    }
    await hideLoadingSpinner()
}

async function generatePackageTable(data) {
        // Function to format file sizes nicely
        function formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            const kb = bytes / 1024;
            if (kb < 1024) return kb.toFixed(2) + ' KB';
            const mb = kb / 1024;
            return mb.toFixed(2) + ' MB';
          }
      
          // Display package summary
          const packageSummaryDiv = document.getElementById('packageSummary');
          const packageData = data.packageData;
          packageSummaryDiv.innerHTML = `
            <h2>${packageData.title}</h2>
            <p><strong>Requestor:</strong> ${packageData.requestor}</p>
            <p><strong>Expiry Date:</strong> ${packageData.expiryDate}</p>
          `;
      
          // Build file table
          const fileTableDiv = document.getElementById('fileTable');
          let tableHTML = `
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>File Name</th>
                  <th>File Size</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
          `;
      
          data.fileData.forEach(file => {
            tableHTML += `
              <tr>
                <td><i class="${getFileIcon(file.fileName)}"></i></td>
                <td>${file.fileName}</td>
                <td>${formatFileSize(file.fileSize)}</td>
                <td><button onclick="downloadFile('${file.downloadUrl}', '${file.fileName}')" class="download-btn" download>Download</button></td>
              </tr>
            `;
          });
      
          tableHTML += `
              </tbody>
            </table>
          `;
          fileTableDiv.innerHTML = tableHTML;
}

function getFileIcon(fileName) {
    // Extract the file extension, making sure it's lowercase.
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'fa-regular fa-file-pdf';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'bmp':
        return 'fa-regular fa-file-image';
      case 'doc':
      case 'docx':
        return 'fa-regular fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fa-regular fa-file-excel';
      case 'ppt':
      case 'pptx':
        return 'fa-regular fa-file-powerpoint';
      case 'zip':
      case 'rar':
        return 'fa-regular fa-file-archive';
      case 'txt':
        return 'fa-regular fa-file-alt';
      default:
        return 'fa-regular fa-file';
    }
  }

async function downloadFile(fileUrl,fileName) {
  
fetch(fileUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.blob(); // get binary file
  })
  .then(blob => {
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName; // filename
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(downloadUrl); // cleanup
  })
  .catch(error => {
    console.error("Download failed:", error);
  });

}

  async function getPackageDetails(packageId,userEmail,authCode) {

    const bodyData = {
        "packageId":packageId,
        "recipientEmail":userEmail,
        "authCode":parseInt(authCode,10) || 0
    };
  
    const headers = {
      "Content-Type": "application/json",
    };
  
    const requestOptions = {
      method: "POST",
      headers: headers,
      body: JSON.stringify(bodyData),
    };
  
    const apiUrl =
      "https://prod-18.uksouth.logic.azure.com:443/workflows/4c087e0ffcb944f48f2bf2e55692ebc4/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p7yyMZQhSp8XJ3zP3J8XVmSR-pUFDE7aeqHHbgkDAB8";
    //console.log(apiUrl)
    //console.log(requestOptions)
    responseData = await fetch(apiUrl, requestOptions)
    .then(async (response) => {
      const JSONData = await response.json();
  
      if (response.status === 403) {
          
          if (errorElement) {
              errorElement.textContent = `${JSONData.message} || Access denied.`;
              errorElement.classList.remove("hidden");
              return
          }
          throw new Error("403 Forbidden");
      } else {
        return JSONData;
      }
  

  })
      .catch((error) => console.error("Error fetching data:", error));
    return responseData;
  }
  
  // Function to show the modal
  async function showUploadModal() {
      document.getElementById("uploadModal").style.display = "block";
    }