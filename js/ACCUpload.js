

async function runUpload() {
  const fileInput = document.getElementById("file-input");
  //uploadfiles = fileInput.files;
  const uploadfiles = selectedFiles;
  console.log(uploadfiles);
  if (uploadfiles.length == 0) {
    alert("Please select a minimum of 1 file to upload");
    return; // Exit the function
  }
  try {
    for (let i = 0; i < uploadfiles.length; i++) {
      const file = uploadfiles[i];
      setProgress(10,i)
      await uploadFile(file,i);
      setProgress(100,i)
    }
    console.log('All files uploaded successfully')
  } catch (error) {
    alert("Error uploading file, please contact tool admin");
  }
}

function createStorageLocation(AccessToken,filename,uploadFolderID){
    const bodyData = {
      "jsonapi": {
        "version": "1.0"
      },
      "data": {
        "type": "objects",
        "attributes": {
          "name": filename
        },
        "relationships": {
          "target": {
            "data": {
              "type": "folders",
              "id": uploadFolderID
            }
          }
        }
      }
    };
      const headers = {
          'Content-Type': 'application/vnd.api+json',
          'Authorization':"Bearer "+AccessToken,
      };

      const requestOptions = {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(bodyData),
      };

      const apiUrl = "https://developer.api.autodesk.com/data/v1/projects/b."+projectId+"/storage";
      //console.log(requestOptions)
      objectKey_local = fetch(apiUrl,requestOptions)
          .then(response => response.json())
          .then(data => {
              const JSONdata = data
              //console.log(JSONdata)
          //console.log(JSONdata.data.id)
          return JSONdata.data.id
          })
          .catch(error => console.error('Error fetching data:', error));
      return objectKey_local
  }

async function generateSignedURL(AccessToken,objectKey){

      const headers = {
          'Authorization':"Bearer "+AccessToken,
      };

      const requestOptions = {
          method: 'GET',
          headers: headers,
      };

      const apiUrl = "https://developer.api.autodesk.com/oss/v2/buckets/"+bucketKey+"/objects/"+objectKey+"/signeds3upload";
      //console.log(apiUrl)
      //console.log(requestOptions)
      signedURLData = await fetch(apiUrl,requestOptions)
          .then(response => response.json())
          .then(data => {
              const JSONdata = data
          //console.log(JSONdata)
          //console.log(JSONdata.uploadKey)
          //console.log(JSONdata.urls)
          return JSONdata
          })
          .catch(error => console.error('Error fetching data:', error));
      return signedURLData
  }

async function uploadtoSignURL(uploadURL,file) {
          const headers = {
              //'Authorization': 'Bearer ' + AccessToken,
              "Content-Type": 'application/octet-stream'
          };
          const apiUrl = uploadURL;
          const requestOptions = {
              method: 'PUT',
              headers: headers,
              body: file,
          };
          await uploadtoSignURLFetch(apiUrl,requestOptions)

          //.catch((error) => console.error('Error fetching data:', error));
  }

async function completeUpload(AccessToken, objectKey, uploadKey) {
      const bodyData = {
          "uploadKey": uploadKey
      }

      const headers = {
          'Authorization': 'Bearer ' + AccessToken,
          'Content-Type': 'application/json'
      };

      const requestOptions = {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(bodyData),
      };

  const apiUrl = "https://developer.api.autodesk.com/oss/v2/buckets/" + bucketKey + "/objects/" + objectKey + "/signeds3upload";

      console.log("apiURL: ", apiUrl)
      console.log("requestOptions: ", requestOptions)

      await fetch(apiUrl, requestOptions)
      .then(async response => {
          //console.log("Response status completeUpload:", response.status);
          //console.log("Response headers completeUpload:", response.headers);
          //console.log("Response body completeUpload:", await response.text()); // Log the raw body

          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
          }


      })
      //.catch(error => console.error('Error fetching data:', error));

  }

