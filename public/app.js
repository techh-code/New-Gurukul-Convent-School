const menu = document.querySelector(".menu");
const nav = document.querySelector("nav");
menu.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menu.setAttribute("aria-expanded", open);
  menu.textContent = open ? "×" : "☰";
});
document.querySelectorAll("nav a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
    menu.textContent = "☰";
  }),
);
const observer = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        observer.unobserve(e.target);
      }
    }),
  { threshold: 0.12 },
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
document.getElementById("year").textContent = new Date().getFullYear();
const form = document.getElementById("enquiryForm");
const status = form.querySelector(".form-status");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  status.className = "form-status";
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const submit = form.querySelector("button");
  submit.disabled = true;
  submit.textContent = "Sending…";
  try {
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    status.textContent = result.message;
    form.reset();
  } catch (err) {
    status.classList.add("error");
    status.textContent =
      err.message || "Something went wrong. Please call us instead.";
  } finally {
    submit.disabled = false;
    submit.innerHTML = "Send enquiry <span>→</span>";
  }
});
