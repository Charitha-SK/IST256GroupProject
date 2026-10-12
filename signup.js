// signup.js - validation, JSON storage, and the member list for signup.html

const form = document.getElementById("signupForm");
const messageBox = document.getElementById("message");
const memberList = document.getElementById("memberList");
const jsonBox = document.getElementById("jsonBox");
const submitBtn = document.getElementById("submitBtn");

form.setAttribute("novalidate", "novalidate");

let editingEmail = null;

function loadMembers() {
  const saved = localStorage.getItem("members");
  if (!saved) {
    return [];
  }
  try {
    return JSON.parse(saved);
  } catch (err) {
    return [];
  }
}

function saveMembers(members) {
  localStorage.setItem("members", JSON.stringify(members));
  showMembers(members);
}

function showMembers(members) {
  memberList.innerHTML = "";
  jsonBox.textContent = JSON.stringify(members, null, 2);

  if (members.length === 0) {
    memberList.textContent = "No members signed up yet.";
    return;
  }

  const table = document.createElement("table");
  table.className = "table table-bordered";
  table.innerHTML = "<thead><tr><th>Name</th><th>Age</th><th>Email</th><th>Phone</th><th>Address</th><th></th></tr></thead>";
  const body = document.createElement("tbody");

  members.forEach(function (m) {
    const tr = document.createElement("tr");
    [m.name, m.age, m.email, m.phone || "—", m.address].forEach(function (val) {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });

    const actions = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-sm btn-secondary";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", function () {
      document.getElementById("name").value = m.name;
      document.getElementById("age").value = m.age;
      document.getElementById("email").value = m.email;
      document.getElementById("phone").value = m.phone || "";
      document.getElementById("address").value = m.address;
      editingEmail = m.email;
      submitBtn.textContent = "Update Member";
      messageBox.style.color = "#1d5563";
      messageBox.textContent = "Editing " + m.name + ". Change the fields and hit Update Member.";
      window.scrollTo(0, 0);
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-sm btn-secondary";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", function () {
      const next = loadMembers().filter(function (row) {
        return row.email !== m.email;
      });
      if (editingEmail === m.email) {
        editingEmail = null;
        form.reset();
        submitBtn.textContent = "Sign Up";
      }
      saveMembers(next);
      messageBox.style.color = "green";
      messageBox.textContent = "Removed " + m.name + ".";
    });

    actions.appendChild(editBtn);
    actions.appendChild(removeBtn);
    tr.appendChild(actions);
    body.appendChild(tr);
  });

  table.appendChild(body);
  memberList.appendChild(table);
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const age = document.getElementById("age").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();

  const errors = [];

  if (name.length < 2 || !/^[A-Za-z][A-Za-z\s'.-]*$/.test(name)) {
    errors.push("Name is required (letters only, at least 2 characters).");
  }
  if (!/^\d+$/.test(age) || parseInt(age, 10) < 13 || parseInt(age, 10) > 120) {
    errors.push("Age must be a number between 13 and 120.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.push("Enter a valid email address (example: name@email.com).");
  }
  if (phone !== "" && !/^[0-9()\-\s.+]{7,20}$/.test(phone)) {
    errors.push("Phone can be left blank, or use a number like 315-555-0142.");
  }
  if (address.length < 5) {
    errors.push("Address is required (at least 5 characters).");
  }

  if (errors.length > 0) {
    messageBox.style.color = "red";
    messageBox.innerHTML = errors.join("<br>");
    return;
  }

  const member = {
    name: name,
    age: Number(age),
    email: email.toLowerCase(),
    phone: phone,
    address: address
  };

  const members = loadMembers();
  const sameEmail = members.findIndex(function (m) {
    return m.email === member.email;
  });

  if (editingEmail) {
    const idx = members.findIndex(function (m) {
      return m.email === editingEmail;
    });
    if (sameEmail !== -1 && member.email !== editingEmail) {
      messageBox.style.color = "red";
      messageBox.textContent = "That email is already registered.";
      return;
    }
    if (idx === -1) {
      members.push(member);
    } else {
      members[idx] = member;
    }
    editingEmail = null;
    submitBtn.textContent = "Sign Up";
    messageBox.style.color = "green";
    messageBox.textContent = "Updated " + name + ".";
  } else if (sameEmail !== -1) {
    messageBox.style.color = "red";
    messageBox.textContent = "That email is already registered.";
    return;
  } else {
    members.push(member);
    messageBox.style.color = "green";
    messageBox.textContent = "Thanks for signing up, " + name + "!";
  }

  saveMembers(members);
  form.reset();
});

document.getElementById("downloadBtn").addEventListener("click", function () {
  const members = loadMembers();
  const blob = new Blob([JSON.stringify(members, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "members.json";
  link.click();
});

showMembers(loadMembers());
