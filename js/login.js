document.addEventListener("DOMContentLoaded", async function () {
    await setDetails()
    await getUserDetails()

    const profileMenu = document.getElementById('profileMenu');
    const dropdown = document.getElementById('dropdown');

    profileMenu.addEventListener('click', (e) => {
        dropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!profileMenu.contains(e.target)) {
        dropdown.classList.remove('active');
        }
    });

    function logout() {
        alert('Logging out...');
        // You can add your logout logic here (e.g., redirect or clear session)
    }
})

async function setDetails() {
    sessionStorage.setItem('userName','Josh Cole')
    sessionStorage.setItem('userEmail','Josh.cole@aureos.com')
    sessionStorage.setItem('userPic','https://images.profile.autodesk.com/ZRCJ32URKY489AXQ/profilepictures/x120.jpg?r=638608843165630000')
}

async function getUserDetails() {
    var userName = sessionStorage.getItem('userName')
    userEmail = sessionStorage.getItem('userEmail')
    var userPic = sessionStorage.getItem('userPic')

    document.getElementById("userName").textContent = userName;
    document.getElementById("userEmail").textContent = userEmail;
    document.getElementById("userPic").src = userPic;
}