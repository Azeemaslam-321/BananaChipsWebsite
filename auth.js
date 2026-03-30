const AUTH_USERS_KEY = "rudrabitez-auth-users";
const AUTH_SESSION_KEY = "rudrabitez-auth-session";
const DEMO_EMAIL = "demo@rudrabitez.com";
const DEMO_PASSWORD = "Rudra@123";

document.addEventListener("DOMContentLoaded", () => {
  seedDemoAccount();
  bindPasswordToggles();

  const forms = document.querySelectorAll("[data-auth-mode]");
  forms.forEach((form) => {
    attachLiveValidation(form);
    if (form.dataset.authMode === "register") {
      bindStrengthMeter(form);
    }
    form.addEventListener("submit", (event) => handleSubmit(event, form));
  });

  handlePageMessages();
});

function seedDemoAccount() {
  const users = getUsers();
  if (!users[DEMO_EMAIL]) {
    users[DEMO_EMAIL] = {
      firstName: "Demo",
      lastName: "User",
      email: DEMO_EMAIL,
      phone: "9876543210",
      accountType: "customer",
      password: DEMO_PASSWORD,
      notes: "Presentation account"
    };
    saveUsers(users);
  }
}

function bindPasswordToggles() {
  const toggles = document.querySelectorAll("[data-password-toggle]");
  toggles.forEach((button) => {
    button.addEventListener("click", () => {
      const wrap = button.closest(".authplus-password-wrap");
      const input = wrap ? wrap.querySelector("input") : null;
      if (!input) {
        return;
      }

      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      button.textContent = showing ? "Show" : "Hide";
      button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });
  });
}

function attachLiveValidation(form) {
  const fields = form.querySelectorAll("input, select, textarea");
  fields.forEach((field) => {
    const eventName = field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "input";
    field.addEventListener(eventName, () => validateField(form, field.name));
    field.addEventListener("blur", () => validateField(form, field.name));
  });
}

function bindStrengthMeter(form) {
  const password = form.querySelector('input[name="password"]');
  const meter = form.querySelector("[data-strength-meter]");
  const fill = meter ? meter.querySelector(".authplus-strength-fill") : null;
  const text = meter ? meter.querySelector("p") : null;

  if (!password || !meter || !fill || !text) {
    return;
  }

  const paint = () => {
    const result = getPasswordStrength(password.value);
    fill.style.width = result.width;
    fill.dataset.level = result.level;
    text.textContent = result.message;
  };

  password.addEventListener("input", paint);
  paint();
}

function handleSubmit(event, form) {
  event.preventDefault();

  const mode = form.dataset.authMode;
  const values = getFormValues(form);
  const errors = mode === "register" ? validateRegister(values) : validateSignIn(values);

  paintErrors(form, errors);

  if (Object.keys(errors).length > 0) {
    setStatus(form, "Please fix the highlighted fields and try again.", "error");
    return;
  }

  if (mode === "signin") {
    submitSignIn(form, values);
    return;
  }

  submitRegister(form, values);
}

function submitSignIn(form, values) {
  const users = getUsers();
  const email = normalizeEmail(values.email);
  const user = users[email];

  if (!user || user.password !== values.password.trim()) {
    paintErrors(form, {
      email: "Enter a registered email address.",
      password: "Email and password do not match."
    });
    setStatus(form, "We could not sign you in with those details.", "error");
    return;
  }

  saveSession({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    accountType: user.accountType
  });

  setStatus(form, "Signed in successfully. Redirecting you to the main website...", "success");
  window.setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
}

function submitRegister(form, values) {
  const users = getUsers();
  const email = normalizeEmail(values.email);

  if (users[email]) {
    paintErrors(form, {
      email: "This email is already registered. Please sign in instead."
    });
    setStatus(form, "That email is already in use.", "error");
    return;
  }

  users[email] = {
    firstName: values.first_name.trim(),
    lastName: values.last_name.trim(),
    email,
    phone: digitsOnly(values.phone),
    accountType: values.account_type,
    password: values.password.trim(),
    notes: values.notes.trim()
  };

  saveUsers(users);

  setStatus(form, "Account created successfully. Redirecting you to sign in...", "success");
  form.reset();
  const meterFill = document.querySelector(".authplus-strength-fill");
  if (meterFill) {
    meterFill.style.width = "0%";
  }

  window.setTimeout(() => {
    window.location.href = "signin.html?registered=1";
  }, 1100);
}

function validateField(form, fieldName) {
  const values = getFormValues(form);
  const errors = form.dataset.authMode === "register" ? validateRegister(values) : validateSignIn(values);
  paintSingleError(form, fieldName, errors[fieldName] || "");
}

