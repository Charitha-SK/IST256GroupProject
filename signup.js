// signup.js - JavaScript validation + JSON storage for signup.html
// Add before </body> in signup.html:  <script src="signup.js"></script>

const form = document.getElementById("signupForm");
const messageBox = document.getElementById("message");

form.setAttribute("novalidate", "novalidate"); // use our own messages

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const age = document.getElementById("age").value.trim();
  const email = document.getElementById("email").value.trim();
  const address = document.getElementById("address").value.trim();

  // ---------- Validation ----------
  const errors = [];

  if (name.length < 2 || !/^[A-Za-z][A-Za-z\s'.-]*$/.test(name)) {
    errors.push("Name is required (letters only, at least 2 characters).");
  }
  if (!/^\d+$/.test(age) || Number(age) < 13 || Number(age) > 120) {
    errors.push("Age must be a number between 13 and 120.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.push("Enter a valid email address (example: name@email.com).");
  }
  if (address.length < 5) {
    errors.push("Address is required (at least 5 characters).");
  }

  if (errors.length > 0) {
    messageBox.style.color = "red";
    messageBox.innerHTML = errors.join("<br>");
    return;
  }

  // ---------- JSON storage ----------
  const member = {
    name: name,
    age: Number(age),
    email: email.toLowerCase(),
    address: address,
  };

  let members = JSON.parse(localStorage.getItem("members")) || [];

  if (members.some((m) => m.email === member.email)) {
    messageBox.style.color = "red";
    messageBox.textContent = "That email is already registered.";
    return;
  }

  members.push(member);
  localStorage.setItem("members", JSON.stringify(members, null, 2));

  // Download the stored data as members.json (for the JSON screenshot)
  const blob = new Blob([JSON.stringify(members, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "members.json";
  link.click();

  messageBox.style.color = "green";
  messageBox.textContent = "Thanks for signing up, " + name + "!";
  form.reset();
});
