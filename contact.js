/**
 * Contact Form Handler
 * Uses FormSubmit.co AJAX endpoint to send emails without page redirect.
 *
 * IMPORTANT — One-time setup:
 * The very first time this form is submitted on a live server,
 * FormSubmit will send an activation email to shubh2014shiv@gmail.com.
 * Click "Activate Form" in that email. After activation, every submission
 * will arrive directly in your Gmail inbox.
 */

(function () {
  "use strict";

  const FORMSUBMIT_ENDPOINT =
    "https://formsubmit.co/ajax/shubh2014shiv@gmail.com";

  // Max 2 retries on network failure
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 1500;

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const nameInput = document.getElementById("contactName");
    const emailInput = document.getElementById("contactEmail");
    const messageInput = document.getElementById("contactMessage");
    const submitBtn = document.getElementById("contactSubmitBtn");

    // ─── Helpers ────────────────────────────────────────────────────────────

    function toast(message, isError = false) {
      if (typeof showToast === "function") {
        showToast(message, isError);
      } else {
        // Fallback if showToast isn't in scope yet
        alert(message);
      }
    }

    function setLoading(loading) {
      if (!submitBtn) return;
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? "Sending…" : "Send Message";
    }

    function validate(name, email, message) {
      if (!name) return "Please enter your name.";
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return "Please enter a valid email address.";
      if (!message) return "Please write a message before sending.";
      return null; // valid
    }

    // ─── Fetch with retry ────────────────────────────────────────────────────

    async function postWithRetry(payload, attempts) {
      try {
        const response = await fetch(FORMSUBMIT_ENDPOINT, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: payload,
        });

        // Parse JSON safely
        let data = null;
        try {
          data = await response.json();
        } catch (_) {
          // FormSubmit occasionally returns non-JSON on activation pages
        }

        if (!response.ok) {
          const msg =
            (data && data.message) ||
            `Server responded with status ${response.status}.`;
          throw new Error(msg);
        }

        // FormSubmit returns { success: "true" } (string, not boolean)
        const succeeded =
          data &&
          (data.success === true || data.success === "true");

        if (!succeeded) {
          throw new Error(
            data?.message || "Unexpected response from the mail service."
          );
        }

        return data;
      } catch (err) {
        // Retry on network errors (TypeError) or 5xx, not on validation errors
        const isRetryable =
          err instanceof TypeError || // network failure
          (err.message && err.message.includes("status 5")); // 5xx

        if (isRetryable && attempts > 0) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          return postWithRetry(payload, attempts - 1);
        }

        throw err;
      }
    }

    // ─── Submit handler ──────────────────────────────────────────────────────

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = (nameInput?.value || "").trim();
      const email = (emailInput?.value || "").trim();
      const message = (messageInput?.value || "").trim();

      // Client-side validation
      const validationError = validate(name, email, message);
      if (validationError) {
        toast(validationError, true);
        return;
      }

      setLoading(true);

      // Build FormData — FormSubmit reads these field names directly
      const formData = new FormData();
      formData.set("name", name);
      formData.set("email", email);
      formData.set("message", message);
      formData.set("_subject", `Portfolio Contact from ${name}`);
      formData.set("_captcha", "false");
      formData.set("_template", "table");
      // Send auto-reply to the visitor
      formData.set(
        "_autoresponse",
        `Hi ${name},\n\nThank you for reaching out! I've received your message and will get back to you shortly.\n\n— Shubham Singh`
      );
      // Honeypot stays empty (bots fill it, we ignore those)
      formData.set("_honey", "");

      try {
        await postWithRetry(formData, MAX_RETRIES);
        toast("✓ Message sent! I'll get back to you soon.");
        form.reset();
      } catch (err) {
        console.error("[ContactForm] Submission failed:", err);

        // Give user a clear, actionable message
        if (
          err instanceof TypeError ||
          (err.message && err.message.toLowerCase().includes("network"))
        ) {
          toast(
            "Network error — please check your connection and try again.",
            true
          );
        } else if (
          err.message &&
          err.message.toLowerCase().includes("activate")
        ) {
          // FormSubmit needs first-time activation
          toast(
            "Almost there! Check shubh2014shiv@gmail.com for an activation email from FormSubmit and click 'Activate Form', then try again.",
            true
          );
        } else {
          toast(
            "Message could not be sent. Please try again or email me directly.",
            true
          );
        }
      } finally {
        setLoading(false);
      }
    });
  });
})();
