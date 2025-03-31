document.addEventListener("DOMContentLoaded", async function () {
    await showLoadingSpinner()
        const userPackages = await getUserPackageDetails();
        await getUserPackages(userPackages.packages);
    await hideLoadingSpinner()
});

async function getUserPackages(packages) {
  const tableBody = document.getElementById("packagesTableBody");
    packages.sort((a, b) => new Date(b.created) - new Date(a.created))
    console.log(packages)

    for (let index = 0; index < packages.length; index++) {
        const pkg = packages[index];
            // Create a row for the package
    const row = document.createElement("tr");

    // Details cell
    const detailsCell = document.createElement("td");
    detailsCell.textContent = pkg.packageTitle;
    row.appendChild(detailsCell);

    // Package ID cell
    const idCell = document.createElement("td");
    idCell.textContent = formatTimestamp(pkg.created);
    row.appendChild(idCell);

    // Recipients cell
    let recipientsArray;
    const recipientsCell = document.createElement("td");
    if (pkg.recipients.includes(";")) {
      recipientsArray = pkg.recipients.split(";").map((email) => email.trim());
    } else {
      recipientsArray = [pkg.recipients];
    }
    let viewedCount;
    let viewedArray;
    if (pkg.viewed != null) {
        viewedArray = await convertStringtoArray(pkg.viewed);
        viewedCount = viewedArray.length;
    }else {
        viewedArray = [];
        viewedCount = viewedArray.length;
      }
      recipientsArray.forEach((email) => {
        const span = document.createElement("span");
        span.classList.add("recipient");
      
        // Instead of .some(), use .find() to get the actual item
        const viewedItem = viewedArray.find(item => item.email === email);
      
        if (viewedItem) {
          // Now we can use viewedItem.viewed to format the timestamp
          span.innerHTML = `
            ${email}
            <span class="viewed">
              (Viewed package) ${formatTimestamp(viewedItem.viewed)}
            </span>
          `;
        } else {
          span.innerHTML = `${email} <span class="sent">(Sent)</span>`;
        }
      
        recipientsCell.appendChild(span);
      });
    row.appendChild(recipientsCell);
    // Viewed count cell (e.g., "1 / 2")
    const viewedCell = document.createElement("td");
    // Count only the recipients that appear in the viewed list.

    const totalRecipients = recipientsArray.length;
    viewedCell.textContent = `${viewedCount} / ${totalRecipients}`;
    row.appendChild(viewedCell);
    tableBody.appendChild(row);
    }
}

async function convertStringtoArray(str) {
  // Remove trailing comma (and any extra whitespace) using regex:
  str = str.replace(/,\s*$/, "");

  // Wrap the string in square brackets to create a valid JSON array:
  const jsonString = `[${str}]`;

  // Parse the JSON string into an array
  const jsonArray = JSON.parse(jsonString);
  console.log(jsonArray);
  return jsonArray;
}

function formatTimestamp(isoString) {
    const date = new Date(isoString);
    // Format using toLocaleString with custom options:
    return date.toLocaleString('en-GB', {
      month: 'numeric',     // e.g. "Mar"
      day: 'numeric',     // e.g. "28"
      year: 'numeric',    // e.g. "2025"
      hour: '2-digit',    // e.g. "12"
      minute: '2-digit',  // e.g. "45"
      hour12: true        // 12-hour format
    });
  }

async function getUserPackageDetails() {
  userEmail = sessionStorage.getItem("userEmail");
  const bodyData = {
    userEmail: userEmail,
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
    "https://prod-09.uksouth.logic.azure.com:443/workflows/b6548f109de94a83a5e08dcf3c3aec68/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0vhuihcX_LPN6kH4s4rYe-_PdrQNvBgYVIwAHPU01r0";
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