async function createFirstRevision(AccessToken,filename,uploadFolderID,objectKeyLong){
  const bodyData = {
      "jsonapi": { "version": "1.0" },
      "data": {
       
         "type": "items",
         "attributes": {
           "displayName": filename,
           "extension": {
             "type": "items:autodesk.bim360:File",
             "version": "1.0"
           }
         },
         "relationships": {
           "tip": {
             "data": {
               "type": "versions", "id": "1"
             }
           },
           "parent": {
             "data": {
               "type": "folders",
               "id": uploadFolderID
             }
           }
         }
       },
       "included": [
         {
           "type": "versions",
           "id": "1",
           "attributes": {
             "name": filename,
             "extension": {
               "type": "versions:autodesk.bim360:File",
               "version": "1.0"
             }
           },
           "relationships": {
             "storage": {
               "data": {
                 "type": "objects",
                 "id": objectKeyLong
               }
             }
           }
         }
       ]
     };
      const headers = {
          'Content-Type': 'application/vnd.api+json',
          'Accept':'application/vnd.api+json',
          'Authorization':"Bearer "+AccessToken,
      };

      const requestOptions = {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(bodyData),
      };

      const apiUrl = "https://developer.api.autodesk.com/data/v1/projects/b."+projectId+"/items";
      console.log("firstRevision RO: ",requestOptions)
      returnData = await fetch(apiUrl,requestOptions)
      .then(response => response.json())
      .then(data => {
          const JSONdata = data
      //console.log(JSONdata)
      //console.log(JSONdata.uploadKey)
      //console.log(JSONdata.urls)
      return JSONdata
      })
      .catch(error => console.error('Error fetching data:', error));
  return returnData
  }

async function uploadFile(file,index){
  console.log('Starting file upload for:',file)
  const filename = file.name
  const objectKeyLong = await createStorageLocation(accessToken,filename,packageFolderId);
  setProgress(20,index)
  const objectKeyShort = objectKeyLong.replace("urn:adsk.objects:os.object:wip.dm.emea.2/","")
  //console.log("objectKey: ",objectKeyShort)
  const signedURLData = await generateSignedURL(accessToken,objectKeyShort)
  setProgress(30,index)
  const uploadKey = signedURLData.uploadKey
  const uploadURL = signedURLData.urls[0]

  //console.log("uploadKey: ",uploadKey)
  //console.log("uploadURL: ",uploadURL)

  try{
      await uploadtoSignURL(uploadURL,file);
      setProgress(40,index)
      await completeUpload(accessToken,objectKeyShort,uploadKey);
      setProgress(50,index)
      const fileData = await createFirstRevision(accessToken,filename,packageFolderId,objectKeyLong);
      setProgress(80,index)
      //console.log(fileData)
      // const fileURN = fileData.included[0].id
      // fileURN = encodeURIComponent(fileURN)
      // console.log(fileURN)
      // const fileItemID = fileData.data.id
      // console.log(fileItemID)
      // const fileLink = fileData.data.links.webView.href
      // console.log(fileLink)
  } catch (error) {
      console.error('Error:', error);
  }
}


async function postCopyofItem(AccessToken,copyURN,objectKeyLong){
  const bodyData = {
      "jsonapi": { "version": "1.0" },
      "data": {

         "type": "items",
         "attributes": {
           "displayName": filename,
           "extension": {
             "type": "items:autodesk.bim360:File",
             "version": "1.0"
           }
         },
         "relationships": {
           "tip": {
             "data": {
               "type": "versions",
               "id": "1"
             }
           },
           "parent": {
             "data": {
               "type": "objects",
               "id": uploadFolderID
             }
           }
         }
       },
       "included": [
         {
           "type": "versions",
           "id": "1",
           "attributes": {
             "name": filename,
             "extension": {
               "type": "versions:autodesk.bim360:File",
               "version": "1.0"
             }
           },
           "relationships": {
             "storage": {
               "data": {
                 "type": "objects",
                 "id": objectKeyLong
               }
             }
           }
         }
       ]
     };
      const headers = {
          'Content-Type': 'application/vnd.api+json',
          'Accept':'application/vnd.api+json',
          'Authorization':"Bearer "+AccessToken,
          //'x-user-id':'116300ed-53f9-48ad-a525-ae928297620e'
      };

      const requestOptions = {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(bodyData),
      };

  const apiUrl = "https://developer.api.autodesk.com/data/v1/projects/b."+projectId+"/items?copyFrom="+copyURN;
  console.log(apiUrl)
  console.log(requestOptions)
  signedURLData = await fetch(apiUrl,requestOptions)
      .then(response => response.json())
      .then(data => {
          const JSONdata = data
      console.log(JSONdata)
      //console.log(JSONdata.uploadKey)
      //console.log(JSONdata.urls)
      return JSONdata
      })
      .catch(error => console.error('Error fetching data:', error));
  return signedURLData
  }

