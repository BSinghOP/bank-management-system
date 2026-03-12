const API = "http://49.43.161.62:3000";   // use localhost while developing

function login() {
    fetch(API + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
        })
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem("token", data.token);
        window.location = "dashboard.html";
    });
}

function getBalance() {
    fetch(API + "/balance", {
        headers: { Authorization: localStorage.getItem("token") }
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("balance").innerText = "Balance: ₹" + data.balance;
    });
}

function transfer() {
    fetch(API + "/transfer", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token")
        },
        body: JSON.stringify({
            receiverEmail: document.getElementById("receiver").value,
            amount: document.getElementById("amount").value
        })
    })
    .then(res => res.text())
    .then(alert);
}

function logout(){
    localStorage.removeItem("token");
    window.location = "index.html";
}
