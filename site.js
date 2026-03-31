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

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-hero-slider]").forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(slider.querySelectorAll("[data-hero-dot]"));
    const prevBtn = slider.querySelector("[data-hero-prev]");
    const nextBtn = slider.querySelector("[data-hero-next]");

    if (!slides.length) return;

    let currentIndex = slides.findIndex((slide) =>
      slide.classList.contains("is-active")
    );

    if (currentIndex < 0) currentIndex = 0;

    let autoPlay = null;

    function showSlide(index) {
      currentIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === currentIndex);
      });

      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === currentIndex);
      });
    }

    function startAutoplay() {
      stopAutoplay();
      autoPlay = setInterval(() => {
        showSlide(currentIndex + 1);
      }, 5200);
    }

    function stopAutoplay() {
      if (autoPlay) {
        clearInterval(autoPlay);
        autoPlay = null;
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        showSlide(currentIndex - 1);
        startAutoplay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        showSlide(currentIndex + 1);
        startAutoplay();
      });
    }

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        showSlide(index);
        startAutoplay();
      });
    });

    slider.addEventListener("mouseenter", stopAutoplay);
    slider.addEventListener("mouseleave", startAutoplay);
    slider.addEventListener("touchstart", stopAutoplay, { passive: true });
    slider.addEventListener("touchend", startAutoplay, { passive: true });

    showSlide(currentIndex);
    startAutoplay();
  });
});

document.querySelectorAll("[data-hero-slider]").forEach((slider) => {
  const slides = Array.from(slider.querySelectorAll("[data-hero-slide]"))
  const dots = Array.from(slider.querySelectorAll("[data-hero-dot]"))
  const prev = slider.querySelector("[data-hero-prev]")
  const next = slider.querySelector("[data-hero-next]")

  if (!slides.length) {
    return
  }

  let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"))
  if (activeIndex < 0) {
    activeIndex = 0
  }

  let autoplayId = null

  const setActive = (index) => {
    activeIndex = (index + slides.length) % slides.length

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeIndex)
    })

    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === activeIndex
      dot.classList.toggle("is-active", active)
      dot.setAttribute("aria-current", active ? "true" : "false")
    })
  }

  const stopAutoplay = () => {
    if (!autoplayId) {
      return
    }

    window.clearInterval(autoplayId)
    autoplayId = null
  }

  const startAutoplay = () => {
    stopAutoplay()
    autoplayId = window.setInterval(() => {
      setActive(activeIndex + 1)
    }, 5600)
  }

  prev?.addEventListener("click", () => {
    setActive(activeIndex - 1)
    startAutoplay()
  })

  next?.addEventListener("click", () => {
    setActive(activeIndex + 1)
    startAutoplay()
  })

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener("click", () => {
      setActive(dotIndex)
      startAutoplay()
    })
  })

  slider.addEventListener("mouseenter", stopAutoplay)
  slider.addEventListener("mouseleave", startAutoplay)
  slider.addEventListener("touchstart", stopAutoplay, { passive: true })
  slider.addEventListener("touchend", startAutoplay, { passive: true })

  setActive(activeIndex)
  startAutoplay()
})

document.querySelectorAll("[data-card-link]").forEach((card) => {
  const url = card.dataset.cardLink

  if (!url) {
    return
  }

  const navigate = () => {
    window.location.href = url
  }

  card.addEventListener("click", (event) => {
    if (event.target.closest("a, button, input, select, textarea, summary")) {
      return
    }

    navigate()
  })

  card.addEventListener("keydown", (event) => {
    if (event.target !== card) {
      return
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    navigate()
  })
})

document.querySelectorAll("[data-product-gallery]").forEach((gallery) => {
  const mainImage = gallery.querySelector("[data-gallery-main]")
  const thumbs = Array.from(gallery.querySelectorAll("[data-gallery-thumb]"))

  if (!mainImage || !thumbs.length) {
    return
  }

  const setActiveThumb = (button) => {
    thumbs.forEach((thumb) => {
      thumb.classList.toggle("is-active", thumb === button)
      thumb.setAttribute("aria-pressed", thumb === button ? "true" : "false")
    })
  }

  thumbs.forEach((button) => {
    button.addEventListener("click", () => {
      const src = button.dataset.gallerySrc
      const alt = button.dataset.galleryAlt

      if (!src) {
        return
      }

      mainImage.src = src
      if (alt) {
        mainImage.alt = alt
      }

      setActiveThumb(button)
    })
  })

  setActiveThumb(thumbs.find((thumb) => thumb.classList.contains("is-active")) || thumbs[0])
})
