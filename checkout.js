const checkoutForm = document.getElementById("checkout-form")

if (checkoutForm) {
  const quantityField = document.getElementById("checkout-quantity")
  const submitButton = document.getElementById("checkout-submit")
  const whatsappButton = document.getElementById("whatsapp-checkout")
  const statusBox = document.getElementById("checkout-status")
  const paymentFields = Array.from(checkoutForm.querySelectorAll('input[name="payment_mode"]'))
  const paymentChoiceList = checkoutForm.querySelector(".payment-choice-list")
  const consentField = checkoutForm.elements.namedItem("consent")
  const consentRow = checkoutForm.querySelector(".checkout-consent")
  const summaryUnitPrice = document.getElementById("summary-unit-price")
  const summaryQuantity = document.getElementById("summary-quantity")
  const summaryShipping = document.getElementById("summary-shipping")
  const summaryPaymentMode = document.getElementById("summary-payment-mode")
  const summaryTotal = document.getElementById("summary-total")
  const unitPrice = Number(checkoutForm.dataset.unitPrice || "249")
  const fieldOrder = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "address",
    "city",
    "state",
    "pincode",
    "quantity",
    "note",
    "payment_mode",
    "consent",
  ]
  const fields = {
    first_name: checkoutForm.elements.namedItem("first_name"),
    last_name: checkoutForm.elements.namedItem("last_name"),
    email: checkoutForm.elements.namedItem("email"),
    phone: checkoutForm.elements.namedItem("phone"),
    address: checkoutForm.elements.namedItem("address"),
    city: checkoutForm.elements.namedItem("city"),
    state: checkoutForm.elements.namedItem("state"),
    pincode: checkoutForm.elements.namedItem("pincode"),
    quantity: checkoutForm.elements.namedItem("quantity"),
    note: checkoutForm.elements.namedItem("note"),
  }
  const quantityOptions = {
    "1": { label: "1 Pack", packs: 1 },
    "2": { label: "2 Packs", packs: 2 },
    "3": { label: "3 Packs", packs: 3 },
    "5": { label: "5 Packs", packs: 5 },
    bulk: { label: "Bulk enquiry", packs: 0 },
  }
  const paymentLabels = {
    cod: "Cash on Delivery",
    whatsapp: "WhatsApp Assistance",
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)

  const collapseSpaces = (value) => value.replace(/\s+/g, " ").trim()
  const sanitizeNameInput = (value) => value.replace(/[^A-Za-z\s'-]/g, "")
  const sanitizeLocationInput = (value) => value.replace(/[^A-Za-z\s.'-]/g, "")
  const sanitizePhoneInput = (value) => {
    const cleaned = value.replace(/[^\d+\-\s]/g, "")
    if (!cleaned.startsWith("+")) {
      return cleaned.replace(/\+/g, "")
    }

    return `+${cleaned.slice(1).replace(/\+/g, "")}`
  }
  const sanitizePincodeInput = (value) => value.replace(/\D/g, "").slice(0, 6)
  const sanitizeEmailInput = (value) => collapseSpaces(value).toLowerCase()
  const normalizePhoneValue = (value) => {
    const digits = value.replace(/\D/g, "")

    if (digits.length === 10) {
      return `+91${digits}`
    }

    if (digits.length > 10 && digits.startsWith("91")) {
      return `+${digits}`
    }

    if (value.trim().startsWith("+")) {
      return `+${digits}`
    }

    return digits
  }
  const getDigitsOnly = (value) => value.replace(/\D/g, "")
  const getSelectedPaymentMode = () =>
    checkoutForm.querySelector('input[name="payment_mode"]:checked')?.value || ""
  const getQuantityMeta = () => quantityOptions[quantityField.value] || quantityOptions["1"]

  const getFormValues = () => ({
    first_name: collapseSpaces(fields.first_name.value),
    last_name: collapseSpaces(fields.last_name.value),
    email: sanitizeEmailInput(fields.email.value),
    phone: normalizePhoneValue(fields.phone.value),
    address: collapseSpaces(fields.address.value),
    city: collapseSpaces(fields.city.value),
    state: collapseSpaces(fields.state.value),
    pincode: sanitizePincodeInput(fields.pincode.value),
    note: collapseSpaces(fields.note.value),
    quantity: String(fields.quantity.value || "1"),
    payment_mode: getSelectedPaymentMode(),
    consent: Boolean(consentField?.checked),
  })

  const getFullName = (values) =>
    [values.first_name, values.last_name].filter(Boolean).join(" ").trim()

  const getErrorElement = (name) => {
    let errorElement = checkoutForm.querySelector(`[data-error-for="${name}"]`)

    if (errorElement) {
      return errorElement
    }

    const field = fields[name]
    const fieldWrapper = field?.closest(".field")

    if (!fieldWrapper) {
      return null
    }

    errorElement = document.createElement("div")
    errorElement.className = "field-error"
    errorElement.dataset.errorFor = name
    errorElement.setAttribute("aria-live", "polite")
    fieldWrapper.append(errorElement)
    return errorElement
  }

  const setStatus = (type, message) => {
    statusBox.hidden = false
    statusBox.className = `checkout-status is-${type}`
    statusBox.textContent = message
  }

  const clearStatus = () => {
    statusBox.hidden = true
    statusBox.className = "checkout-status"
    statusBox.textContent = ""
  }

  const setFieldError = (name, message) => {
    const errorElement = getErrorElement(name)

    if (name === "payment_mode") {
      paymentChoiceList?.classList.toggle("is-invalid", Boolean(message))
      paymentFields.forEach((field) => field.setAttribute("aria-invalid", message ? "true" : "false"))
    } else if (name === "consent") {
      consentRow?.classList.toggle("is-invalid", Boolean(message))
      consentField?.setAttribute("aria-invalid", message ? "true" : "false")
    } else {
      const field = fields[name]
      const wrapper = field?.closest(".field")

      wrapper?.classList.toggle("is-invalid", Boolean(message))
      field?.setAttribute("aria-invalid", message ? "true" : "false")
    }

    if (errorElement) {
      errorElement.textContent = message || ""
    }
  }

  const focusField = (name) => {
    if (name === "payment_mode") {
      paymentFields[0]?.focus()
      return
    }

    if (name === "consent") {
      consentField?.focus()
      return
    }

    fields[name]?.focus()
  }

  const getPrimaryButtonLabel = () => {
    const quantityMeta = getQuantityMeta()
    const paymentMode = getSelectedPaymentMode()

    if (!quantityMeta.packs) {
      return "Request Bulk Quote"
    }

    if (paymentMode === "cod") {
      return "Confirm Cash on Delivery"
    }

    return "Continue on WhatsApp"
  }

  const buildWhatsAppUrl = (values, paymentMode, quantityMeta) => {
    const lines = [
      "Hi RudraBitez, I want to place an order.",
      `Name: ${getFullName(values) || "-"}`,
      `Phone: ${values.phone || "-"}`,
      `Email: ${values.email || "-"}`,
      `Quantity: ${quantityMeta.label}`,
      `Payment Mode: ${paymentLabels[paymentMode] || "WhatsApp Assistance"}`,
      `Address: ${values.address || "-"}, ${values.city || "-"}, ${values.state || "-"} - ${values.pincode || "-"}`,
    ]

    if (values.note) {
      lines.push(`Note: ${values.note}`)
    }

    return `https://wa.me/918591858021?text=${encodeURIComponent(lines.join("\n"))}`
  }

  const updateSummary = () => {
    const quantityMeta = getQuantityMeta()
    const paymentMode = getSelectedPaymentMode()
    const payableAmount = quantityMeta.packs * unitPrice
    const values = getFormValues()

    summaryUnitPrice.textContent = formatCurrency(unitPrice)
    summaryQuantity.textContent = quantityMeta.label
    summaryPaymentMode.textContent = paymentLabels[paymentMode] || "Choose payment"
    summaryShipping.textContent = quantityMeta.packs ? "Included" : "Custom quote"
    summaryTotal.textContent = quantityMeta.packs ? formatCurrency(payableAmount) : "Custom quote"
    submitButton.textContent = getPrimaryButtonLabel()
    whatsappButton.href = buildWhatsAppUrl(values, paymentMode || "whatsapp", quantityMeta)
  }

  const setLoading = (isLoading, loadingLabel = "Processing...") => {
    submitButton.disabled = isLoading
    whatsappButton.classList.toggle("is-disabled", isLoading)
    whatsappButton.setAttribute("aria-disabled", isLoading ? "true" : "false")
    submitButton.textContent = isLoading ? loadingLabel : getPrimaryButtonLabel()
  }

  const openWhatsAppCheckout = (paymentMode) => {
    const values = getFormValues()
    const quantityMeta = getQuantityMeta()
    const targetUrl = buildWhatsAppUrl(values, paymentMode, quantityMeta)

    window.open(targetUrl, "_blank", "noopener")
  }

  const validateField = (name) => {
    const values = getFormValues()

    switch (name) {
      case "first_name":
        if (!values.first_name) return "Please enter the customer's first name."
        if (values.first_name.length < 2) return "First name should be at least 2 letters."
        if (values.first_name.length > 30) return "First name should stay within 30 characters."
        if (!/^[A-Za-z][A-Za-z\s'-]*$/.test(values.first_name)) return "Use only letters, spaces, apostrophes or hyphens."
        return ""
      case "last_name":
        if (!values.last_name) return "Please enter the customer's last name."
        if (values.last_name.length < 2) return "Last name should be at least 2 letters."
        if (values.last_name.length > 30) return "Last name should stay within 30 characters."
        if (!/^[A-Za-z][A-Za-z\s'-]*$/.test(values.last_name)) return "Use only letters, spaces, apostrophes or hyphens."
        return ""
      case "email":
        if (!values.email) return "Please enter the customer's email address."
        if (values.email.length > 80) return "Email address should stay within 80 characters."
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return "Please enter a valid email address."
        return ""
      case "phone": {
        if (!values.phone) return "Please enter the customer's phone number."
        const digits = getDigitsOnly(values.phone)
        if (digits.length === 10) return ""
        if (digits.length === 12 && digits.startsWith("91")) return ""
        return "Use a valid Indian mobile number like 9876543210 or +919876543210."
      }
      case "address":
        if (!values.address) return "Please enter the delivery address."
        if (values.address.length < 10) return "Address should be detailed enough for delivery."
        if (values.address.length > 180) return "Address should stay within 180 characters."
        return ""
      case "city":
        if (!values.city) return "Please enter the city."
        if (values.city.length < 2) return "City should be at least 2 letters."
        if (values.city.length > 40) return "City should stay within 40 characters."
        if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(values.city)) return "City can include only letters, spaces, dots, apostrophes or hyphens."
        return ""
      case "state":
        if (!values.state) return "Please enter the state."
        if (values.state.length < 2) return "State should be at least 2 letters."
        if (values.state.length > 40) return "State should stay within 40 characters."
        if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(values.state)) return "State can include only letters, spaces, dots, apostrophes or hyphens."
        return ""
      case "pincode":
        if (!values.pincode) return "Please enter the 6-digit PIN code."
        if (!/^\d{6}$/.test(values.pincode)) return "PIN code must be exactly 6 digits."
        return ""
      case "quantity":
        if (!rudraHasQuantity(values.quantity)) return "Please choose a valid pack quantity."
        return ""
      case "note":
        if (values.note.length > 160) return "Delivery note should stay within 160 characters."
        return ""
      case "payment_mode":
        if (!values.payment_mode || !paymentLabels[values.payment_mode]) return "Please choose one payment mode to continue."
        return ""
      case "consent":
        if (!consentField.checked) return "Please confirm that the delivery and customer details are correct."
        return ""
      default:
        return ""
    }
  }

  const rudraHasQuantity = (value) => Boolean(quantityOptions[value])

  const validateAllFields = () => {
    const invalidFields = []

    fieldOrder.forEach((name) => {
      const error = validateField(name)
      setFieldError(name, error)

      if (error) {
        invalidFields.push(name)
      }
    })

    return invalidFields
  }

  const clearAllFieldErrors = () => {
    fieldOrder.forEach((name) => setFieldError(name, ""))
  }

  const applyInputFormatting = (target) => {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return
    }

    if (target.name === "first_name" || target.name === "last_name") {
      target.value = sanitizeNameInput(target.value)
    }

    if (target.name === "city" || target.name === "state") {
      target.value = sanitizeLocationInput(target.value)
    }

    if (target.name === "phone") {
      target.value = sanitizePhoneInput(target.value)
    }

    if (target.name === "pincode") {
      target.value = sanitizePincodeInput(target.value)
    }
  }

  const normalizeOnBlur = (target) => {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return
    }

    if (target.name === "first_name" || target.name === "last_name" || target.name === "city" || target.name === "state" || target.name === "address" || target.name === "note") {
      target.value = collapseSpaces(target.value)
    }

    if (target.name === "email") {
      target.value = sanitizeEmailInput(target.value)
    }
  }

  paymentFields.forEach((field) => {
    field.addEventListener("change", () => {
      setFieldError("payment_mode", validateField("payment_mode"))
      updateSummary()
      if (!statusBox.hidden && !validateField("payment_mode")) {
        clearStatus()
      }
    })
  })

  quantityField.addEventListener("change", () => {
    setFieldError("quantity", validateField("quantity"))
    updateSummary()
  })

  consentField?.addEventListener("change", () => {
    setFieldError("consent", validateField("consent"))
    if (!validateField("consent") && !statusBox.hidden && statusBox.classList.contains("is-error")) {
      clearStatus()
    }
  })

  checkoutForm.addEventListener("input", (event) => {
    const target = event.target
    applyInputFormatting(target)

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      if (fieldOrder.includes(target.name)) {
        setFieldError(target.name, validateField(target.name))
      }
    }

    updateSummary()
  })

  checkoutForm.addEventListener(
    "blur",
    (event) => {
      const target = event.target
      normalizeOnBlur(target)

      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        if (fieldOrder.includes(target.name)) {
          setFieldError(target.name, validateField(target.name))
        }
      }

      updateSummary()
    },
    true,
  )

  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault()
    clearStatus()

    const invalidFields = validateAllFields()

    if (invalidFields.length) {
      const label = invalidFields.length === 1 ? "field" : "fields"
      setStatus("error", `Please fix the ${invalidFields.length} highlighted ${label} before continuing.`)
      focusField(invalidFields[0])
      return
    }

    const paymentMode = getSelectedPaymentMode()

    if (paymentMode === "whatsapp") {
      setStatus("warning", "You are being redirected to WhatsApp with your filled order details.")
      openWhatsAppCheckout("whatsapp")
      return
    }

    if (paymentMode === "cod") {
      setStatus("warning", "Cash on Delivery requests are being shared on WhatsApp so the team can confirm dispatch.")
      openWhatsAppCheckout("cod")
      return
    }

    if (!getQuantityMeta().packs) {
      setStatus("warning", "Bulk enquiries are being shared on WhatsApp so the team can prepare a custom quote.")
      openWhatsAppCheckout(paymentMode || "whatsapp")
      return
    }

    setStatus("warning", "Your order details are being shared on WhatsApp for quick confirmation from the RudraBitez team.")
    openWhatsAppCheckout(paymentMode || "cod")
  })

  updateSummary()
}
