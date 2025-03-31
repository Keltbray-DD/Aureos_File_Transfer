document.addEventListener("DOMContentLoaded", async function () {
    document.getElementById("appInfo").textContent = `${appName} ${appVersion}`;

})

async function showLoadingSpinner(element) {
    const loadingSpinner = document.getElementById('loading');
  
    // Show the loading spinner

    loadingSpinner.style.display = 'block';
  }
  
  async function hideLoadingSpinner(element) {
    const loadingSpinner = document.getElementById('loading');
  
    // Show the loading spinner
    loadingSpinner.style.display = 'none';

  }