async function patchItemDetails(AccessToken){
  const newFileName = $("#DocNumber").val()+"."+fileExtension
  const bodyData = [{
      "jsonapi": {
        "version": 1.0
      },
      "data": {
        "type": "items",
        "id": fileItemID,
        "attributes": {
          "displayName": newFileName
        }
      }
    }];

  convertedBody = JSON.stringify(bodyData)
  const headers = {
      'Authorization':"Bearer "+AccessToken,
      'Content-Type': 'application/vnd.api+json'
  };
  console.log(convertedBody)

  const requestOptions = {
      method: 'PATCH',
      headers: headers,
      body: convertedBody
  };

  const apiUrl = "https://developer.api.autodesk.com/data/v1/projects/b."+projectId+"/items/"+fileItemID;
  console.log(apiUrl)
  console.log(requestOptions)
  signedURLData = await fetch(apiUrl,requestOptions)
      .then(response => response.json())
      .then(data => {
          const JSONdata = data
      console.log(JSONdata)
      //console.log(JSONdata.uploadKey)
      //console.log(JSONdata.urls)
      return JSONdata
      })
      .catch(error => console.error('Error fetching data:', error));
  return signedURLData
  }

// Function to find object by name
async function findObjectByName(name,data) {
  let output
  output = await data.find(obj => obj.name === name);
  //console.log(output)
  if(output && output.arrayValues && output.length === 0){

  }else{
      return output
  }

  }

  function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

  function viewFile(){
      // Use window.open to open a new tab
      window.open(fileLink, '_blank');
  }

function updateProgressBar(){
  const progressTotal = 7
  const progressBarMain = document.querySelector('.progress-bar-Main');
  progressCount++;
  progress = (progressCount / progressTotal) * 100;
  console.log(progress)
  gsap.to(progressBarMain, {
      x: `${progress}%`,
      duration: 0.5,
    });
}

function renameFile(input) {
  if (input.files && input.files.length > 0) {
      var file = input.files[0];
      var newName = $("#DocNumber").val()+"."+fileExtension; // New filename
      var newFile = new File([file], newName, { type: file.type });
      console.log(newFile)
      // Replace the original file with the renamed file in the file input
      //input.files[0] = newFile;
      return newFile
  }
}

function renameFileDrop(input) {

      var file = input.file;
      var newName = $("#DocNumber").val()+"."+fileExtension; // New filename
      var newFile = new File([file], newName);

      // Replace the original file with the renamed file in the file input
      //input.files = newFile;
      console.log(newFile)
      return newFile
  
}

function getFileExtension(filename) {
  return filename.match(/\.(.+)$/)[1];
}

async function uploadtoSignURLFetch(apiUrl, requestOptions){
  await fetch(apiUrl, requestOptions)  // Note the use of fetch.default
  .then(async (response) => {
      console.log("Response status uploadtoSignURL:", response.status);
      console.log("Response headers uploadtoSignURL:", response.headers);
      console.log("Response body uploadtoSignURL:", await response.text());

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

  })
}

function setProgress(percentage,elementIndex) {

  const value = Math.max(0, Math.min(100, percentage));
  const element = `progress-bar-${elementIndex}`
  console.log(element,value)
  document.getElementById(element).style.width = value + '%';
}
