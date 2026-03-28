document.querySelectorAll(".nav").forEach((nav) => {
  const toggle = nav.querySelector(".nav-toggle")
  const links = nav.querySelector(".nav-links")

  if (!toggle || !links) {
    return
  }

  const setOpenState = (open) => {
    nav.classList.toggle("is-open", open)
    toggle.setAttribute("aria-expanded", open ? "true" : "false")
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu")
  }

  setOpenState(false)

  toggle.addEventListener("click", () => {
    setOpenState(!nav.classList.contains("is-open"))
  })

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      setOpenState(false)
    })
  })

  document.addEventListener("click", (event) => {
    if (window.innerWidth > 760 || nav.contains(event.target)) {
      return
    }

    setOpenState(false)
  })

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      setOpenState(false)
    }
  })
})
