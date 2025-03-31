document.addEventListener("DOMContentLoaded", async function () {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const fileList = document.getElementById("file-list");

  // When drop zone is clicked, trigger file input click
  dropZone.addEventListener("click", () => {
    fileInput.click();
  });

  // Handle file selection via click
  fileInput.addEventListener("change", (e) => {
    const files = e.target.files;
    globalFiles = files;
    console.log(files);
    addFiles(files);
    // Reset file input so same file can be reselected if needed
    fileInput.value = "";
  });

  // Prevent default drag behaviors for the entire document
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    document.addEventListener(eventName, (e) => e.preventDefault());
  });

  // Highlight drop zone when files are dragged over it
  dropZone.addEventListener("dragover", () => {
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  // Handle drop event
  dropZone.addEventListener("drop", (e) => {
    dropZone.classList.remove("dragover");
    const files = e.dataTransfer.files;
    addFiles(files);
  });

  // Add files from input or drop to our list
  function addFiles(files) {
    Array.from(files).forEach((file) => {
      // Optionally, you can check for duplicates here
      selectedFiles.push(file);
    });
    displayFiles();
  }

  // Display the list of files with a Remove button
  function displayFiles() {
    console.log(selectedFiles);
    fileList.innerHTML = "";
    selectedFiles.forEach((file, index) => {
      const div = document.createElement("div");
      div.className = "file-item";
      // Display file name
      const fileSizeInBytes = file.size;
      const fileSizeInKb = fileSizeInBytes / 1024;
      const fileSizeText =
        fileSizeInKb > 1024
          ? (fileSizeInKb / 1024).toFixed(2) + " MB"
          : fileSizeInKb.toFixed(2) + " KB";
      const span = document.createElement("span");
      span.textContent = `${file.name} - (${fileSizeText})`;

      const removeButton = document.createElement("button");
      removeButton.textContent = "Remove";
      removeButton.className = "remove-btn";
      removeButton.addEventListener("click", () => {
        removeFile(index);
      });
        const progressBarContainer = document.createElement("div") 
        progressBarContainer.className = 'progress-container'
        const progressBar = document.createElement("div") 
        progressBar.id = `progress-bar-${index}`
        progressBar.className = 'progress-bar'
        progressBarContainer.appendChild(progressBar)
        console.log(progressBarContainer)
      div.appendChild(span);
      div.appendChild(removeButton);
      div.appendChild(progressBarContainer);
      fileList.appendChild(div);
    });
  }

  // Remove file from the list and update the display
  function removeFile(index) {
    selectedFiles.splice(index, 1);
    displayFiles();
  }

  //////////////////////////////////////

  const recipientInput = document.getElementById("recipientInput");
  const emailTagsContainer = document.getElementById("emailTags");
  let recipients = [];

  // Function to validate email addresses
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  // Create a tag element for a valid email
  function createEmailTag(email) {
    const tag = document.createElement("div");
    tag.classList.add("email-tag");

    const emailSpan = document.createElement("span");
    emailSpan.textContent = email;
    tag.appendChild(emailSpan);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      // Remove the email from the recipients array
      recipients = recipients.filter((e) => e !== email);
      // Remove the tag element from the container
      emailTagsContainer.removeChild(tag);
    });
    tag.appendChild(removeBtn);

    // Insert the tag before the input field
    emailTagsContainer.insertBefore(tag, recipientInput);
  }

  // Listen for key events on the recipient input
  recipientInput.addEventListener("keydown", async function (e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const email = recipientInput.value.trim().replace(/,$/, "");
      if (email && isValidEmail(email)) {
        if (!recipients.includes(email)) {
          recipients.push(email);
          createEmailTag(email);
        }
        recipientInput.value = "";
      } else if (email) {
        alert("Please enter a valid email address.");
      }
    }
  });

  // Handle form submission
  document.getElementById("transferForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      document.getElementById("submitButton").disabled = true;
      const buttons = document.querySelectorAll(".remove-btn");
      buttons.forEach((button) => {
        button.disabled = true;
      });
      // Select all form controls inside the form
      const formElements = this.querySelectorAll(
        "input, textarea, select, button"
      );

      // Disable each control
      formElements.forEach(function (element) {
        element.disabled = true;
      });
      const transferTitle = document.getElementById("transferTitle").value;
      const expiry = document.getElementById("expiry").value;
      const authentication = document.getElementById("security").value;
      //userEmail = sessionStorage.getItem('userEmail')
      console.log("Transfer Title:", transferTitle);
      console.log("Recipients:", recipients);
      console.log("Expiry (days):", expiry);
      console.log("Authentication:", authentication);
      if (recipients.length == 0) {
        alert("Please enter at least 1 recipient");
        return;
      }
      packageId = await generateGUID();
      accessToken = await getAccessToken("data:create data:write data:read");
      const packageFolder = await createFolder(
        accessToken,
        packageId,
        topFolder
      );

      packageFolderId = packageFolder.data.id;

      await runUpload();

      const packageData = {
        transfer_title: transferTitle,
        requestor: userEmail,
        recipients: await convertRecipientsArrayToString(recipients),
        expiry_days: parseInt(expiry, 10),
        authentication: parseInt(authentication,10),
        package_id: packageId,
        package_folder_id: packageFolderId,
      };
      console.log(packageData);
      await postPackageDetails(packageData);
      console.log("Upload Successful");
      await showUploadModal()
    });
});

