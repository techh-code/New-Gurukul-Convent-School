let token = sessionStorage.getItem("ngcs_admin_token");
const loginView = document.getElementById("loginView"),
  dashboard = document.getElementById("dashboard"),
  status = document.querySelector(".form-status"),
  tbody = document.querySelector("#enquiryTable tbody");
function escapeHTML(value = "") {
  return String(value).replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ],
  );
}
async function loadEnquiries() {
  const r = await fetch("/api/admin/enquiries", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.status === 401) return signOut();
  const items = await r.json();
  document.getElementById("count").textContent = items.length;
  document.getElementById("empty").hidden = items.length > 0;
  tbody.innerHTML = items
    .map(
      (x) =>
        `<tr><td>${new Date(x.receivedAt).toLocaleString()}</td><td><b>${escapeHTML(x.name)}</b></td><td>${escapeHTML(x.phone)}<small>${escapeHTML(x.email)}</small></td><td>${escapeHTML(x.message)}</td><td><button class="delete" data-id="${x.id}">Delete</button></td></tr>`,
    )
    .join("");
}
function showDashboard() {
  loginView.hidden = true;
  dashboard.hidden = false;
  loadEnquiries();
}
function signOut() {
  sessionStorage.removeItem("ngcs_admin_token");
  token = null;
  dashboard.hidden = true;
  loginView.hidden = false;
}
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  status.className = "form-status";
  try {
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: document.getElementById("password").value,
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    token = data.token;
    sessionStorage.setItem("ngcs_admin_token", token);
    showDashboard();
  } catch (err) {
    status.classList.add("error");
    status.textContent = err.message;
  }
});
document.getElementById("logout").addEventListener("click", signOut);
document.getElementById("refresh").addEventListener("click", loadEnquiries);
tbody.addEventListener("click", async (e) => {
  if (!e.target.matches(".delete")) return;
  if (!confirm("Delete this enquiry?")) return;
  await fetch("/api/admin/enquiries/" + e.target.dataset.id, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  loadEnquiries();
});
if (token) showDashboard();
