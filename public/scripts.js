// ...existing code...

document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbarr");
  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    if (window.scrollY > lastScrollY && window.scrollY > 50) {
      navbar.classList.add("hidden"); // Hide navbar when scrolling down
    } else {
      navbar.classList.remove("hidden"); // Show navbar when scrolling up
    }
    lastScrollY = window.scrollY;
  });
});

// ...existing code...