async function convertRecipientsArrayToString(recipients) {
  return recipients.join("; ");
}

async function generateGUID() {
  return crypto.randomUUID();
}

async function createFolder(access_token, folderName, parentFolderId) {
  const bodyData = {
    jsonapi: {
      version: "1.0",
    },
    data: {
      type: "folders",
      attributes: {
        name: folderName,
        extension: {
          type: "folders:autodesk.bim360:Folder",
          version: "1.0",
        },
      },
      relationships: {
        parent: {
          data: {
            type: "folders",
            id: parentFolderId,
          },
        },
      },
    },
  };

  const headers = {
    "Content-Type": "application/vnd.api+json",
    Authorization: "Bearer " + access_token, // Make sure to replace access_token with your actual token
  };

  const requestOptions = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(bodyData),
  };

  const apiUrl = `https://developer.api.autodesk.com/data/v1/projects/b.${projectId}/folders`;

  try {
    const response = await fetch(apiUrl, requestOptions);
    const data = await response.json();

    if (response.ok) {
      console.log(`Folder created: ${folderName}`);
      return data; // Return the response data, which should contain the new folder's ID
    } else {
      console.error(`Failed to create folder: ${folderName}`, data);
      throw new Error(data.errors ? data.errors[0].detail : "Unknown error");
    }
  } catch (error) {
    console.error("Error creating folder:", error);
    throw error;
  }
}

async function getAccessToken(scopeInput) {
  const bodyData = {
    scope: scopeInput,
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
    "https://prod-30.uksouth.logic.azure.com:443/workflows/df0aebc4d2324e98bcfa94699154481f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jHsW0eISklveK7XAJcG0nhfEnffX62AP0mLqJrtLq9c";
  //console.log(apiUrl)
  //console.log(requestOptions)
  responseData = await fetch(apiUrl, requestOptions)
    .then((response) => response.json())
    .then((data) => {
      const JSONdata = data;

      //console.log(JSONdata)

      return JSONdata.access_token;
    })
    .catch((error) => console.error("Error fetching data:", error));

  return responseData;
}

async function postPackageDetails(data) {
  const bodyData = data;

  const headers = {
    "Content-Type": "application/json",
  };

  const requestOptions = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(bodyData),
  };

  const apiUrl =
    "https://prod-05.uksouth.logic.azure.com:443/workflows/3ffa1f225bc746e1a588f52a6dc867df/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=JcZX849paHOgprtFp4EXZghnJbc1ugWr2Q58NG4QboM";
  //console.log(apiUrl)
  //console.log(requestOptions)
  responseData = await fetch(apiUrl, requestOptions)
    .then((response) => response.json())
    .then((data) => {
      const JSONdata = data;
      console.log(JSONdata);
      //console.log(JSONdata.uploadKey)
      //console.log(JSONdata.urls)
      return JSONdata;
    })
    .catch((error) => console.error("Error fetching data:", error));
  return responseData;
}

// Function to show the modal
async function showUploadModal() {
    document.getElementById("uploadModal").style.display = "block";
  }

 