(function () {
    const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,}$/;

    function digits(value, maxLength) {
        const onlyDigits = String(value || "").replace(/\D/g, "");
        return typeof maxLength === "number" ? onlyDigits.slice(0, maxLength) : onlyDigits;
    }

    function formatPhone(value) {
        const numbers = digits(value, 11);
        if (!numbers) return "";

        if (numbers.length <= 2) return `(${numbers}`;
        if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        if (numbers.length <= 10) {
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
        }
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }

    function formatCpf(value) {
        const numbers = digits(value, 11);
        return numbers
            .replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1-$2");
    }

    function isStrongPassword(value) {
        return STRONG_PASSWORD.test(value || "");
    }

    function passwordRules(value) {
        const password = value || "";
        return {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[^A-Za-z\d\s]/.test(password)
        };
    }

    function strength(value) {
        const rules = Object.values(passwordRules(value));
        const score = rules.filter(Boolean).length;
        if (score <= 2) return "Fraca";
        if (score <= 4) return "Média";
        return "Forte";
    }

    function bindMaskedInput(input, formatter, maxDigits) {
        if (!input) return;
        input.addEventListener("input", () => {
            input.value = formatter(digits(input.value, maxDigits));
        });
    }

    function setFeedback(element, message, type = "info") {
        if (!element) return;
        element.textContent = message || "";
        element.className = `form-feedback ${type}`;
        element.hidden = !message;
    }

    function setupPasswordUI(passwordInput, confirmationInput, container) {
        if (!passwordInput || !container) return;

        const ruleMap = {
            length: container.querySelector('[data-rule="length"]'),
            upper: container.querySelector('[data-rule="upper"]'),
            lower: container.querySelector('[data-rule="lower"]'),
            number: container.querySelector('[data-rule="number"]'),
            special: container.querySelector('[data-rule="special"]')
        };
        const strengthLabel = container.querySelector("[data-password-strength]");
        const confirmationLabel = container.querySelector("[data-password-match]");

        const refresh = () => {
            const rules = passwordRules(passwordInput.value);
            Object.entries(rules).forEach(([key, valid]) => {
                const item = ruleMap[key];
                if (!item) return;
                item.classList.toggle("valid", valid);
                item.setAttribute("aria-current", valid ? "true" : "false");
            });

            if (strengthLabel) {
                strengthLabel.textContent = `Força da senha: ${strength(passwordInput.value)}`;
            }

            passwordInput.setCustomValidity(
                passwordInput.value && !isStrongPassword(passwordInput.value)
                    ? "A senha ainda não atende a todos os requisitos."
                    : ""
            );

            if (confirmationInput) {
                const matches = !confirmationInput.value || confirmationInput.value === passwordInput.value;
                confirmationInput.setCustomValidity(matches ? "" : "As senhas não coincidem.");
                if (confirmationLabel) {
                    confirmationLabel.textContent = matches || !confirmationInput.value
                        ? ""
                        : "As senhas não coincidem.";
                }
            }
        };

        passwordInput.addEventListener("input", refresh);
        confirmationInput?.addEventListener("input", refresh);
        refresh();
    }

    function bindPasswordToggle(button, ...inputs) {
        if (!button) return;
        button.addEventListener("click", () => {
            const reveal = inputs.some(input => input?.type === "password");
            inputs.forEach(input => {
                if (input) input.type = reveal ? "text" : "password";
            });
            button.textContent = reveal ? "Ocultar senha" : "Mostrar senha";
            button.setAttribute("aria-pressed", reveal ? "true" : "false");
        });
    }

    window.EspectroCareForms = Object.freeze({
        digits,
        formatPhone,
        formatCpf,
        isStrongPassword,
        bindMaskedInput,
        setFeedback,
        setupPasswordUI,
        bindPasswordToggle
    });
})();