function validateSignIn(values) {
  const errors = {};

  if (!normalizeEmail(values.email)) {
    errors.email = "Email address is required.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password.trim()) {
    errors.password = "Password is required.";
  } else if (values.password.trim().length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

function validateRegister(values) {
  const errors = {};

  if (!values.first_name.trim()) {
    errors.first_name = "First name is required.";
  } else if (values.first_name.trim().length < 2) {
    errors.first_name = "Enter at least 2 characters.";
  }

  if (!values.last_name.trim()) {
    errors.last_name = "Last name is required.";
  } else if (values.last_name.trim().length < 2) {
    errors.last_name = "Enter at least 2 characters.";
  }

  if (!normalizeEmail(values.email)) {
    errors.email = "Email address is required.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!digitsOnly(values.phone)) {
    errors.phone = "Phone number is required.";
  } else if (digitsOnly(values.phone).length !== 10) {
    errors.phone = "Enter a valid 10 digit phone number.";
  }

  if (!values.account_type) {
    errors.account_type = "Please select an account type.";
  }

  if (!values.password.trim()) {
    errors.password = "Password is required.";
  } else {
    const passwordErrors = getPasswordRuleErrors(values.password);
    if (passwordErrors.length > 0) {
      errors.password = passwordErrors[0];
    }
  }

  if (!values.confirm_password.trim()) {
    errors.confirm_password = "Please confirm your password.";
  } else if (values.confirm_password.trim() !== values.password.trim()) {
    errors.confirm_password = "Passwords do not match.";
  }

  if (values.notes.trim().length > 180) {
    errors.notes = "Keep notes within 180 characters.";
  }

  if (!values.terms) {
    errors.terms = "You must accept the terms to continue.";
  }

  return errors;
}

function getPasswordRuleErrors(password) {
  const value = password.trim();
  const errors = [];

  if (value.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }
  if (!/[A-Z]/.test(value)) {
    errors.push("Add at least one uppercase letter.");
  }
  if (!/[a-z]/.test(value)) {
    errors.push("Add at least one lowercase letter.");
  }
  if (!/[0-9]/.test(value)) {
    errors.push("Add at least one number.");
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    errors.push("Add at least one special character.");
  }

  return errors;
}

function getPasswordStrength(password) {
  const value = password.trim();
  if (!value) {
    return {
      width: "0%",
      level: "empty",
      message: "Password should include uppercase, lowercase, number, and special character."
    };
  }

  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[a-z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 2) {
    return {
      width: "34%",
      level: "weak",
      message: "Weak password. Add more complexity for better security."
    };
  }

  if (score <= 4) {
    return {
      width: "68%",
      level: "medium",
      message: "Good start. Add one more strong rule for a stronger password."
    };
  }

  return {
    width: "100%",
    level: "strong",
    message: "Strong password. This works well for your account."
  };
}

function paintErrors(form, errors) {
  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    if (!input.name) {
      return;
    }
    paintSingleError(form, input.name, errors[input.name] || "");
  });
}

function paintSingleError(form, fieldName, message) {
  if (!fieldName) {
    return;
  }

  const field = form.querySelector(`[name="${fieldName}"]`);
  const error = form.querySelector(`[data-error-for="${fieldName}"]`);

  if (field) {
    const invalid = Boolean(message);
    field.classList.toggle("is-invalid", invalid);
    field.setAttribute("aria-invalid", invalid ? "true" : "false");

    const checkWrap = field.closest(".authplus-check");
    if (checkWrap) {
      checkWrap.classList.toggle("is-invalid", invalid);
    }
  }

  if (error) {
    error.textContent = message;
  }
}

function setStatus(form, message, type) {
  const status = form.parentElement.querySelector("[data-auth-status]");
  if (!status) {
    return;
  }

  status.textContent = message;
  status.className = `authplus-status is-${type}`;
}

function handlePageMessages() {
  const params = new URLSearchParams(window.location.search);
  const status = document.querySelector("[data-auth-status]");
  if (!status) {
    return;
  }

  if (params.get("registered") === "1") {
    status.textContent = "Account created successfully. Please sign in to continue.";
    status.className = "authplus-status is-success";
  }
}

function getFormValues(form) {
  const formData = new FormData(form);
  return {
    first_name: formData.get("first_name") || "",
    last_name: formData.get("last_name") || "",
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    account_type: formData.get("account_type") || "",
    password: formData.get("password") || "",
    confirm_password: formData.get("confirm_password") || "",
    notes: formData.get("notes") || "",
    terms: formData.get("terms") === "on",
    remember: formData.get("remember") === "on"
  };
}

function getUsers() {
  try {
    const raw = window.localStorage.getItem(AUTH_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function saveUsers(users) {
  window.localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function saveSession(session) {
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}
